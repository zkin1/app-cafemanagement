import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

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
    { id: 1, name: 'Admin 1', email: 'admin@gmail.com', role: 'admin' },  
    { id: 2, name: 'Empleado 1', email: 'emp1@gmail.com', role: 'empleado' },
    { id: 3, name: 'Empleado 2', email: 'emp2@gmail.com', role: 'empleado' }
  ];

  editingUser: User | null = null;
  toastMessage: string = '';
  showToast: boolean = false;

  constructor() { }

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

  presentToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}