import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  name: string = '';
  email: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController
  ) { }

  onSubmit() {
    // Simular el registro
    const existingUsers = (window as any).users || [];
    if (existingUsers.some((u: any) => u.email === this.email)) {
      this.presentToast('El registro falló. El usuario ya existe.', 'danger');
    } else {
      const newUser = { name: this.name, email: this.email, password: this.password, isAdmin: false };
      existingUsers.push(newUser);
      (window as any).users = existingUsers;
      this.presentToast('Registro exitoso. Por favor, inicia sesión.', 'success');
      this.router.navigate(['/login']);
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}