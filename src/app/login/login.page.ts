import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  private users = [
    { email: 'admin', password: 'admin', role: 'admin', name: 'Admin' },
    { email: 'empleado', password: 'emp', role: 'employee', name: 'colaborador1' }
  ];

  constructor(
    private router: Router,
    private toastController: ToastController
  ) { }

  onSubmit() {
    const user = this.users.find(u => u.email === this.email && u.password === this.password);
    if (user) {
      console.log('Login exitoso');
      (window as any).currentUser = user;
      if (user.role === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/employee-dashboard']);
      }
      this.presentToast(`Bienvenido, ${user.name}!`, 'success');
    } else {
      console.log('Login fallido');
      this.presentToast('Credenciales incorrectas. Por favor, intente de nuevo.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  forgotPassword() {
    console.log('Recuperación de contraseña solicitada');
    this.presentToast('Se ha enviado un correo con instrucciones para recuperar tu contraseña.', 'success');
  }
}