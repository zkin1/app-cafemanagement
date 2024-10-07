import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  showToast: boolean = false;
  toastMessage: string = '';

  
  usuario: User = {} as User;
  datosContrasena = {
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  };
  esAdmin: boolean = false;

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.cargarPerfilUsuario();
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

      this.usuario = await this.databaseService.getUserById(userId);
      this.esAdmin = this.usuario.role === 'admin';
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
      await this.presentToast('Error al cargar el perfil. Por favor, intente de nuevo.');
      this.router.navigate(['/login']);
    } finally {
      await loading.dismiss();
    }
  }

  async updatePerfil() {
    const loading = await this.loadingController.create({
      message: 'Actualizando perfil...',
    });
    await loading.present();

    try {
      await this.databaseService.updateUser(this.usuario);
      await this.presentToast('Perfil actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      await this.presentToast('Error al actualizar el perfil. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
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
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Cambiando contraseña...',
            });
            await loading.present();

            try {
              // Asumiendo que updateUser puede manejar el cambio de contraseña
              this.usuario.password = this.datosContrasena.nuevaContrasena;
              await this.databaseService.updateUser(this.usuario);
              
              await this.presentToast('Contraseña cambiada con éxito');
              this.datosContrasena = { contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' };
            } catch (error) {
              console.error('Error al cambiar la contraseña:', error);
              await this.presentToast('Error al cambiar la contraseña. Por favor, intente de nuevo.');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
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