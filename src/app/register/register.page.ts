import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { User } from '../models/user.model';
import { Subscription, Observable, from } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnDestroy {
  showToast: boolean = false;
  toastMessage: string = '';
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      await this.presentToast('Por favor, complete todos los campos correctamente.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.presentToast('Las contraseñas no coinciden.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
    });
    await loading.present();

    try {
      const existingUser = await this.getUserByEmail(this.email);
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

      const userId = await this.createUser(newUser);
      if (userId !== undefined) {
        await this.presentToast('Registro exitoso. Por favor, inicie sesión.');
        this.router.navigate(['/login']);
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      await this.presentToast('Ocurrió un error durante el registro. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private isFormValid(): boolean {
    return !!(this.name && this.email && this.password && this.confirmPassword);
  }

  private getUserByEmail(email: string): Promise<User | null> {
    const result = this.databaseService.getUserByEmail(email);
    
    if (result instanceof Observable) {
      return result.toPromise().then(res => res !== undefined ? res : null);
    }
  
    return Promise.resolve(result !== undefined ? result : null);
  }

  private createUser(user: User): Promise<number | undefined> {
    const result = this.databaseService.createUser(user);
    if (result instanceof Observable) {
      return result.toPromise();
    }
    return result;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}