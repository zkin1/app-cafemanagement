import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

interface CartItem {
  name: string;
  description: string;
  price: number;
  image: string;
  selectedSize: string;
  selectedMilk: string;
  quantity: number;
  finalPrice: number;
}

interface Order {
  orderNumber: number;
  items: CartItem[];
  tableNumber: number | null;
  note: string;
  total: number;
}

@Component({
  selector: 'app-carro-compras',
  templateUrl: './carro-compras.page.html',
  styleUrls: ['./carro-compras.page.scss'],
})
export class CarroComprasPage implements OnInit {
  currentOrder: Order = {
    orderNumber: 0,
    items: [],
    tableNumber: null,
    note: '',
    total: 0
  };

  toastMessage: string = '';
  showToast: boolean = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadOrder();
  }

  loadOrder() {
    const lastOrder = (window as any).lastOrder;
    if (lastOrder) {
      this.currentOrder = lastOrder;
    } else {
      this.simulateOrder();
    }
    this.calculateTotal();
  }

  simulateOrder() {
    this.currentOrder.orderNumber = Math.floor(Math.random() * 1000) + 1;
    this.currentOrder.items = [{
      name: 'Latte',
      description: 'Espresso con leche cremosa',
      price: 6000,
      image: 'assets/latte.jpg',
      selectedSize: 'grande',
      selectedMilk: 'soya',
      quantity: 1,
      finalPrice: 7000 
    }];
  }

  calculateTotal() {
    this.currentOrder.total = this.currentOrder.items.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
  }

  confirmarOrden() {
    console.log('Orden confirmada:', this.currentOrder);
    this.presentToast('Orden confirmada con éxito');
    setTimeout(() => {
      (window as any).lastOrder = null;
      this.router.navigate(['/main']);
    }, 3000);
  }

  presentToast(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    this.cdr.detectChanges(); 
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges(); 
    }, 3000);
  }
}