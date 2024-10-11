import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { Product } from '../models/product.model';
import { trigger, state, style, animate, transition } from '@angular/animations';

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

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    const lastOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '0');
    this.currentOrderNumber = lastOrderNumber + 1;
  }

  ngOnInit() {
    this.loadProducts();
    this.resetOrderNumber();
    this.loadCurrentOrder();
  }


  loadCurrentOrder() {
    const storedOrder = JSON.parse(localStorage.getItem('currentOrder') || 'null');
    if (storedOrder) {
      this.currentOrderNumber = storedOrder.orderNumber;
      this.currentOrderItems = storedOrder.items || [];
    } else {
      this.currentOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '0') + 1;
      this.currentOrderItems = [];
    }
    console.log('Current order loaded:', { number: this.currentOrderNumber, items: this.currentOrderItems });
  }

  async loadProducts() {
    const loading = await this.loadingController.create({
      message: 'Cargando productos...',
    });
    await loading.present();
  
    try {
      const products = await this.getAllProducts();
      console.log('Productos obtenidos de la base de datos:', products);
  
      const extendedProducts = products.map(product => ({
        ...product,
        imageURL: product.imageURL ? `assets/${product.imageURL}` : 'assets/default-product-image.jpg',
        showOptions: false,
        selectedSize: 'medium',
        selectedMilk: 'regular'
      }));
  
      // Eliminar duplicados
      this.products = Array.from(new Set(extendedProducts.map(p => p.id)))
        .map(id => extendedProducts.find(p => p.id === id))
        .filter((p): p is ExtendedProduct => p !== undefined);
  
      console.log('Productos procesados con URLs de imagen actualizadas:', this.products);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      this.presentToast('Error al cargar los productos. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }


  private getAllProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      this.databaseService.getAllProducts().subscribe({
        next: (products) => {
          console.log('Productos recibidos del servicio:', products);
          resolve(products);
        },
        error: (err) => {
          console.error('Error al obtener productos:', err);
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
  
    await this.presentToast(`${product.name} (${product.selectedSize}, ${product.selectedMilk}) añadido a la orden #${this.currentOrderNumber}`);
    this.updateLocalStorage();
    console.log('Item added to cart:', this.currentOrderItems);
  }

  updateLocalStorage() {
    localStorage.setItem('currentOrder', JSON.stringify({
      orderNumber: this.currentOrderNumber,
      items: this.currentOrderItems
    }));
    console.log('Local storage updated:', { number: this.currentOrderNumber, items: this.currentOrderItems });
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

  resetOrderNumber() {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = localStorage.getItem('lastResetDate');
    
    if (lastResetDate !== today) {
      localStorage.setItem('lastOrderNumber', '0');
      localStorage.setItem('lastResetDate', today);
    }
    
    const lastOrderNumber = parseInt(localStorage.getItem('lastOrderNumber') || '0');
    this.currentOrderNumber = lastOrderNumber + 1;
  }
  

}


