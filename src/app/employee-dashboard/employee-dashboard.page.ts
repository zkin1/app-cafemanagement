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
  employeeProfilePicture: string | null = null;
  ordersToday: number = 0;
  pendingOrders: number = 0;
  profilePicture: string | null = null;


  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private databaseService: DatabaseService
  ) { }

  ngOnInit() {
    this.loadEmployeeData();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.profilePicture = currentUser.profilePicture || null;
  }

  async loadEmployeeData() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();
  
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.employeeName = currentUser.name || 'Empleado';
  
      // Cargar la foto de perfil
      if (currentUser.id) {
        try {
          const profilePicture = await this.databaseService.getUserProfilePicture(currentUser.id).toPromise();
          this.employeeProfilePicture = profilePicture !== undefined ? profilePicture : null;
          console.log('Foto de perfil cargada:', this.employeeProfilePicture);
        } catch (error) {
          console.error('Error al cargar la foto de perfil:', error);
          this.employeeProfilePicture = null;
        }
      }
  
      // Obtener el número real de órdenes del día
      this.ordersToday = await this.databaseService.getOrderCountForToday();
      console.log('Número de órdenes del día:', this.ordersToday);
  
      // Obtener el número real de órdenes pendientes
      this.pendingOrders = await this.databaseService.getOrdersCount(['Solicitado', 'En proceso']);
      console.log('Número de órdenes pendientes:', this.pendingOrders);
  
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      this.presentToast('Error al cargar datos. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
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

  handleImageError(event: any) {
    event.target.src = 'assets/default-avatar.png';
  }
}