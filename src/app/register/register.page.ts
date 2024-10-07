import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController } from '@ionic/angular';
import { User } from '../models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  showToast: boolean = false;
  toastMessage: string = '';
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController
  ) {}

  async onSubmit() {
    if (!this.isFormValid()) {
      await this.presentToast('Por favor, complete todos los campos correctamente.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.presentToast('Las contraseñas no coinciden.');
      return;
    }

    try {
      const existingUser = await this.databaseService.getUserByEmail(this.email);
      if (existingUser) {
        await this.presentToast('El email ya está registrado. Por favor, use otro.');
        return;
      }

      const newUser: User = {
        name: this.name,
        email: this.email,
        password: this.password,
        role: 'employee', // Default role, can be changed by admin later
        username: this.email, // Using email as username for simplicity
      };

      const userId = await this.databaseService.createUser(newUser);
      if (userId) {
        await this.presentToast('Registro exitoso. Por favor, inicie sesión.');
        this.router.navigate(['/login']);
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      await this.presentToast('Ocurrió un error durante el registro. Por favor, intente de nuevo.');
    }
  }

  private isFormValid(): boolean {
    return !!(this.name && this.email && this.password && this.confirmPassword);
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }
}