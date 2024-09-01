import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  usuario: any = {};
  datosContrasena = {
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  };
  esAdmin: boolean = false;
  toastMessage: string = '';
  showToast: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Simular la obtención de datos del usuario
    const usuarioActual = (window as any).currentUser;
    if (usuarioActual) {
      this.usuario = { ...usuarioActual };
      this.esAdmin = usuarioActual.role === 'admin';
    } else {
      // Redirigir al login si no hay usuario
      this.router.navigate(['/login']);
    }
  }

  updatePerfil() {
    console.log('Perfil actualizado', this.usuario);
    (window as any).currentUser = { ...(window as any).currentUser, ...this.usuario };
    this.presentToast('Perfil actualizado con éxito');
  }

  cambiarContrasena() {
    if (this.datosContrasena.nuevaContrasena !== this.datosContrasena.confirmarContrasena) {
      this.presentToast('Las contraseñas no coinciden');
      return;
    }
    console.log('Contraseña cambiada');
    this.presentToast('Contraseña cambiada con éxito');
    this.datosContrasena = { contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' };
  }

  presentToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}