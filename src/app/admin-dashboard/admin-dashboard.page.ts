import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
})
export class AdminDashboardPage implements OnInit {
  adminName: string = 'Admin';
  adminProfilePicture: string | null = null;
  orderCount: number = 0;
  activeEmployees: number = 0;
  pendingUsers: User[] = [];
  profilePicture: string | null = null;

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private databaseService: DatabaseService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
    this.loadPendingUsers();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.profilePicture = currentUser.profilePicture || null;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/default-avatar.png';
  }
  async loadDashboardData() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();
  
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.adminName = currentUser.name || 'Admin';
      this.adminProfilePicture = currentUser.profilePicture || null;
  
      // Si no hay foto en localStorage, intenta cargarla de la base de datos
      if (!this.adminProfilePicture && currentUser.id) {
        try {
          const profilePicture = await this.databaseService.getUserProfilePicture(currentUser.id).toPromise();
          this.adminProfilePicture = profilePicture !== undefined ? profilePicture : null;
          // Actualizar el localStorage con la imagen cargada
          if (this.adminProfilePicture) {
            currentUser.profilePicture = this.adminProfilePicture;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
        } catch (error) {
          console.error('Error al cargar la foto de perfil:', error);
        }
      }
  
      // Obtener el número real de órdenes del día
      this.orderCount = await this.databaseService.getOrderCountForToday();
      console.log('Número de órdenes del día:', this.orderCount);
  
      // Obtener el número real de empleados activos
      this.activeEmployees = await this.databaseService.getActiveEmployeesCount();
      console.log('Número de empleados activos:', this.activeEmployees);
  
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      await this.presentToast('Error al cargar datos. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  async loadPendingUsers() {
    try {
      console.log('Cargando usuarios pendientes');
      const users = await this.databaseService.getPendingUsers().toPromise();
      console.log('Usuarios pendientes obtenidos:', users);
      this.pendingUsers = users || []; 
    } catch (error) {
      console.error('Error al cargar usuarios pendientes:', error);
      this.presentToast('Error al cargar usuarios pendientes.');
      this.pendingUsers = []; 
    }
  }

  async approveUser(userId: number) {
    try {
      console.log('Intentando aprobar usuario con ID:', userId);
      const success = await this.databaseService.updateUserApprovalStatus(userId, 'approved').toPromise();
      console.log('Resultado de la aprobación:', success);
      if (success) {
        this.presentToast('Usuario aprobado con éxito.');
        await this.loadPendingUsers(); 
        console.log('Lista de usuarios pendientes actualizada');
      } else {
        throw new Error('No se pudo aprobar el usuario');
      }
    } catch (error) {
      console.error('Error al aprobar usuario:', error);
      this.presentToast('Error al aprobar usuario.');
    }
  }
  async rejectUser(userId: number) {
    try {
      console.log('Intentando rechazar usuario con ID:', userId);
      const success = await this.databaseService.updateUserApprovalStatus(userId, 'rejected').toPromise();
      console.log('Resultado del rechazo:', success);
      if (success) {
        this.presentToast('Usuario rechazado.');
        await this.loadPendingUsers();
        console.log('Lista de usuarios pendientes actualizada');
      } else {
        throw new Error('No se pudo rechazar el usuario');
      }
    } catch (error) {
      console.error('Error al rechazar usuario:', error);
      this.presentToast('Error al rechazar usuario.');
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