import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { User } from '../models/user.model';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.page.html',
  styleUrls: ['./employee-management.page.scss'],
})
export class EmployeeManagementPage implements OnInit {

  showToast: boolean = false;
  toastMessage: string = '';
  users: User[] = [];
  editingUser: User | null = null;

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    const loading = await this.loadingController.create({
      message: 'Cargando empleados...',
    });
    await loading.present();

    try {
      this.users = await this.databaseService.getAllUsers();
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      this.presentToast('Error al cargar empleados. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }

  async addUser() {
    const alert = await this.alertController.create({
      header: 'Añadir Empleado',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre' },
        { name: 'email', type: 'email', placeholder: 'Email' },
        { name: 'password', type: 'password', placeholder: 'Contraseña' },
        {
          type: 'radio',
          label: 'Empleado',
          value: 'employee',
          name: 'role'
        },
        {
          type: 'radio',
          label: 'Admin',
          value: 'admin',
          name: 'role'
        },
        {
          type: 'radio',
          label: 'Manager',
          value: 'manager',
          name: 'role'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Añadir',
          handler: async (data) => {
            if (!data.name || !data.email || !data.password || !data.role) {
              this.presentToast('Por favor, complete todos los campos');
              return false; // Mantiene la alerta abierta
            }
  
            const newUser: User = {
              name: data.name,
              email: data.email,
              password: data.password,
              role: data.role,
              username: data.email // Usamos el email como username por simplicidad
            };
  
            const loading = await this.loadingController.create({
              message: 'Añadiendo empleado...',
            });
            await loading.present();
  
            try {
              const userId = await this.databaseService.createUser(newUser);
              newUser.id = userId;
              this.users.push(newUser);
              this.presentToast('Empleado añadido con éxito');
              return true; // Cierra la alerta
            } catch (error) {
              console.error('Error al añadir empleado:', error);
              this.presentToast('Error al añadir empleado. Por favor, intente de nuevo.');
              return false; // Mantiene la alerta abierta en caso de error
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
  
    await alert.present();
  }

  async editUser(user: User) {
    this.editingUser = { ...user };
  }

  async saveUser() {
    if (!this.editingUser) return;

    const loading = await this.loadingController.create({
      message: 'Guardando cambios...',
    });
    await loading.present();

    try {
      await this.databaseService.updateUser(this.editingUser);
      const index = this.users.findIndex(u => u.id === this.editingUser!.id);
      if (index !== -1) {
        this.users[index] = { ...this.editingUser };
      }
      this.presentToast('Usuario actualizado con éxito');
      this.editingUser = null;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      this.presentToast('Error al actualizar usuario. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }

  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar a ${user.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando empleado...',
            });
            await loading.present();

            try {
              await this.databaseService.deleteUser(user.id!);
              this.users = this.users.filter(u => u.id !== user.id);
              this.presentToast('Empleado eliminado con éxito');
            } catch (error) {
              console.error('Error al eliminar empleado:', error);
              this.presentToast('Error al eliminar empleado. Por favor, intente de nuevo.');
            } finally {
              loading.dismiss();
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
    toast.present();
  }

  cancelEdit() {
    this.editingUser = null;
  }
}