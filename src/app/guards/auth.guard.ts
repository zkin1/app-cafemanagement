import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (currentUser && currentUser.id) {
      // Usuario autenticado
      if (state.url === '/login' || state.url === '/') {
        // Si el usuario intenta acceder a la página de login o la raíz estando autenticado
        if (currentUser.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/employee-dashboard']);
        }
        return false;
      }
      return true;
    }

    // Usuario no autenticado
    if (state.url !== '/login' && 
      state.url !== '/register' && 
      state.url !== '/forgot-password') { 
    this.router.navigate(['/login']);
    return false;
  }

  return true;
}
}