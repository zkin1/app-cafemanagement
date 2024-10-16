import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { User } from '../models/user.model';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.page.html',
  styleUrls: ['./employee-management.page.scss'],
})
export class EmployeeManagementPage implements OnInit, OnDestroy {
  users: User[] = [];
  private subscriptions: Subscription = new Subscription();
  showToast: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';

  constructor(
    private databaseService: DatabaseService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadUsers() {
    const loading = await this.loadingController.create({
      message: 'Cargando empleados...',
    });
    await loading.present();

    try {
      this.subscriptions.add(
        this.databaseService.getAllUsers().pipe(first()).subscribe(
          (users) => {
            this.users = users;
            loading.dismiss();
          },
          (error) => {
            console.error('Error al cargar empleados:', error);
            this.presentToast('Error al cargar empleados. Por favor, intente de nuevo.', 'danger');
            loading.dismiss();
          }
        )
      );
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      this.presentToast('Error al cargar empleados. Por favor, intente de nuevo.', 'danger');
      loading.dismiss();
    }
  }

  async addUser() {
    const alert = await this.alertController.create({
      header: 'Agregar Empleado',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre' },
        { name: 'email', type: 'email', placeholder: 'Correo electrónico' },
        { name: 'password', type: 'password', placeholder: 'Contraseña' },
        {
          name: 'role',
          type: 'radio',
          label: 'Empleado',
          value: 'employee',
          checked: true
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Administrador',
          value: 'admin'
        },
        {
          name: 'approvalStatus',
          type: 'radio',
          label: 'Aprobado',
          value: 'approved',
          checked: true
        },
        {
          name: 'approvalStatus',
          type: 'radio',
          label: 'Pendiente',
          value: 'pending'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            this.createUser(data);
          }
        }
      ]
    });

    await alert.present();
  }

  async createUser(userData: {name: string, email: string, password: string, role: 'employee' | 'admin', approvalStatus: 'approved' | 'pending'}) {
    if (!userData.name || !userData.email || !userData.password) {
      this.presentToast('Por favor, complete todos los campos', 'danger');
      return;
    }

    const newUser: User = {
      Name: userData.name,
      Email: userData.email,
      Password: userData.password,
      Role: userData.role,
      Username: userData.email,
      ApprovalStatus: userData.approvalStatus
    };

    try {
      const userId = await this.databaseService.createUser(newUser);
      if (userId) {
        newUser.UserID = userId;
        this.users.push(newUser);
        this.presentToast('Usuario creado con éxito', 'success');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      this.presentToast('Error al crear usuario', 'danger');
    }
  }

  async changeRole(user: User) {
    const alert = await this.alertController.create({
      header: 'Cambiar Rol',
      message: `Cambiar rol de ${user.Name}`,
      inputs: [
        {
          name: 'role',
          type: 'radio',
          label: 'Empleado',
          value: 'employee',
          checked: user.Role === 'employee'
        },
        {
          name: 'role',
          type: 'radio',
          label: 'Administrador',
          value: 'admin',
          checked: user.Role === 'admin'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: async (data) => {
            user.Role = data;
            await this.updateUser(user);
          }
        }
      ]
    });

    await alert.present();
  }

  async changeApprovalStatus(user: User) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado de Aprobación',
      message: `Cambiar estado de aprobación de ${user.Name}`,
      inputs: [
        {
          name: 'approvalStatus',
          type: 'radio',
          label: 'Aprobado',
          value: 'approved',
          checked: user.ApprovalStatus === 'approved'
        },
        {
          name: 'approvalStatus',
          type: 'radio',
          label: 'Pendiente',
          value: 'pending',
          checked: user.ApprovalStatus === 'pending'
        },
        {
          name: 'approvalStatus',
          type: 'radio',
          label: 'Rechazado',
          value: 'rejected',
          checked: user.ApprovalStatus === 'rejected'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: async (data) => {
            await this.updateUserApprovalStatus(user, data);
          }
        }
      ]
    });

    await alert.present();
  }

  async updateUser(user: User) {
    try {
      const success = await this.databaseService.updateUserFromDb(user);
      if (success) {
        this.presentToast('Usuario actualizado con éxito', 'success');
        const index = this.users.findIndex(u => u.UserID === user.UserID);
        if (index !== -1) {
          this.users[index] = { ...user };
        }
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      this.presentToast('Error al actualizar usuario', 'danger');
    }
  }

  async updateUserApprovalStatus(user: User, status: 'approved' | 'pending' | 'rejected') {
    try {
      let success: boolean;
      
      if (status === 'pending') {
        // Si el estado es 'pending', simplemente actualizamos el usuario localmente
        success = true;
      } else {
        // Si el estado es 'approved' o 'rejected', llamamos al método del servicio
        const result = await this.databaseService.updateUserApprovalStatus(user.UserID!, status).toPromise();
        success = result !== undefined ? result : false;
      }
  
      if (success) {
        user.ApprovalStatus = status;
        this.presentToast(`Usuario ${status === 'approved' ? 'aprobado' : status === 'pending' ? 'pendiente' : 'rechazado'} con éxito`, 'success');
        await this.loadUsers(); // Recargar la lista de usuarios
      } else {
        throw new Error('No se pudo actualizar el estado de aprobación');
      }
    } catch (error) {
      console.error('Error al actualizar el estado de aprobación:', error);
      this.presentToast('Error al actualizar el estado de aprobación', 'danger');
    }
  }
  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar a ${user.Name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.databaseService.deleteUser(user.UserID!).toPromise();
              this.users = this.users.filter(u => u.UserID !== user.UserID);
              this.presentToast('Usuario eliminado con éxito', 'success');
            } catch (error) {
              console.error('Error al eliminar usuario:', error);
              this.presentToast('Error al eliminar usuario', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  getRoleColor(role: string): string {
    return role === 'admin' ? 'primary' : 'secondary';
  }

  getApprovalStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'employee':
        return 'Empleado';
      default:
        return role;
    }
  }

  getApprovalStatusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  }

  async editUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Editar Usuario',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: user.Name,
          placeholder: 'Nombre'
        },
        {
          name: 'email',
          type: 'email',
          value: user.Email,
          placeholder: 'Correo electrónico'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            user.Name = data.name;
            user.Email = data.email;
            this.updateUser(user);
          }
        }
      ]
    });

    await alert.present();
  }
}