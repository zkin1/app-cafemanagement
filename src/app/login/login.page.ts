import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController } from '@ionic/angular';
import { User } from '../models/user.model';

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

  async onSubmit() {
    if (!this.email || !this.password) {
      await this.presentToast('Por favor, ingrese email y contraseña.');
      return;
    }

    try {
      const user = await this.databaseService.getUserByEmail(this.email);
      if (user && user.password === this.password) {
        await this.handleSuccessfulLogin(user);
      } else {
        await this.presentToast('Credenciales incorrectas. Por favor, intente de nuevo.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      await this.presentToast('Ocurrió un error durante el inicio de sesión. Por favor, intente de nuevo.');
    }
  }

  private async handleSuccessfulLogin(user: User) {
    // Remove sensitive information before storing
    const { password, ...safeUserInfo } = user;
    localStorage.setItem('currentUser', JSON.stringify(safeUserInfo));
    
    await this.databaseService.updateUserLastLogin(user.id!);
    
    await this.presentToast(`Bienvenido, ${user.name}!`);
    
    if (user.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/employee-dashboard']);
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

  forgotPassword() {
    // Implement password recovery logic here
    this.presentToast('Se ha enviado un correo con instrucciones para recuperar tu contraseña.');
  }
}