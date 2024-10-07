import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { DatabaseService } from './services/database.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
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
    private router: Router
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
      
      await this.initializeDatabase();
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  private async initializeDatabase() {
    try {
      await this.databaseService.initializeDatabase();
      console.log('Database initialized');
      
      const users = await this.databaseService.getAllUsers();
      console.log('Retrieved users:', users.length);
      
      if (users.length === 0) {
        console.log('No users found, inserting seed data');
        await this.databaseService.insertSeedData();
        console.log('Seed data inserted successfully');
      } else {
        console.log('Users already exist, skipping seed data insertion');
      }
      
      // Verify database connection
      const isConnected = await this.databaseService.testDatabaseConnection();
      console.log('Database connection test:', isConnected ? 'Successful' : 'Failed');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error; // Re-throw the error to be caught in initializeApp
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
}