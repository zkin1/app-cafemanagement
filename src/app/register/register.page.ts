import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  name: string = '';
  email: string = '';
  password: string = '';
  toastMessage: string = '';
  showToast: boolean = false;

  constructor(private router: Router) { }

  onSubmit() {
    // Simular el registro
    const existingUsers = (window as any).users || [];
    if (existingUsers.some((u: any) => u.email === this.email)) {
      this.presentToast('El registro falló. El usuario ya existe.');
    } else {
      const newUser = { name: this.name, email: this.email, password: this.password, isAdmin: false };
      existingUsers.push(newUser);
      (window as any).users = existingUsers;
      this.presentToast('Registro exitoso. Por favor, inicia sesión.');
      this.router.navigate(['/login']);
    }
  }

  presentToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}