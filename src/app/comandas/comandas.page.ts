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

  ordenesSolicitadas: Order[] = [];
  ordenesEnProceso: Order[] = [];
  ordenesListas: Order[] = [];
  ordenesCanceladas: Order[] = [];
  totalOrdenesDiarias: number = 0;
  showToast: boolean = false;
  toastMessage: string = '';
  
  ordenes: Order[] = [];
  private subscriptions: Subscription = new Subscription();
  
  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    await this.cargarOrdenes();
    await this.calcularTotalOrdenesDiarias();
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
      const ordenes = await firstValueFrom(this.databaseService.getOrdersByStatus(['Solicitado', 'En proceso', 'Listo', 'Cancelado']));
      console.log('Órdenes obtenidas:', ordenes);
      
      const ordenesConDetalles = await Promise.all(ordenes.map(async (orden) => {
        const detalles = await firstValueFrom(this.databaseService.getOrderDetails(orden.id!));
        return { 
          ...orden, 
          items: detalles,
          id: orden.id ?? 0,
          tableNumber: orden.tableNumber ?? 0
        };
      }));
      
      this.ordenesSolicitadas = ordenesConDetalles.filter(orden => orden.status === 'Solicitado');
      this.ordenesEnProceso = ordenesConDetalles.filter(orden => orden.status === 'En proceso');
      this.ordenesListas = ordenesConDetalles.filter(orden => orden.status === 'Listo');
      this.ordenesCanceladas = ordenesConDetalles.filter(orden => orden.status === 'Cancelado');
      
      console.log('Órdenes procesadas:', {
        solicitadas: this.ordenesSolicitadas,
        enProceso: this.ordenesEnProceso,
        listas: this.ordenesListas,
        canceladas: this.ordenesCanceladas
      });
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

      this.moverOrden(orden);

    } catch (error) {
      console.error('Error al actualizar estado de la orden:', error);
      this.presentToast('Error al actualizar el estado. Por favor, intente de nuevo.');
    }
  }

  private moverOrden(orden: Order) {
    // Remover la orden de su lista actual
    this.ordenesSolicitadas = this.ordenesSolicitadas.filter(o => o.id !== orden.id);
    this.ordenesEnProceso = this.ordenesEnProceso.filter(o => o.id !== orden.id);
    this.ordenesListas = this.ordenesListas.filter(o => o.id !== orden.id);
    this.ordenesCanceladas = this.ordenesCanceladas.filter(o => o.id !== orden.id);

    // Añadir la orden a su nueva lista
    switch (orden.status) {
      case 'Solicitado':
        this.ordenesSolicitadas.push(orden);
        break;
      case 'En proceso':
        this.ordenesEnProceso.push(orden);
        break;
      case 'Listo':
        this.ordenesListas.push(orden);
        break;
      case 'Cancelado':
        this.ordenesCanceladas.push(orden);
        break;
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

  currentSegment: string = 'solicitadas';

  segmentChanged(event: any) {
    console.log('Segment changed', event);
    this.currentSegment = event.detail.value;
  }

  hayOrdenes(): boolean {
    return this.ordenesSolicitadas.length > 0 || 
           this.ordenesEnProceso.length > 0 || 
           this.ordenesListas.length > 0 || 
           this.ordenesCanceladas.length > 0;
  }

  async calcularTotalOrdenesDiarias() {
    const fechaActual = new Date().toISOString().split('T')[0]; // Obtiene la fecha actual en formato YYYY-MM-DD
    try {
      this.totalOrdenesDiarias = await this.databaseService.getOrdersCount(['Solicitado', 'En proceso', 'Listo', 'Entregado'], fechaActual);
    } catch (error) {
      console.error('Error al calcular el total de órdenes diarias:', error);
      this.presentToast('Error al calcular el total de órdenes diarias.');
    }
  }

  totalOrdenes(): number {
    return this.ordenesSolicitadas.length + 
           this.ordenesEnProceso.length + 
           this.ordenesListas.length + 
           this.ordenesCanceladas.length;
  }

}