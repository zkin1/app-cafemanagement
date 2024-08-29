import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  totalSales: number = 0;
  topProducts: { name: string, sales: number }[] = [];
  dailySales: { day: string, amount: number }[] = [];

  constructor() { }

  ngOnInit() {
    this.generateSimulatedData();
  }

  generateSimulatedData() {
    // Simular ventas totales
    this.totalSales = Math.floor(Math.random() * 1000000) + 500000;

    // Simular productos más vendidos
    this.topProducts = [
      { name: 'Latte', sales: Math.floor(Math.random() * 100) + 50 },
      { name: 'Cappuccino', sales: Math.floor(Math.random() * 100) + 40 },
      { name: 'Americano', sales: Math.floor(Math.random() * 100) + 30 },
    ];

    // Simular ventas por día
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    this.dailySales = days.map(day => ({
      day,
      amount: Math.floor(Math.random() * 50000) + 10000
    }));
  }
}