import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { EmailService } from '../services/email.service';
import { firstValueFrom } from 'rxjs';

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
    private loadingController: LoadingController,
    private toastController: ToastController,
    private emailService: EmailService
  ) {}

  // Propiedades para validación de contraseña
  get hasUpperCase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  get hasLowerCase(): boolean {
    return /[a-z]/.test(this.newPassword);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.newPassword);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
  }

  get isLongEnough(): boolean {
    return this.newPassword.length >= 6;
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

  isValidPassword(password: string): boolean {
    return this.hasUpperCase && 
           this.hasLowerCase && 
           this.hasNumber && 
           this.hasSpecialChar && 
           this.isLongEnough;
  }

  async resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      await this.presentToast('Por favor, complete todos los campos', 'warning');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      await this.presentToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    if (!this.isValidPassword(this.newPassword)) {
      await this.presentToast(
        'La contraseña debe contener al menos 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Actualizando contraseña...',
    });
    await loading.present();

    try {
      const user = await firstValueFrom(this.databaseService.getUserByEmail(this.email));
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const success = await firstValueFrom(
        this.databaseService.updatePassword(user.UserID!, this.newPassword)
      );
      
      if (success) {
        await this.presentToast('Contraseña actualizada correctamente', 'success');
        this.router.navigate(['/login']);
      } else {
        throw new Error('No se pudo actualizar la contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      await this.presentToast('Error al actualizar la contraseña', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async sendVerificationCode() {
    if (!this.email) {
      await this.presentToast('Por favor, ingrese su correo electrónico', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Verificando correo...',
    });
    await loading.present();

    try {
      console.log('Verificando email:', this.email);
      const user = await firstValueFrom(this.databaseService.getUserByEmail(this.email));

      if (!user) {
        throw new Error('No existe una cuenta con este correo electrónico');
      }

      this.generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      console.log('Código generado:', this.generatedCode);

      const result = await firstValueFrom(
        this.emailService.sendVerificationCode(this.email, this.generatedCode)
      );

      if (!result.success) {
        throw new Error(result.error || 'Error al enviar el correo');
      }

      this.step = 'verify';
      await this.presentToast('Código de verificación enviado a su correo', 'success');

    } catch (error) {
      console.error('Error detallado:', error);
      const message = error instanceof Error ? error.message : 'Error al enviar el código';
      await this.presentToast(message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async verifyCode() {
    // Convertir ambos códigos a string y remover espacios
    const inputCode = this.verificationCode.toString().trim();
    const storedCode = this.generatedCode.toString().trim();
    
    console.log('Verificando código:', {
      ingresado: inputCode,
      generado: storedCode
    });

    if (inputCode === storedCode) {
      this.step = 'reset';
      await this.presentToast('Código verificado correctamente', 'success');
    } else {
      console.log('Códigos no coinciden:', {
        inputCode: inputCode,
        storedCode: storedCode,
        inputType: typeof inputCode,
        storedType: typeof storedCode
      });
      await this.presentToast('Código de verificación incorrecto', 'danger');
    }
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: color
    });
    await toast.present();
  }
}