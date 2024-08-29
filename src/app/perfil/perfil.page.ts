import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
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

  constructor(
    private toastController: ToastController,
    private router: Router
  ) {}

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

  async updatePerfil() {
    console.log('Perfil actualizado', this.usuario);
    (window as any).currentUser = { ...(window as any).currentUser, ...this.usuario };
    await this.presentarToast('Perfil actualizado con éxito');
  }

  async cambiarContrasena() {
    if (this.datosContrasena.nuevaContrasena !== this.datosContrasena.confirmarContrasena) {
      await this.presentarToast('Las contraseñas no coinciden', 'danger');
      return;
    }
    console.log('Contraseña cambiada');
    await this.presentarToast('Contraseña cambiada con éxito');
    this.datosContrasena = { contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' };
  }

  async gestionarUsuarios() {
    console.log('Gestionar usuarios');
  }

  async verRegistros() {
    console.log('Ver registros');
  }

  async presentarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}