import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { ToastController, LoadingController, Platform } from '@ionic/angular';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { Subscription } from 'rxjs';
import { Capacitor, Plugins } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const { Permissions } = Plugins;
const { Share } = Plugins;

// Configuración de pdfMake
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

interface DailySale {
  day: string;
  amount: number;
  canceledAmount: number;
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
export class AdminPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dailySalesChart') private chartRef!: ElementRef;
  private chart: Chart | undefined;
  totalSales: number = 0;
  topProducts: TopProduct[] = [];
  dailySales: { day: string; amount: number; canceledAmount: number }[] = [];
  private subscriptions: Subscription = new Subscription();

  ventasRealizadas: number = 0;
  ventasCanceladas: number = 0;

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.loadStatistics();
  }

  ngAfterViewInit() {
    if (this.dailySales.length > 0) {
      this.createChart();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  async loadStatistics() {
    const loading = await this.loadingController.create({
      message: 'Cargando estadísticas...',
    });
    await loading.present();
  
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7); // Últimos 7 días
  
      this.ventasRealizadas = await this.databaseService.calculateTotalSales(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        ['Solicitado', 'En proceso', 'Listo', 'Entregado']
      );
  
      this.ventasCanceladas = await this.databaseService.calculateTotalSales(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        ['Cancelado']
      );
  
      this.ordenesCancel = {
        cantidad: await this.databaseService.getOrdersCount(['Cancelado']),
        total: await this.databaseService.calculateTotalSales(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          ['Cancelado']
        )
      };
  
      const [topSellingProducts, dailySales] = await Promise.all([
        this.databaseService.getTopSellingProducts(5),
        this.getDailySales(startDate, endDate)
      ]);
  
      this.totalSales = this.ventasRealizadas;
      this.topProducts = topSellingProducts.map(p => ({
        name: p.name,
        sales: p.totalSold
      }));
      this.dailySales = dailySales;
  
      this.createChart();
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      this.presentToast('Error al cargar estadísticas. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private createChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    if (!this.chartRef) {
      console.error('Chart reference not found');
      return;
    }
  
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context for canvas');
      return;
    }
  
    const data = {
      labels: this.dailySales.map(sale => sale.day),
      datasets: [
        {
          label: 'Ventas Realizadas',
          data: this.dailySales.map(sale => sale.amount),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Ventas Canceladas',
          data: this.dailySales.map(sale => sale.canceledAmount),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  
    const config: ChartConfiguration = {
      type: 'line', 
      data: {
        labels: this.dailySales.map(sale => sale.day),
        datasets: [
          {
            label: 'Ventas Realizadas',
            data: this.dailySales.map(sale => sale.amount),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true
          },
          {
            label: 'Ventas Canceladas',
            data: this.dailySales.map(sale => sale.canceledAmount),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: {
                size: 10
              }
            }
          },
          title: {
            display: true,
            text: 'Ventas por Día',
            font: {
              size: 14
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Ventas (CLP)',
              font: {
                size: 10
              }
            },
            ticks: {
              font: {
                size: 8
              },
              callback: function(value) {
                return '$ ' + value.toLocaleString('es-CL');
              }
            }
          },
          x: {
            title: {
              display: false
            },
            ticks: {
              font: {
                size: 8
              }
            }
          }
        }
      }
    };
  
    this.chart = new Chart(ctx, config);
  }

  private async getDailySales(startDate: Date, endDate: Date): Promise<DailySale[]> {
    const dailySales: DailySale[] = [];
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const [dayTotal, canceledTotal] = await Promise.all([
        this.databaseService.calculateTotalSales(
          currentDate.toISOString().split('T')[0],
          currentDate.toISOString().split('T')[0],
          ['Solicitado', 'En proceso', 'Listo', 'Entregado']
        ),
        this.databaseService.calculateTotalSales(
          currentDate.toISOString().split('T')[0],
          currentDate.toISOString().split('T')[0],
          ['Cancelado']
        )
      ]);
      
      dailySales.push({
        day: daysOfWeek[currentDate.getDay()],
        amount: dayTotal,
        canceledAmount: canceledTotal
      });
  
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return dailySales;
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async checkStoragePermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        return true;
      } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
      }
    }
    return true; // Siempre retorna true para navegadores web
  }
  async generateReport() {
    if (Capacitor.isNativePlatform()) {
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        await this.presentToast('Se necesitan permisos de almacenamiento para guardar el informe.');
        return;
      }
    }
  
    const loading = await this.loadingController.create({
      message: 'Generando informe...',
    });
    await loading.present();
  
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30); // Últimos 30 días
  
      const [totalSales, topSellingProducts, dailySales] = await Promise.all([
        this.databaseService.calculateTotalSales(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        this.databaseService.getTopSellingProducts(5),
        this.getDailySales(startDate, endDate)
      ]);
  
      const documentDefinition: TDocumentDefinitions = {
        content: [
          { text: 'Informe de Ventas', style: 'header' },
          { text: `Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, style: 'subheader' },
          { text: `Ventas Totales: $${totalSales.toLocaleString('es-CL')}`, style: 'subheader' },
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
                ...dailySales.map(sale => [sale.day, `$${sale.amount.toLocaleString('es-CL')}`])
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
  
      const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
  
      if (Capacitor.isNativePlatform()) {
        pdfDocGenerator.getBase64(async (base64) => {
          const fileName = `informe_ventas_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
          
          try {
            const result = await Filesystem.writeFile({
              path: `Download/${fileName}`,
              data: base64,
              directory: Directory.ExternalStorage,
              encoding: Encoding.UTF8
            });
  
            console.log('Archivo guardado en:', result.uri);
            await this.presentToast(`Informe generado y guardado en Descargas/${fileName}`);
          } catch (error: unknown) {
            console.error('Error al guardar el archivo:', error);
            if (error instanceof Error) {
              if (error.message.includes('Permission denied')) {
                await this.presentToast('No se tienen permisos para guardar el archivo. Por favor, verifique los permisos de la aplicación.');
              } else {
                await this.presentToast('Error al guardar el informe: ' + error.message);
              }
            } else {
              await this.presentToast('Error desconocido al guardar el informe');
            }
          }
        });
      } else {
        // Para navegadores web
        pdfDocGenerator.download(`informe_ventas_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`);
        await this.presentToast('Informe generado y descargado con éxito');
      }
    } catch (error) {
      console.error('Error al generar el informe:', error);
      await this.presentToast('Error al generar el informe. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }


  async requestStoragePermission() {
    if (Capacitor.isNativePlatform()) {
      try {
        const permissionStatus = await Permissions['query']({ name: 'storage' });
        if (permissionStatus.state !== 'granted') {
          const requestResult = await Permissions['request']({ name: 'storage' });
          return requestResult.state === 'granted';
        }
        return true;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    return true;
  }
  ordenesCancel = {
    cantidad: 0,
    total: 0
  };
}