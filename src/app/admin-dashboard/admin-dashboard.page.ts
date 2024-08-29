import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
})
export class AdminDashboardPage implements OnInit {
  adminName: string = 'Admin';
  orderCount: number = 0;
  activeEmployees: number = 0;

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.adminName = (window as any).currentUser?.name || 'Admin';
    this.orderCount = Math.floor(Math.random() * 50); 
    this.activeEmployees = Math.floor(Math.random() * 10); 
  }

  logout() {
    (window as any).currentUser = null;
    this.router.navigate(['/login']);
  }
}