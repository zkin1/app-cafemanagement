import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'admin',
        loadChildren: () => import('./admin/admin.module').then(m => m.AdminPageModule)
      },

      {
        path: 'schedule-meeting',
        loadChildren: () => import('./schedule-meeting/schedule-meeting.module').then(m => m.ScheduleMeetingPageModule)
      },
      {
        path: 'admin-dashboard',
        loadChildren: () => import('./admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardPageModule)
      },
      {
        path: 'carro-compras',
        loadChildren: () => import('./carro-compras/carro-compras.module').then(m => m.CarroComprasPageModule)
      },
      {
        path: 'comandas',
        loadChildren: () => import('./comandas/comandas.module').then(m => m.ComandasPageModule)
      },
      {
        path: 'crud',
        loadChildren: () => import('./crud/crud.module').then(m => m.CrudPageModule)
      },
      {
        path: 'employee-dashboard',
        loadChildren: () => import('./employee-dashboard/employee-dashboard.module').then(m => m.EmployeeDashboardPageModule)
      },
      {
        path: 'employee-management',
        loadChildren: () => import('./employee-management/employee-management.module').then(m => m.EmployeeManagementPageModule)
      },
      {
        path: 'main',
        loadChildren: () => import('./main/main.module').then(m => m.MainPageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('./perfil/perfil.module').then(m => m.PerfilPageModule)
      }
    ]
  },
    {
      path: 'login',
      loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
    },
    {
      path: 'register',
      loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
    },
    {
      path: 'forgot-password',
      loadChildren: () => import('./forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
    },
    {
      path: 'not-found',
      loadChildren: () => import('./not-found/not-found.module').then(m => m.NotFoundPageModule)
    },
    {
      path: '**',
      redirectTo: 'not-found',
      pathMatch: 'full'
    }
  ];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }