import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';
import { Subscription, Observable, from, of } from 'rxjs';
import { mergeMap, toArray, map, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-comandas',
  templateUrl: './comandas.page.html',
  styleUrls: ['./comandas.page.scss'],
})
export class ComandasPage implements OnInit, OnDestroy {

  showToast: boolean = false;
  toastMessage: string = '';
  
  ordenes: Order[] = [];
  private subscriptions: Subscription = new Subscription();
  
  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.cargarOrdenes();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async cargarOrdenes() {
    const loading = await this.loadingController.create({
      message: 'Cargando órdenes...',
    });
    await loading.present();

    try {
      const ordenes = await this.getOrdersByStatus(['Solicitado', 'En proceso', 'Listo']);
      this.ordenes = ordenes;
      await this.cargarDetallesOrdenes();
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      this.presentToast('Error al cargar órdenes. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private getOrdersByStatus(statuses: string[]): Promise<Order[]> {
    const result = this.databaseService.getOrdersByStatus(statuses);
    if (result instanceof Observable) {
      return firstValueFrom(result.pipe(
        map((orders: Order[]) => orders || []),
        catchError(() => of([]))
      ));
    }
    return Promise.resolve(result || []);
  }

  async cargarDetallesOrdenes() {
    const detallesPromises = this.ordenes.map(async (orden) => {
      try {
        const detalles = await this.getOrderDetails(orden.id!);
        orden.items = detalles;
        return orden;
      } catch (error) {
        console.error(`Error al cargar detalles para la orden ${orden.id}:`, error);
        return orden;
      }
    });
  
    try {
      this.ordenes = await Promise.all(detallesPromises);
      console.log('Órdenes con detalles:', this.ordenes);  // Para depuración
    } catch (error) {
      console.error('Error al cargar detalles de órdenes:', error);
    }
  }

  private async getOrderDetails(orderId: number): Promise<OrderDetail[]> {
    try {
      const result = this.databaseService.getOrderDetails(orderId);
      if (result instanceof Observable) {
        return await firstValueFrom(result.pipe(
          map(details => details || []),
          catchError(() => of([]))
        ));
      }
      return result || [];
    } catch (error) {
      console.error(`Error al obtener detalles de la orden ${orderId}:`, error);
      return [];
    }
  }

  async cambiarEstado(orden: Order, nuevoEstado: 'En proceso' | 'Listo' | 'Cancelado' | 'Entregado') {
    if (!orden.id) {
      this.presentToast('Error: ID de orden no válido');
      return;
    }
  
    try {
      await this.updateOrderStatus(orden.id, nuevoEstado);
      orden.status = nuevoEstado;
      this.presentToast(`Orden #${orden.id} actualizada a ${nuevoEstado}`);
  
      if (nuevoEstado === 'Entregado' || nuevoEstado === 'Cancelado') {
        await this.cargarOrdenes();
      }
    } catch (error) {
      console.error('Error al actualizar estado de la orden:', error);
      this.presentToast('Error al actualizar el estado. Por favor, intente de nuevo.');
    }
  }

  private async updateOrderStatus(orderId: number, status: string): Promise<void> {
    const result = this.databaseService.updateOrderStatus(orderId, status);
    if (result instanceof Observable) {
      await firstValueFrom(result.pipe(
        map(() => {}),
        catchError(() => of(undefined))
      ));
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

  getOrderTotal(orden: Order): number {
    return orden.items?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
  }
}