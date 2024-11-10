import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { EmailService } from '../services/email.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  email: string = '';
  verificationCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  generatedCode: string = '';
  step: 'email' | 'verify' | 'reset' = 'email';
  showToast: boolean = false;
  toastMessage: string = '';

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private emailService: EmailService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async sendVerificationCode() {
    if (!this.email) {
      await this.presentToast('Por favor, ingrese su correo electrónico');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Verificando correo...',
    });
    await loading.present();

    try {
      // Verificar si el email existe en la base de datos
      const user = await this.databaseService.getUserByEmail(this.email).toPromise();
      
      if (!user) {
        await loading.dismiss();
        await this.presentToast('No existe una cuenta con este correo electrónico');
        return;
      }

      // Generar código de 4 dígitos
      this.generatedCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Enviar correo con el código usando el nuevo servicio
      await this.emailService.sendVerificationCode(this.email, this.generatedCode).toPromise();

      this.step = 'verify';
      await this.presentToast('Código de verificación enviado a su correo');
    } catch (error) {
      console.error('Error:', error);
      await this.presentToast('Error al enviar el código de verificación');
    }

    await loading.dismiss();
  }

  async verifyCode() {
    if (this.verificationCode === this.generatedCode) {
      this.step = 'reset';
    } else {
      await this.presentToast('Código de verificación incorrecto');
    }
  }

  async resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      await this.presentToast('Por favor, complete todos los campos');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      await this.presentToast('Las contraseñas no coinciden');
      return;
    }

    if (!this.isValidPassword(this.newPassword)) {
      await this.presentToast('La contraseña debe contener al menos 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Actualizando contraseña...',
    });
    await loading.present();

    try {
      const user = await this.databaseService.getUserByEmail(this.email).toPromise();
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar contraseña en la base de datos
      await this.databaseService.updatePassword(user.UserID!, this.newPassword).toPromise();
      
      await this.presentAlert(
        'Éxito',
        'Su contraseña ha sido actualizada correctamente'
      );
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error:', error);
      await this.presentToast('Error al actualizar la contraseña');
    }

    await loading.dismiss();
  }

  private isValidPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 6;

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goBack() {
    if (this.step === 'verify') {
      this.step = 'email';
    } else if (this.step === 'reset') {
      this.step = 'verify';
    } else {
      this.router.navigate(['/login']);
    }
  }
}