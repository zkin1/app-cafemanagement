import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.page.html',
  styleUrls: ['./employee-dashboard.page.scss'],
})
export class EmployeeDashboardPage implements OnInit {
  employeeName: string = 'Empleado';
  ordersToday: number = 0;
  pendingOrders: number = 0;

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadEmployeeData();
  }

  loadEmployeeData() {
    this.employeeName = (window as any).currentUser?.name || 'Empleado';
    this.ordersToday = Math.floor(Math.random() * 20); 
    this.pendingOrders = Math.floor(Math.random() * 5); 
  }

  logout() {
    (window as any).currentUser = null;
    this.router.navigate(['/login']);
  }
}