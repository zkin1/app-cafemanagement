import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController } from '@ionic/angular';
import { User } from '../models/user.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  showToast: boolean = false;
  toastMessage: string = '';

  email: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.checkAuthAndRedirect();
  }

  private checkAuthAndRedirect() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.id) {
      console.log('Usuario autenticado:', currentUser);
      if (currentUser.role === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/employee-dashboard']);
      }
    } else {
      console.log('Usuario no autenticado');
      this.router.navigate(['/login']);
    }
  }

  async onSubmit() {
    console.log('Iniciando proceso de login');
    if (!this.email || !this.password) {
      await this.presentToast('Por favor, ingrese email y contraseña.');
      return;
    }
  
    try {
      console.log('Intentando autenticar:', this.email);
      const user = await this.databaseService.authenticateUser(this.email, this.password);
      console.log('Resultado de autenticación:', user);
      
      if (user) {
        if (user.ApprovalStatus === 'approved') {
          // Guardar información del usuario en el almacenamiento local
          const userInfo = {
            id: user.UserID,
            name: user.Name,
            email: user.Email,
            role: user.Role
          };
          localStorage.setItem('currentUser', JSON.stringify(userInfo));
  
          // Actualizar la fecha del último login
          await this.databaseService.updateUserLastLogin(user.UserID!);
  
          // Redireccionar basado en el rol
          if (user.Role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/employee-dashboard']);
          }
  
          await this.presentToast(`Bienvenido, ${user.Name}!`);
        } else if (user.ApprovalStatus === 'pending') {
          await this.presentToast('Su cuenta está pendiente de aprobación. Por favor, espere la confirmación del administrador.');
        } else {
          await this.presentToast('Su cuenta ha sido rechazada. Por favor, contacte al administrador.');
        }
      } else {
        await this.presentToast('Credenciales incorrectas. Por favor, intente de nuevo.');
      }
    } catch (error) {
      console.error('Error durante login:', error);
      await this.presentToast('Ocurrió un error durante el inicio de sesión. Por favor, intente de nuevo.');
    }
  }


  private async handleSuccessfulLogin(user: User) {
    console.log('Usuario autenticado:', JSON.stringify(user));
    const safeUserInfo = {
      id: user.UserID,
      username: user.Username,
      name: user.Name,
      email: user.Email,
      role: user.Role
    };
    console.log('Información de usuario a guardar:', JSON.stringify(safeUserInfo));
    localStorage.setItem('currentUser', JSON.stringify(safeUserInfo));
    
    if (user.UserID !== undefined) {
      await this.databaseService.updateUserLastLogin(user.UserID);
    }
    
    await this.presentToast(`Bienvenido, ${user.Name}!`);
    
    this.router.navigate(['/main']);
  }
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  forgotPassword() {
    // Implement password recovery logic here
    this.presentToast('Se ha enviado un correo con instrucciones para recuperar tu contraseña.');
  }
}