import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { Subscription, Observable, from } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit, OnDestroy {
  showToast: boolean = false;
  toastMessage: string = '';
  
  usuario: User = {} as User;
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
      
      // Actualiza la información en el localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.usuario));
      
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
    const result = this.databaseService.getUserById(userId);
    
    if (result instanceof Observable) {
      return result.toPromise().then(res => {
        if (res !== undefined) {
          return res;
        } else {
          throw new Error('User not found');
        }
      });
    }
  
    return Promise.resolve(result !== undefined ? result : Promise.reject('User not found'));
  }

  async updatePerfil() {
    const loading = await this.loadingController.create({
      message: 'Actualizando perfil...',
    });
    await loading.present();

    try {
      const success = await this.updateUser(this.usuario);
      if (success) {
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

  private updateUser(user: User): Promise<boolean> {
    const result = this.databaseService.updateUserFromDb(user);
    
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true)
      ).toPromise().then(res => res !== undefined ? res : false);
    }
  
    return Promise.resolve(true); // Aquí asumimos que si no es Observable, siempre es exitoso.
  }
  

  async cambiarContrasena() {
    if (this.datosContrasena.nuevaContrasena !== this.datosContrasena.confirmarContrasena) {
      await this.presentToast('Las contraseñas no coinciden');
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
      const success = await this.updateUserPassword(this.usuario.UserID!, this.datosContrasena.contrasenaActual, this.datosContrasena.nuevaContrasena);
      if (success) {
        await this.presentToast('Contraseña cambiada con éxito');
        this.datosContrasena = { contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' };
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
    const result = this.databaseService.updateUserPassword(userId, currentPassword, newPassword);
    
    if (result instanceof Observable) {
      return result.toPromise().then(res => res !== undefined ? res : false);
    }
  
    return Promise.resolve(false); // O algún otro valor predeterminado si el método no es un Observable.
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

  ionViewWillLeave() {
  }
}