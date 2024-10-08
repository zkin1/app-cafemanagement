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
  ) {}

  async ngOnInit() {
    await this.loadProducts();
  }

  loadProducts() {
    this.loadingController.create({
      message: 'Cargando productos...',
    }).then(loading => {
      loading.present();
  
      this.databaseService.getAllProducts().subscribe({
        next: (dbProducts) => {
          this.products = dbProducts.map(product => ({
            ...product,
            showOptions: false,
            selectedSize: 'medium',
            selectedMilk: 'regular'
          }));
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.presentToast('Error al cargar los productos. Por favor, intente de nuevo.');
        },
        complete: () => loading.dismiss(),
      });
    });
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  get currentUserName(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.name || null;
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
        finalPrice: this.calculatePrice(product)
      });
    }

    product.showOptions = false;

    await this.presentToast(`${product.name} (${product.selectedSize}, ${product.selectedMilk}) añadido a la orden #${this.currentOrderNumber}`);
    this.updateLocalStorage();
  }

  updateLocalStorage() {
    localStorage.setItem('currentOrder', JSON.stringify({
      orderNumber: this.currentOrderNumber,
      items: this.currentOrderItems
    }));
  }

  async completeOrder() {
    if (this.currentOrderItems.length === 0) {
      await this.presentToast('El carrito está vacío. Añada productos antes de completar la orden.');
      return;
    }

    this.updateLocalStorage();
    this.router.navigate(['/carro-compras']);
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
}