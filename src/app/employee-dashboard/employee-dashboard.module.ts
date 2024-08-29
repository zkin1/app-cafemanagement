import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { EmployeeDashboardPageRoutingModule } from './employee-dashboard-routing.module';
import { EmployeeDashboardPage } from './employee-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmployeeDashboardPageRoutingModule,
    RouterModule
  ],
  declarations: [EmployeeDashboardPage]
})
export class EmployeeDashboardPageModule {}