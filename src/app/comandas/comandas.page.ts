import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';

@Component({
  selector: 'app-comandas',
  templateUrl: './comandas.page.html',
  styleUrls: ['./comandas.page.scss'],
})
export class ComandasPage implements OnInit {

  showToast: boolean = false;
  toastMessage: string = '';
  
  ordenes: Order[] = [];
  
  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    await this.cargarOrdenes();
  }

  async cargarOrdenes() {
    const loading = await this.loadingController.create({
      message: 'Cargando órdenes...',
    });
    await loading.present();

    try {
      // Cargamos todas las órdenes que no estén en estado 'Entregado' o 'Cancelado'
      this.ordenes = await this.databaseService.getOrdersByStatus(['Solicitado', 'En proceso', 'Listo']);
      // Cargamos los detalles de cada orden
      for (let orden of this.ordenes) {
        orden.items = await this.databaseService.getOrderDetails(orden.id!);
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      this.presentToast('Error al cargar órdenes. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }

  async cambiarEstado(orden: Order, nuevoEstado: 'En proceso' | 'Listo' | 'Cancelado' | 'Entregado') {
    const loading = await this.loadingController.create({
      message: 'Actualizando estado...',
    });
    await loading.present();

    try {
      await this.databaseService.updateOrderStatus(orden.id!, nuevoEstado);
      orden.status = nuevoEstado;
      this.presentToast(`Orden #${orden.id} actualizada a ${nuevoEstado}`);

      // Si la orden se entrega o cancela, la removemos de la lista
      if (nuevoEstado === 'Entregado' || nuevoEstado === 'Cancelado') {
        this.ordenes = this.ordenes.filter(o => o.id !== orden.id);
      }
    } catch (error) {
      console.error('Error al actualizar estado de la orden:', error);
      this.presentToast('Error al actualizar el estado. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  // Método para obtener el total de una orden
  getOrderTotal(orden: Order): number {
    return orden.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  }
}