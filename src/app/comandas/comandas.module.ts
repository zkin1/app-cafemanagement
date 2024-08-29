import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComandasPageRoutingModule } from './comandas-routing.module';
import { ComandasPage } from './comandas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComandasPageRoutingModule
  ],
  declarations: [ComandasPage]
})
export class ComandasPageModule {}