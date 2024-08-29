import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
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
  constructor(private router: Router) {
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

  get isLoggedIn(): boolean {
    return !!(window as any).currentUser;
  }

  get isAdmin(): boolean {
    return (window as any).currentUser?.role === 'admin';
  }

  get isEmployee(): boolean {
    return (window as any).currentUser?.role === 'employee';
  }

  get currentUserName(): string | undefined {
    return (window as any).currentUser?.name;
  }

  logout() {
    (window as any).currentUser = null;
    this.router.navigate(['/login']);
  }
}