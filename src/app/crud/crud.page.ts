import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, createOutline, trashOutline, listOutline } from 'ionicons/icons';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-crud',
  templateUrl: './crud.page.html',
  styleUrls: ['./crud.page.scss'],
})
export class CrudPage implements OnInit {
  products: Product[] = [];
  currentProduct: Product = { id: 0, name: '', description: '', price: 0, image: '' };
  isEditing = false;
  activeSection: 'add' | 'edit' | 'delete' | 'view' = 'view';

  constructor(private toastController: ToastController) {
    addIcons({ addCircleOutline, createOutline, trashOutline, listOutline });
  }
  
  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    // Simular carga de productos
    this.products = [
      { id: 1, name: 'Latte', description: 'Espresso con leche cremosa', price: 6000, image: 'assets/latte.jpg' },
      { id: 2, name: 'Cappuccino', description: 'Espresso con leche espumosa', price: 7000, image: 'assets/cappuccino.jpg' },
      { id: 3, name: 'Americano', description: 'Espresso diluido con agua caliente', price: 4000, image: 'assets/americano.jpg' }
    ];
  }

  addProduct() {
    this.products.push({ ...this.currentProduct, id: this.products.length + 1 });
    this.presentToast('Producto agregado con éxito');
    this.resetForm();
  }

  updateProduct() {
    const index = this.products.findIndex(p => p.id === this.currentProduct.id);
    if (index !== -1) {
      this.products[index] = { ...this.currentProduct };
      this.presentToast('Producto actualizado con éxito');
      this.resetForm();
    }
  }

  editProduct(product: Product) {
    this.currentProduct = { ...product };
    this.isEditing = true;
    this.activeSection = 'edit';
  }

  deleteProduct(id: number) {
    this.products = this.products.filter(p => p.id !== id);
    this.presentToast('Producto eliminado con éxito');
  }

  resetForm() {
    this.currentProduct = { id: 0, name: '', description: '', price: 0, image: '' };
    this.isEditing = false;
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  setActiveSection(section: 'add' | 'edit' | 'delete' | 'view') {
    this.activeSection = section;
    if (section !== 'edit') {
      this.resetForm();
    }
  }
}