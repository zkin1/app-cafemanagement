import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Subscription, Observable } from 'rxjs';
import { DatabaseService } from '../services/database.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit, OnDestroy {
  @ViewChild('perfilForm') perfilForm!: NgForm;
  @ViewChild('passwordForm') passwordForm!: NgForm;

  showToast: boolean = false;
  toastMessage: string = '';
  
  usuario: User = {
    UserID: 0,
    Username: '',
    Password: '',
    Role: 'employee',
    Name: '',
    Email: '',
    PhoneNumber: '',
    HireDate: new Date(),
    LastLogin: new Date(),
    ApprovalStatus: 'approved'
  };

  datosContrasena = {
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  };

  esAdmin: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarPerfilUsuario();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async cargarPerfilUsuario() {
    const loading = await this.loadingController.create({
      message: 'Cargando perfil...',
    });
    await loading.present();
  
    try {
      const userId = this.obtenerIdUsuarioActual();
      if (!userId) {
        throw new Error('No se encontró un usuario activo');
      }
  
      this.usuario = await this.getUserById(userId);
      this.esAdmin = this.usuario.Role === 'admin';
      
      console.log('Usuario cargado:', this.usuario);
      console.log('Es admin:', this.esAdmin);
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
      await this.presentToast('Error al cargar el perfil. Por favor, intente de nuevo.');
      this.router.navigate(['/login']);
    } finally {
      await loading.dismiss();
    }
  }

  private getUserById(userId: number): Promise<User> {
    return new Promise((resolve, reject) => {
      this.databaseService.getUserById(userId).subscribe(
        (user) => {
          if (user) {
            resolve(user);
          } else {
            reject(new Error('Usuario no encontrado'));
          }
        },
        (error) => reject(error)
      );
    });
  }

  async updatePerfil() {
    if (!this.perfilForm.valid) {
      await this.presentToast('Por favor, complete todos los campos correctamente.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Actualizando perfil...',
    });
    await loading.present();
  
    try {
      const currentRole = this.usuario.Role;
      const success = await this.updateUser(this.usuario);
      if (success) {
        this.usuario.Role = currentRole;
        await this.presentToast('Perfil actualizado con éxito');
      } else {
        throw new Error('No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      await this.presentToast('Error al actualizar el perfil. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private async updateUser(user: User): Promise<boolean> {
    try {
      const result = await this.databaseService.updateUserFromDb(user);
      return result !== undefined ? result : false;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async cambiarContrasena() {
    if (!this.passwordForm.valid) {
      await this.presentToast('Por favor, complete todos los campos correctamente.');
      return;
    }

    if (this.datosContrasena.nuevaContrasena !== this.datosContrasena.confirmarContrasena) {
      await this.presentToast('Las contraseñas no coinciden');
      return;
    }

    if (this.datosContrasena.nuevaContrasena.length < 8) {
      await this.presentToast('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar cambio de contraseña',
      message: '¿Estás seguro de que quieres cambiar tu contraseña?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.realizarCambioContrasena();
          }
        }
      ]
    });

    await alert.present();
  }

  private async realizarCambioContrasena() {
    const loading = await this.loadingController.create({
      message: 'Cambiando contraseña...',
    });
    await loading.present();

    try {
      const success = await this.updateUserPassword(
        this.usuario.UserID!,
        this.datosContrasena.contrasenaActual,
        this.datosContrasena.nuevaContrasena
      );
      if (success) {
        await this.presentToast('Contraseña cambiada con éxito');
        this.datosContrasena = { contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' };
        this.passwordForm.resetForm();
      } else {
        throw new Error('No se pudo cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      await this.presentToast('Error al cambiar la contraseña. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.databaseService.updateUserPassword(userId, currentPassword, newPassword).subscribe(
        (success) => resolve(success),
        (error) => reject(error)
      );
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

  private obtenerIdUsuarioActual(): number | null {
    const usuarioActual = localStorage.getItem('currentUser');
    if (usuarioActual) {
      return JSON.parse(usuarioActual).id;
    }
    return null;
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, cerrar sesión',
          handler: () => {
            localStorage.removeItem('currentUser');
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }
}