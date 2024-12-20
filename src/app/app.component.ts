import { Component } from '@angular/core';
import { Platform, AlertController, ToastController } from '@ionic/angular';
import { DatabaseService } from './services/database.service';
import { addIcons } from 'ionicons';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';


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
  profilePicture: string | null = null;
  
  constructor(
    private platform: Platform,
    private databaseService: DatabaseService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController 
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

  handleImageError(event: any) {
    event.target.src = 'assets/default-avatar.png';
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
          }
        },
        error: (error) => {
          console.error('Error in dbState subscription:', error);
          this.presentAlert('Error', 'Database state subscription error');
        }
      });
  
      if (Capacitor.isNativePlatform()) {
        await this.checkPermissions();
      }
  
    } catch (error) {
      console.error('Error initializing app:', error);
      await this.presentAlert('Error', 'Failed to initialize the app. Please try again.');
    }
  }

  async checkPermissions() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: 'test.txt',
          data: 'This is a test',
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        await Filesystem.deleteFile({
          path: 'test.txt',
          directory: Directory.Documents
        });

        console.log('Storage permission granted');
      } catch (error) {
        console.error('Storage permission not granted:', error);
        await this.requestPermissions();
      }
    }
  }
  async requestPermissions() {
    if (Capacitor.isNativePlatform()) {
      const alert = await this.alertController.create({
        header: 'Permisos necesarios',
        message: 'Esta aplicación necesita acceso al almacenamiento. Por favor, otorgue los permisos en la configuración de la aplicación.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Entendido',
            handler: () => {
              this.presentToast('Por favor, abra la configuración de la aplicación y otorgue los permisos necesarios.');
            }
          }
        ]
      });
  
      await alert.present();
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
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

  get currentUserName(): string {
    const userString = localStorage.getItem('currentUser');
    console.log('Usuario almacenado:', userString);
    if (userString) {
      const user = JSON.parse(userString);
      console.log('Usuario parseado:', JSON.stringify(user));
      return user.name || 'Usuario';
    }
    return 'Usuario';
  }

  logout() {
    // Obtener el usuario actual antes de limpiar el localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Limpiar datos específicos del usuario actual
    if (currentUser.id) {
      localStorage.removeItem(`cart_${currentUser.id}`);
      localStorage.removeItem(`lastOrderNumber_${currentUser.id}`);
    }
    
    // Limpiar datos de sesión y otros datos que puedan persistir
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cart_') || key.startsWith('lastOrderNumber_'))) {
        keysToRemove.push(key);
      }
    }
    
    // Eliminar todas las claves relacionadas con carritos y órdenes
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Finalmente, eliminar los datos del usuario y redirigir
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  checkAuthState() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user) {
      // Usuario autenticado
      console.log('Usuario autenticado:', user);
      if (this.router.url === '/login') {
        this.router.navigate(['/main']);
      }
    } else {
      // Usuario no autenticado
      console.log('Usuario no autenticado');
      if (this.router.url !== '/login' && this.router.url !== '/register') {
        this.router.navigate(['/login']);
      }
    }
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