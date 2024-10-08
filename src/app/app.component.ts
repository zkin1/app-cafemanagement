import { Component } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { DatabaseService } from './services/database.service';
import { addIcons } from 'ionicons';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';

import { 
  homeOutline, 
  cartOutline, 
  personOutline, 
  logInOutline, 
  personAddOutline,
  settingsOutline,
  logOutOutline,
  statsChartOutline,
  briefcaseOutline,
  cafeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private databaseService: DatabaseService,
    private router: Router,
    private alertController: AlertController
  ) {
    this.initializeApp();
    this.addIonicons();
  }

  private addIonicons() {
    addIcons({
      homeOutline,
      cartOutline,
      personOutline,
      logInOutline,
      personAddOutline,
      settingsOutline,
      logOutOutline,
      statsChartOutline,
      briefcaseOutline,
      cafeOutline
    });
  }

  async initializeApp() {
    try {
      await this.platform.ready();
      console.log('Platform ready');
      console.log('Is native platform:', Capacitor.isNativePlatform());
  
      console.log('Initializing database...');
      await this.databaseService.initializeDatabase();
      console.log('Database initialized successfully');
  
      this.databaseService.dbState().subscribe({
        next: async (isReady) => {
          if (isReady) {
            console.log('Database is ready');
            await this.checkAndInsertSeedData();
          }
        },
        error: (error) => {
          console.error('Error in dbState subscription:', error);
          this.presentAlert('Error', 'Database state subscription error');
        }
      });
  
    } catch (error) {
      console.error('Error initializing app:', error);
      await this.presentAlert('Error', 'Failed to initialize the app. Please try again.');
    }
  }

  private async checkAndInsertSeedData() {
    try {
      const users = await this.databaseService.fetchUsers().toPromise();
      if (users && users.length === 0) {
        console.log('No users found, inserting seed data');
        // Asumiendo que tienes un método para insertar datos de prueba
        // await this.databaseService.insertSeedData();
        console.log('Seed data inserted successfully');
      } else {
        console.log('Users already exist, skipping seed data insertion');
      }

      // Prueba de consulta
      const products = await this.databaseService.fetchProducts().toPromise();
      console.log('Products in database:', products ? products.length : 0);

    } catch (error) {
      console.error('Error checking or inserting seed data:', error);
      await this.presentAlert('Error', 'Failed to check or insert seed data.');
    }
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  get isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.role === 'admin';
  }

  get isEmployee(): boolean {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.role === 'employee';
  }

  get currentUserName(): string | undefined {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.name;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }
}