import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController } from '@ionic/angular';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

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
      // Obtener ventas totales de la última semana
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7); // Últimos 7 días
  
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
  
      // Obtener ventas por día de la última semana
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
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayTotal = await this.databaseService.calculateTotalSales(
        currentDate.toISOString().split('T')[0],
        currentDate.toISOString().split('T')[0]
      );
      
      dailySales.push({
        day: daysOfWeek[currentDate.getDay()],
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
    const loading = await this.loadingController.create({
      message: 'Generando informe...',
    });
    await loading.present();
  
    try {
      // Obtener datos para el informe
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Últimos 30 días
  
      const totalSales = await this.databaseService.calculateTotalSales(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
  
      const topSellingProducts = await this.databaseService.getTopSellingProducts(5);
  
      const dailySales = await this.getDailySales(startDate, endDate);
  
      // Configurar pdfMake

  
      // Crear el contenido del PDF
      const documentDefinition: any = {
        content: [
          { text: 'Informe de Ventas', style: 'header' },
          { text: `Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, style: 'subheader' },
          { text: `Ventas Totales: $${totalSales.toFixed(2)}`, style: 'subheader' },
          { text: 'Productos Más Vendidos', style: 'subheader' },
          {
            ul: topSellingProducts.map(product => `${product.name}: ${product.totalSold} unidades`)
          },
          { text: 'Ventas Diarias', style: 'subheader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*'],
              body: [
                ['Día', 'Ventas'],
                ...dailySales.map(sale => [sale.day, `$${sale.amount.toFixed(2)}`])
              ]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5]
          }
        }
      };
  
      // Generar el PDF
      const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    
      pdfDocGenerator.getBlob((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'informe_ventas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
  
      this.presentToast('Informe generado y descargado con éxito');
    } catch (error) {
      console.error('Error al generar el informe:', error);
      this.presentToast('Error al generar el informe. Por favor, intente de nuevo.');
    } finally {
      loading.dismiss();
    }
  }
}