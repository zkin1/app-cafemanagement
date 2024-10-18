import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.page.html',
  styleUrls: ['./employee-dashboard.page.scss'],
})
export class EmployeeDashboardPage implements OnInit {
  employeeName: string = 'Empleado';
  ordersToday: number = 0;
  pendingOrders: number = 0;

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private databaseService: DatabaseService
  ) { }

  ngOnInit() {
    this.loadEmployeeData();
  }

  async loadEmployeeData() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();
  
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.employeeName = currentUser.name || 'Empleado';
  
      // Obtener el número real de órdenes del día
      this.ordersToday = await this.databaseService.getOrderCountForToday();
  
      // Obtener el número real de órdenes pendientes
      this.pendingOrders = await this.databaseService.getOrdersCount(['Solicitado', 'En proceso']);
  
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      this.presentToast('Error al cargar datos. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}