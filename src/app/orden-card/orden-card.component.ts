// orden-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order } from '../models/order.model';

@Component({
  selector: 'app-orden-card',
  templateUrl: './orden-card.component.html',
  styleUrls: ['./orden-card.component.scss']
})
export class OrdenCardComponent {
  @Input() orden!: Order;
  @Output() cambiarEstado = new EventEmitter<{orden: Order, nuevoEstado: string}>();

  onCambiarEstado(nuevoEstado: string) {
    this.cambiarEstado.emit({orden: this.orden, nuevoEstado});
  }

  getOrderTotal(): number {
    return this.orden.items?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
  }
}