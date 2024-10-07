import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';

interface DailySale {
  day: string;
  amount: number;
}

interface TopProduct {
  name: string;
  sales: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  totalSales: number = 0;
  topProducts: TopProduct[] = [];
  dailySales: DailySale[] = [];

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    await this.loadStatistics();
  }

  async loadStatistics() {
    const loading = await this.loadingController.create({
      message: 'Cargando estadísticas...',
    });
    await loading.present();

    try {
      // Obtener ventas totales
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Últimos 30 días
      this.totalSales = await this.databaseService.calculateTotalSales(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Obtener productos más vendidos
      const topSellingProducts = await this.databaseService.getTopSellingProducts(5);
      this.topProducts = topSellingProducts.map(p => ({
        name: p.name,
        sales: p.totalSold
      }));

      // Obtener ventas por día
      this.dailySales = await this.getDailySales(startDate, endDate);

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      this.presentToast('Error al cargar estadísticas. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }

  async getDailySales(startDate: Date, endDate: Date): Promise<DailySale[]> {
    const dailySales: DailySale[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayTotal = await this.databaseService.calculateTotalSales(
        currentDate.toISOString().split('T')[0],
        currentDate.toISOString().split('T')[0]
      );
      
      dailySales.push({
        day: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
        amount: dayTotal
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailySales;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  async generateReport() {
    // Implementar la lógica para generar y descargar un informe detallado
    this.presentToast('Funcionalidad de generación de informe aún no implementada');
  }
}