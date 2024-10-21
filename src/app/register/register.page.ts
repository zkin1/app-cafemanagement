import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { User } from '../models/user.model';
import { Subscription, Observable, from } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  registerForm: FormGroup;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private formBuilder: FormBuilder
  ) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.value;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasSpecialChar || !hasUpperCase || !hasLowerCase || !hasNumber) {
      return { 'invalidPassword': true };
    }
    return null;
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async onSubmit() {
    console.log('Iniciando proceso de registro');
    if (this.registerForm.invalid) {
      console.log('Formulario inválido');
      await this.presentToast('Por favor, complete todos los campos correctamente.');
      return;
    }
  
    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
    });
    await loading.present();
  
    try {
      console.log('Verificando usuario existente');
      const existingUser = await firstValueFrom(this.databaseService.getUserByEmail(this.registerForm.get('email')?.value));
      if (existingUser) {
        console.log('Usuario ya existe');
        await this.presentToast('El email ya está registrado. Por favor, use otro.');
        return;
      }
  
      console.log('Creando nuevo usuario');
      const newUser: User = {
        Name: this.registerForm.get('name')?.value,
        Email: this.registerForm.get('email')?.value,
        Password: this.registerForm.get('password')?.value,
        Role: 'employee',
        Username: this.registerForm.get('email')?.value,
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