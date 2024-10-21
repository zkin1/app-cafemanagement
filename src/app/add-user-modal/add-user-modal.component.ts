import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { User } from '../models/user.model';

@Component({
  selector: 'app-add-user-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Agregar Empleado</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">Cancelar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form (ngSubmit)="submitForm()">
        <ion-item>
          <ion-label position="floating">Nombre</ion-label>
          <ion-input [(ngModel)]="newUser.Name" name="name" required></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="floating">Correo electrónico</ion-label>
          <ion-input [(ngModel)]="newUser.Email" name="email" type="email" required></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="floating">Contraseña</ion-label>
          <ion-input [(ngModel)]="newUser.Password" name="password" type="password" required></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label>Rol</ion-label>
          <ion-select [(ngModel)]="newUser.Role" name="role" required>
            <ion-select-option value="employee">Empleado</ion-select-option>
            <ion-select-option value="admin">Administrador</ion-select-option>
          </ion-select>
        </ion-item>
        
        <ion-item>
          <ion-label>Estado de aprobación</ion-label>
          <ion-select [(ngModel)]="newUser.ApprovalStatus" name="approvalStatus" required>
            <ion-select-option value="approved">Aprobado</ion-select-option>
            <ion-select-option value="pending">Pendiente</ion-select-option>
          </ion-select>
        </ion-item>
        
        <ion-button expand="block" type="submit" class="ion-margin-top">
          Agregar Usuario
        </ion-button>
      </form>
    </ion-content>
  `
})
export class AddUserModalComponent {
  newUser: User = {
    Name: '',
    Email: '',
    Password: '',
    Role: 'employee',
    Username: '',
    ApprovalStatus: 'pending',
    ProfilePicture: undefined
  };

  constructor(private modalController: ModalController) {}

  dismissModal() {
    this.modalController.dismiss(null, 'cancel');
  }

  submitForm() {
    this.modalController.dismiss(this.newUser, 'confirm');
  }
}