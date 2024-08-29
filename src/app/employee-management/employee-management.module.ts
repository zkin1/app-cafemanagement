import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { EmployeeManagementPageRoutingModule } from './employee-management-routing.module';
import { EmployeeManagementPage } from './employee-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmployeeManagementPageRoutingModule
  ],
  declarations: [EmployeeManagementPage]
})
export class EmployeeManagementPageModule {}