import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CarroComprasPage } from './carro-compras.page';

const routes: Routes = [
  {
    path: '',
    component: CarroComprasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CarroComprasPageRoutingModule {}
