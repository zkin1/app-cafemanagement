import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../services/database.service';
import { User } from '../models/user.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit, OnDestroy {
  toastColor: string = 'success';
  showToast: boolean = false;
  toastMessage: string = '';
  profilePicture: string | null = null;
  
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

  perfilForm: FormGroup;
  passwordForm: FormGroup;

  esAdmin: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) { 
    this.perfilForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['']
    });

    this.passwordForm = this.formBuilder.group({
      contrasenaActual: ['', [Validators.required]],
      nuevaContrasena: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.cargarPerfilUsuario();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.profilePicture = currentUser.profilePicture || null;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
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

  passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const nuevaContrasena = group.get('nuevaContrasena');
    const confirmarContrasena = group.get('confirmarContrasena');
    return nuevaContrasena && confirmarContrasena && nuevaContrasena.value !== confirmarContrasena.value
      ? { 'passwordMismatch': true }
      : null;
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
      await this.loadProfilePicture(userId);
      
      this.perfilForm.patchValue({
        name: this.usuario.Name,
        email: this.usuario.Email,
        phoneNumber: this.usuario.PhoneNumber
      });
      
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

  async loadProfilePicture(userId: number) {
    try {
      const result = await this.databaseService.getUserProfilePicture(userId).toPromise();
      this.profilePicture = result || 'assets/default-avatar.png';
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      currentUser.profilePicture = this.profilePicture;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Error loading profile picture:', error);
      this.profilePicture = 'assets/default-avatar.png';
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });
  
      this.profilePicture = image.dataUrl || null;
      const userId = this.obtenerIdUsuarioActual();
      if (userId && this.profilePicture) {
        await this.databaseService.updateUserProfilePicture(userId, this.profilePicture);
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.profilePicture = this.profilePicture;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        await this.presentToast('Foto de perfil actualizada con éxito');
      } else {
        throw new Error('No se pudo obtener el ID del usuario o la imagen');
      }
    } catch (error) {
      console.error('Error detallado al tomar la foto:', error);
      if (error instanceof Error) {
        await this.presentToast(`Error al tomar la foto: ${error.message}`);
      } else {
        await this.presentToast('Error desconocido al tomar la foto');
      }
    }
  }

  async updatePerfil() {
    if (this.perfilForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Actualizando perfil...',
      });
      await loading.present();
    
      try {
        const formValues = this.perfilForm.value;
        this.usuario.Name = formValues.name;
        this.usuario.Email = formValues.email;
        this.usuario.PhoneNumber = formValues.phoneNumber;

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
    } else {
      await this.presentToast('Por favor, complete todos los campos correctamente.');
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
    if (this.passwordForm.valid) {
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
    } else {
      await this.presentToast('Por favor, complete todos los campos correctamente.');
    }
  }

  private async realizarCambioContrasena() {
    const loading = await this.loadingController.create({
      message: 'Cambiando contraseña...',
    });
    await loading.present();

    try {
      const formValues = this.passwordForm.value;
      const success = await this.updateUserPassword(
        this.usuario.UserID!,
        formValues.contrasenaActual,
        formValues.nuevaContrasena
      );
      if (success) {
        await this.presentToast('Contraseña cambiada con éxito');
        this.passwordForm.reset();
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
      position: 'top',
      color: this.toastColor
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

  handleImageError(event: any) {
    event.target.src = 'assets/default-avatar.png';
  }
}