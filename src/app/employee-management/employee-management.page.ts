import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'empleado';
}

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.page.html',
  styleUrls: ['./employee-management.page.scss'],
})
export class EmployeeManagementPage implements OnInit {
  users: User[] = [
    { id: 1, name: 'Admin 1', email: 'admin@example.com', role: 'admin' },
    { id: 2, name: 'Empleado 1', email: 'emp1@ejemplo.com', role: 'empleado' },
    { id: 3, name: 'Empleado 2', email: 'emp2@ejemplo.com', role: 'empleado' }
  ];

  editingUser: User | null = null;

  constructor(private toastController: ToastController) { }

  ngOnInit() {
  }

  editUser(user: User) {
    this.editingUser = { ...user };
  }

  saveUser() {
    if (this.editingUser) {
      const index = this.users.findIndex(u => u.id === this.editingUser!.id);
      if (index !== -1) {
        this.users[index] = { ...this.editingUser };
        this.presentToast('Usuario actualizado con éxito');
      }
    }
    this.editingUser = null;
  }

  cancelEdit() {
    this.editingUser = null;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}