import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
interface OrderItem {
  name: string;
  cantidad: number;
  tipoLeche?: string;
  tamano?: string;
}

interface Orden {
  id: number;
  numeroMesa: number;
  items: OrderItem[];
  estado: 'pendiente' | 'en proceso' | 'lista' | 'cancelada';
  total: number;
  nota?: string;
}

@Component({
  selector: 'app-comandas',
  templateUrl: './comandas.page.html',
  styleUrls: ['./comandas.page.scss'],
})
export class ComandasPage implements OnInit {
  ordenes: Orden[] = [];

  constructor(private toastController: ToastController) { }

  ngOnInit() {
    this.cargarOrdenes();
  }

  cargarOrdenes() {
    this.ordenes = [
      { 
        id: 1, 
        numeroMesa: 3, 
        items: [
          { name: 'Café Latte', cantidad: 2, tipoLeche: 'descremada', tamano: 'grande' }
        ], 
        estado: 'pendiente', 
        total: 8000,
        nota: 'Sin azucar, por favor'
      },
      { 
        id: 2, 
        numeroMesa: 5, 
        items: [
          { name: 'Cappuccino', cantidad: 1, tipoLeche: 'soya', tamano: 'mediano' }, 
          { name: 'Croissant', cantidad: 1 }
        ], 
        estado: 'en proceso', 
        total: 9500,
        nota: 'Calentar el croissant'
      },
      { 
        id: 3, 
        numeroMesa: 2, 
        items: [
          { name: 'Espresso', cantidad: 1, tamano: 'pequeno' }
        ], 
        estado: 'lista', 
        total: 3500
      },
    ];
  }

  cambiarEstado(orden: Orden, nuevoEstado: 'en proceso' | 'lista' | 'cancelada') {
    orden.estado = nuevoEstado;
    this.mostrarToast(`Orden #${orden.id} marcada como ${nuevoEstado}`);
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}