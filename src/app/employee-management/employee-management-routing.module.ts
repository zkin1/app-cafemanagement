import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmployeeManagementPage } from './employee-management.page';

const routes: Routes = [
  {
    path: '',
    component: EmployeeManagementPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeManagementPageRoutingModule {}
