import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
})
export class AdminDashboardPage implements OnInit {
  adminName: string = 'Admin';
  orderCount: number = 0;
  activeEmployees: number = 0;

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private databaseService: DatabaseService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();
  
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.adminName = currentUser.name || 'Admin';
  
      // Obtener el número real de órdenes del día
      this.orderCount = await this.databaseService.getOrderCountForToday();
  
      // Obtener el número real de empleados activos
      this.activeEmployees = await this.databaseService.getActiveEmployeesCount();
  
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