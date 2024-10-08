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
    const detallesObservables = this.ordenes.map(orden =>
      from(this.getOrderDetails(orden.id!)).pipe(
        mergeMap(detalles => {
          orden.items = detalles;
          return [orden];
        })
      )
    );

    this.subscriptions.add(
      from(detallesObservables).pipe(
        mergeMap(obs => obs),
        toArray()
      ).subscribe(
        () => {},
        error => console.error('Error al cargar detalles de órdenes:', error)
      )
    );
  }

  private getOrderDetails(orderId: number): Promise<OrderDetail[]> {
    const result = this.databaseService.getOrderDetails(orderId);
    if (result instanceof Observable) {
      return result.pipe(
        map(details => details || []),
        catchError(() => of([]))
      ).toPromise().then(value => value ?? []);
    }
    return Promise.resolve(result || []);
  }

  async cambiarEstado(orden: Order, nuevoEstado: 'En proceso' | 'Listo' | 'Cancelado' | 'Entregado') {
    try {
      await this.updateOrderStatus(orden.id!, nuevoEstado);
      orden.status = nuevoEstado;
      this.presentToast(`Orden #${orden.id} actualizada a ${nuevoEstado}`);
  
      // Actualiza la lista de órdenes si el estado es Entregado o Cancelado
      if (nuevoEstado === 'Entregado' || nuevoEstado === 'Cancelado') {
        await this.cargarOrdenes(); // Vuelve a cargar todas las órdenes
      }
    } catch (error) {
      console.error('Error al actualizar estado de la orden:', error);
      this.presentToast('Error al actualizar el estado. Por favor, intente de nuevo.');
    }
  }

  private updateOrderStatus(orderId: number, status: string): Promise<void> {
    const result = this.databaseService.updateOrderStatus(orderId, status);
    if (result instanceof Observable) {
      return result.pipe(
        map(() => {}),
        catchError(() => of(undefined))
      ).toPromise();
    }
    return Promise.resolve();
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
    return orden.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  }
}