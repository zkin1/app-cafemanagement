import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CarroComprasPageRoutingModule } from './carro-compras-routing.module';
import { CarroComprasPage } from './carro-compras.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CarroComprasPageRoutingModule
  ],
  declarations: [CarroComprasPage]
})
export class CarroComprasPageModule {}