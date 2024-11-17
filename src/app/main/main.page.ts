import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { Product } from '../models/product.model';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface ExtendedProduct extends Product {
  showOptions: boolean;
  selectedSize: string;
  selectedMilk: string;
  imageURL: string;
}


@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('200ms ease-out', style({ transform: 'translateY(0%)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class MainPage implements OnInit {
  products: ExtendedProduct[] = [];
  currentOrderNumber: number = 1;
  currentOrderItems: any[] = [];
  isLoading: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';

  currentOrder: {
    orderNumber: number;
    id: number;
    userId: number;
    tableNumber: number | null;
    status: string;
    notes: string;
    totalAmount: number;
    paymentMethod: string;
    items: any[];
  } = {
    orderNumber: 0,
    id: 0,
    userId: 0,
    tableNumber: null,
    status: 'Solicitado',
    notes: '',
    totalAmount: 0,
    paymentMethod: '',
    items: []
  };



  private navigationSubscription: Subscription = new Subscription();
  
  private getCurrentUserId(): number | null {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.id || null;
  }

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController,
    
    private loadingController: LoadingController
    
  ) {
    const lastOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '0');
    this.currentOrderNumber = lastOrderNumber + 1;
    this.navigationSubscription = new Subscription();
    this.loadCurrentOrderNumber();
  }

  ngOnInit() {
    // Llamar a loadProducts solo una vez cuando la página se inicializa
    this.loadProducts();
    this.loadCurrentOrder(); // Carga de la orden actual
    
    // Mantén la lógica de la suscripción para la orden, pero sin recargar los productos
    this.navigationSubscription.add(
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.loadCurrentOrder(); // Solo recargar la orden, no los productos
      })
    );
  }
  
  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  loadCurrentOrder() {
    const userId = this.getCurrentUserId();
    
    // Si no hay usuario actual, limpiar el carrito
    if (!userId) {
      this.currentOrderItems = [];
      this.currentOrder = {
        orderNumber: 0,
        id: 0,
        userId: 0,
        tableNumber: null,
        status: 'Solicitado',
        notes: '',
        totalAmount: 0,
        paymentMethod: '',
        items: []
      };
      return;
    }
  
    // Cargar el carrito específico del usuario actual
    const storedOrder = JSON.parse(localStorage.getItem(`cart_${userId}`) || 'null');
    if (storedOrder) {
      // Verificar que el carrito pertenezca al usuario actual
      if (storedOrder.userId === userId) {
        this.currentOrder.orderNumber = storedOrder.orderNumber;
        this.currentOrder.items = storedOrder.items;
        this.currentOrderItems = storedOrder.items;
      } else {
        // Si el carrito pertenece a otro usuario, limpiarlo
        this.resetCart();
      }
    } else {
      this.loadCurrentOrderNumber();
      this.currentOrderItems = [];
    }
  }
  

  resetCart() {
    const userId = this.getCurrentUserId();
    if (userId) {
      const lastOrderNumber = parseInt(localStorage.getItem(`lastOrderNumber_${userId}`) || '0');
      this.currentOrderNumber = lastOrderNumber + 1;
      localStorage.setItem(`lastOrderNumber_${userId}`, this.currentOrderNumber.toString());
    }
  }


  async loadProducts() {
    const loading = await this.loadingController.create({
      message: 'Cargando productos...',
    });
    await loading.present();
  
    try {
      const products = await this.getAllProducts();
      console.log('Productos obtenidos de la base de datos:', products);
  
      this.products = products.map(product => ({
        ...product,
        imageURL: this.getImageUrl(product.imageURL),
        showOptions: false,
        selectedSize: 'medium',
        selectedMilk: 'regular'
      }));
  
      console.log('Productos procesados:', this.products);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      await this.presentToast('Error al cargar los productos. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }
  private getImageUrl(imageUri: string): string {
    if (!imageUri) {
      return 'assets/default-product-image.jpg';
    }
  
    if (imageUri.startsWith('data:image') || imageUri.startsWith('assets/')) {
      return imageUri;
    }
  
    return `assets/${imageUri}`;
  }

  private getAllProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      this.databaseService.getAllProducts().subscribe({
        next: (products) => {
          resolve(products);
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  get currentUserName(): string | null {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);
      return user.name || null;
    }
    return null;
  }
  toggleOptions(index: number) {
    this.products[index].showOptions = !this.products[index].showOptions;
  }

  calculatePrice(product: ExtendedProduct): number {
    let adjustedPrice = product.price;
    if (product.selectedSize === 'pequeño') {
      adjustedPrice -= 1000;
    } else if (product.selectedSize === 'grande') {
      adjustedPrice += 1000;
    }
    return adjustedPrice;
  }

  updatePrice(product: ExtendedProduct) {
    // La lógica para actualizar el precio puede ir aquí si es necesario
  }

  async addToCart(product: ExtendedProduct) {
    if (!this.isLoggedIn) {
      await this.presentToast('Por favor, inicia sesión para añadir productos al carrito');
      this.router.navigate(['/login']);
      return;
    }
  
    const existingItemIndex = this.currentOrderItems.findIndex(item => 
      item.id === product.id && 
      item.selectedSize === product.selectedSize && 
      item.selectedMilk === product.selectedMilk
    );
  
    if (existingItemIndex !== -1) {
      this.currentOrderItems[existingItemIndex].quantity += 1;
    } else {
      this.currentOrderItems.push({
        ...product,
        quantity: 1,
        finalPrice: this.calculatePrice(product),
        image: product.imageURL
      });
    }
  
    product.showOptions = false;
  
    this.updateLocalStorage();
    console.log('Item added to cart:', this.currentOrderItems);
  }

  updateLocalStorage() {
    const userId = this.getCurrentUserId();
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify({
        orderNumber: this.currentOrderNumber,
        userId: userId, // Añadir el userId al objeto guardado
        items: this.currentOrderItems
      }));
      localStorage.setItem(`lastOrderNumber_${userId}`, this.currentOrderNumber.toString());
    }
  }
  async completeOrder() {
    if (this.currentOrderItems.length === 0) {
      await this.presentToast('El carrito está vacío. Añada productos antes de completar la orden.');
      return;
    }

  // Guardar el número de orden actual antes de navegar
  const currentOrderNumber = this.currentOrderNumber;

  
    this.updateLocalStorage();
    this.router.navigate(['/carro-compras']);
    
    // Resetear el carrito después de navegar
    this.currentOrderItems = [];
    this.currentOrderNumber++;
    this.updateLocalStorage();

    setTimeout(() => {
      this.currentOrderItems = [];
      this.currentOrderNumber = currentOrderNumber + 1;
      this.updateLocalStorage();
    }, 100);
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }
  
  loadCurrentOrderNumber() {
    const userId = this.getCurrentUserId();
    if (userId) {
      const lastOrderNumber = parseInt(localStorage.getItem(`lastOrderNumber_${userId}`) || '0');
      this.currentOrderNumber = lastOrderNumber + 1;
      localStorage.setItem(`lastOrderNumber_${userId}`, this.currentOrderNumber.toString());
    }
  }

  // Método para manejar la actualización de cantidad directamente en la página principal
  updateQuantity(product: ExtendedProduct, change: number) {
    const index = this.currentOrderItems.findIndex(item => 
      item.id === product.id && 
      item.selectedSize === product.selectedSize && 
      item.selectedMilk === product.selectedMilk
    );

    if (index !== -1) {
      this.currentOrderItems[index].quantity += change;
      if (this.currentOrderItems[index].quantity <= 0) {
        this.currentOrderItems.splice(index, 1);
      }
    }

    this.updateLocalStorage();
  }

  // Método para obtener la cantidad actual de un producto en el carrito
  getQuantityInCart(product: ExtendedProduct): number {
    const item = this.currentOrderItems.find(item => 
      item.id === product.id && 
      item.selectedSize === product.selectedSize && 
      item.selectedMilk === product.selectedMilk
    );
    return item ? item.quantity : 0;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/default-product-image.jpg';
  }

}


