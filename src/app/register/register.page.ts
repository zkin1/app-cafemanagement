import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { User } from '../models/user.model';
import { Subscription, Observable, from } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

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
    console.log('Iniciando proceso de registro');
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
      console.log('Verificando usuario existente');
      const existingUser = await firstValueFrom(this.databaseService.getUserByEmail(this.email));
      if (existingUser) {
        console.log('Usuario ya existe');
        await this.presentToast('El email ya está registrado. Por favor, use otro.');
        return;
      }
  
      console.log('Creando nuevo usuario');
      const newUser: User = {
        Name: this.name,
        Email: this.email,
        Password: this.password,
        Role: 'employee',
        Username: this.email,
        ApprovalStatus: 'pending'
      };
      
      console.log('Llamando a createUser');
      const userId = await this.databaseService.createUser(newUser);
      console.log('Usuario creado con ID:', userId);
      if (userId) {
        console.log('Registro exitoso');
        await this.presentToast('Registro exitoso. Por favor, espere la aprobación del administrador.');
        this.router.navigate(['/login']);
      } else {
        console.log('Fallo en la creación del usuario');
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      await this.presentToast('Ocurrió un error durante el registro. Por favor, intente de nuevo.');
    } finally {
      console.log('Proceso de registro finalizado');
      await loading.dismiss(); // Asegúrate de cerrar el loading spinner aquí
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

  private async createUser(user: User): Promise<number | undefined> {
    try {
      const result = await this.databaseService.createUser(user);
      // Si el resultado es null, lo convertimos a undefined
      return result !== null ? result : undefined;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
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