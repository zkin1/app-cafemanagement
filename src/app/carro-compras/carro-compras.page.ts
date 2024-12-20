import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';

interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  selectedSize: string;
  selectedMilk: string;
  quantity: number;
  finalPrice: number;
}

@Component({
  selector: 'app-carro-compras',
  templateUrl: './carro-compras.page.html',
  styleUrls: ['./carro-compras.page.scss'],
})
export class CarroComprasPage implements OnInit {
  showToast: boolean = false;
  toastMessage: string = '';
  
  currentOrder: Order & { items: any[] } = {
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
  currentOrderItems: any[] = [];
  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadOrder();
  }

  private getCurrentUserId(): number | null {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.id || null;
  }
  loadOrder() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
  
    const storedOrder = JSON.parse(localStorage.getItem(`cart_${userId}`) || 'null');
    if (storedOrder && storedOrder.userId === userId) {
      this.currentOrder.orderNumber = storedOrder.orderNumber;
      this.currentOrder.items = storedOrder.items;
      this.currentOrderItems = storedOrder.items;
    } else {
      this.router.navigate(['/main']);
    }
    this.calculateTotal();
  }

  calculateTotal(): number {
    this.currentOrder.totalAmount = this.currentOrderItems.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
    return this.currentOrder.totalAmount;
  }

  async updateQuantity(item: CartItem, change: number) {
    item.quantity += change;
    if (item.quantity <= 0) {
      await this.removeItem(item);
    } else {
      this.calculateTotal();
      this.updateLocalStorage();
    }
  }

  async removeItem(item: CartItem) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar ${item.name} de su orden?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            const index = this.currentOrderItems.indexOf(item);
            if (index > -1) {
              this.currentOrderItems.splice(index, 1);
              this.calculateTotal();
              this.updateLocalStorage();
              this.presentToast('Producto eliminado de la orden');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  updateLocalStorage() {
    const userId = this.getCurrentUserId();
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify({
        orderNumber: this.currentOrder.id,
        items: this.currentOrderItems
      }));
    }
  }


  async confirmarOrden() {
    if (this.currentOrderItems.length === 0) {
      await this.presentToast('No hay productos en la orden. Añada productos antes de confirmar.');
      return;
    }
  
    if (this.currentOrder.tableNumber === null) {
      await this.presentToast('Por favor, seleccione un número de mesa antes de confirmar la orden.');
      return;
    }

    const userId = this.getCurrentUserId();
    if (!userId) {
      await this.presentToast('Error: Sesión no válida. Por favor, inicie sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }
  
    const loading = await this.loadingController.create({
      message: 'Procesando orden...',
    });
    await loading.present();
  
    try {
      // Asignamos el userId
      this.currentOrder.userId = userId;
  
      const orderToSave: Order = {
        userId: this.currentOrder.userId,
        orderNumber: this.currentOrder.orderNumber,
        tableNumber: this.currentOrder.tableNumber,
        status: 'Solicitado',
        notes: this.currentOrder.notes,
        totalAmount: this.calculateTotal(),
        paymentMethod: '',
      };
  
      const orderId = await this.databaseService.createOrder(orderToSave);
  
      // Añadir los items de la orden
      for (const item of this.currentOrderItems) {
        const orderDetail: OrderDetail = {
          orderId: orderId,
          productId: item.id,
          quantity: item.quantity,
          size: item.selectedSize,
          milkType: item.selectedMilk,
          price: item.finalPrice
        };
        await this.databaseService.addProductToOrder(orderDetail);
      }
  
      // Limpiar datos específicos del usuario actual
      localStorage.removeItem(`cart_${userId}`);
      localStorage.removeItem(`lastOrderNumber_${userId}`);
      
      // Resetear el carrito
      this.currentOrderItems = [];
      this.currentOrder.items = [];
      
      await loading.dismiss();
      await this.presentToast('Orden confirmada con éxito');
      
      // Navegar a la página principal
      this.router.navigate(['/main']);
  
    } catch (error) {
      console.error('Error al confirmar la orden:', error);
      await loading.dismiss();
      await this.presentToast('Error al confirmar la orden. Por favor, intente de nuevo.');
    }
}

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }
}