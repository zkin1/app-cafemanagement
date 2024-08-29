import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carro-compras',
  templateUrl: './carro-compras.page.html',
  styleUrls: ['./carro-compras.page.scss'],
})
export class CarroComprasPage implements OnInit {
  items: any[] = [];
  orderNumber: number = 0;
  note: string = '';
  tableNumber: number | null = null;

  constructor(
    private toastController: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    // Recuperar la última orden (simulado)
    const lastOrder = (window as any).lastOrder;
    if (lastOrder) {
      this.items = lastOrder.items;
      this.orderNumber = lastOrder.orderNumber;
    }
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => total + item.finalPrice, 0);
  }

  async confirmarOrden() {
    // Aquí puedes agregar la lógica para procesar la orden
    console.log('Orden confirmada:', {
      orderNumber: this.orderNumber,
      items: this.items,
      tableNumber: this.tableNumber,
      note: this.note,
      total: this.getTotalPrice()
    });

    // Mostrar un mensaje de confirmación
    const toast = await this.toastController.create({
      message: 'Orden confirmada con éxito',
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();

    // Limpiar el carrito y redirigir a la página principal
    (window as any).lastOrder = null;
    this.router.navigate(['/main']);
  }
}