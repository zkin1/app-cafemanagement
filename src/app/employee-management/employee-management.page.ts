import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { User } from '../models/user.model';
import { Subscription, Observable, from, of } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.page.html',
  styleUrls: ['./employee-management.page.scss'],
})
export class EmployeeManagementPage implements OnInit, OnDestroy {

  showToast: boolean = false;
  toastMessage: string = '';
  users: User[] = [];
  editingUser: User | null = null;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

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
      this.users = await this.getAllUsers();
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      this.presentToast('Error al cargar empleados. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private async getAllUsers(): Promise<User[]> {
    const result = this.databaseService.getAllUsers();
  
    if (result instanceof Observable) {
      try {
        // Convertimos el Observable en Promise y retornamos el valor
        const users = await firstValueFrom(result.pipe(
          map(users => users || []), 
          catchError(() => of([])) 
        ));
        return users;
      } catch (error) {
        return []; 
      }
    }
  
    // Si result no es un Observable, retornamos el valor asegurando un array
    return Promise.resolve(result || []);
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
          handler: (data) => {
            this.createNewUser(data);
          }
        }
      ]
    });

    await alert.present();
  }

  private async createNewUser(data: any) {
    if (!data.name || !data.email || !data.password || !data.role) {
      this.presentToast('Por favor, complete todos los campos');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Añadiendo empleado...',
    });
    await loading.present();

    const newUser: User = {
      Name: data.name,
      Email: data.email,
      Password: data.password,
      Role: data.role,
      Username: data.email
    };

    try {
      const userId = await this.createUser(newUser);
      if (userId !== undefined) {
        newUser.UserID = userId;
        this.users.push(newUser);
        this.presentToast('Empleado añadido con éxito');
      } else {
        throw new Error('No se pudo crear el usuario');
      }
    } catch (error) {
      console.error('Error al añadir empleado:', error);
      this.presentToast('Error al añadir empleado. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private createUser(user: User): Promise<number | undefined> {
    const result = this.databaseService.createUser(user);
    if (result instanceof Observable) {
      return result.pipe(
        map(id => id),
        catchError(() => of(undefined))
      ).toPromise();
    }
    return Promise.resolve(result);
  }

  editUser(user: User) {
    this.editingUser = { ...user };
  }

  async saveUser() {
    if (!this.editingUser) return;

    const loading = await this.loadingController.create({
      message: 'Guardando cambios...',
    });
    await loading.present();

    try {
      const success = await this.updateUser(this.editingUser);
      if (success) {
        const index = this.users.findIndex(u => u.UserID === this.editingUser!.UserID);
        if (index !== -1) {
          this.users[index] = { ...this.editingUser };
        }
        this.presentToast('Usuario actualizado con éxito');
        this.editingUser = null;
      } else {
        throw new Error('No se pudo actualizar el usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      this.presentToast('Error al actualizar usuario. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private updateUser(user: User): Promise<boolean> {
    const result = this.databaseService.updateUserFromDb(user);
  
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true), // Si el observable es exitoso, retornamos `true`
        catchError(() => of(false)) // En caso de error, devolvemos `false`
      )
      .toPromise()
      .then(res => res !== undefined ? res : false); // Garantizamos que no se devuelva `undefined`
    }
  
    // Aseguramos que si `result` es `undefined`, devolvemos `false`
    return Promise.resolve(result !== undefined ? true : false);
  }
  

  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar a ${user.Name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.performUserDeletion(user);
          }
        }
      ]
    });

    await alert.present();
  }

  private async performUserDeletion(user: User) {
    const loading = await this.loadingController.create({
      message: 'Eliminando empleado...',
    });
    await loading.present();

    try {
      const success = await this.deleteUserFromDb(user.UserID!);
      if (success) {
        this.users = this.users.filter(u => u.UserID !== user.UserID);
        this.presentToast('Empleado eliminado con éxito');
      } else {
        throw new Error('No se pudo eliminar el usuario');
      }
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      this.presentToast('Error al eliminar empleado. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private async deleteUserFromDb(userId: number): Promise<boolean> {
    const result = this.databaseService.deleteUser(userId);

    if (result instanceof Observable) {
      try {
        await firstValueFrom(result);
        return true; 
      } catch (error) {
        return false; 
      }
    }
    return Promise.resolve(result !== undefined && result !== false);
  }
  

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

  cancelEdit() {
    this.editingUser = null;
  }
}