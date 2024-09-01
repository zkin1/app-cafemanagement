import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  toastMessage: string = '';
  showToast: boolean = false;

  private users = [
    { email: 'admin', password: 'admin', role: 'admin', name: 'Admin' },
    { email: 'empleado', password: 'emp', role: 'employee', name: 'colaborador1' }
  ];

  constructor(private router: Router) { }

  onSubmit() {
    const user = this.users.find(u => u.email === this.email && u.password === this.password);
    if (user) {
      (window as any).currentUser = user;
      if (user.role === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/employee-dashboard']);
      }
      this.presentToast(`Bienvenido, ${user.name}!`);
    } else {
      this.presentToast('Credenciales incorrectas. Por favor, intente de nuevo.');
    }
  }

  forgotPassword() {
    console.log('Recuperación de contraseña solicitada');
    this.presentToast('Se ha enviado un correo con instrucciones para recuperar tu contraseña.');
  }

  presentToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}