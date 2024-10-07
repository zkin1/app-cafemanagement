import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Product } from '../models/product.model';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, createOutline, trashOutline, listOutline } from 'ionicons/icons';

@Component({
  selector: 'app-crud',
  templateUrl: './crud.page.html',
  styleUrls: ['./crud.page.scss'],
})
export class CrudPage implements OnInit {

  showToast: boolean = false;
  toastMessage: string = '';

  
  products: Product[] = [];
  currentProduct: Product = { id: 0, name: '', description: '', price: 0, category: '', imageURL: '', isAvailable: true };
  isEditing = false;
  activeSection: 'add' | 'edit' | 'delete' | 'view' = 'view';

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController
  ) {
    addIcons({ addCircleOutline, createOutline, trashOutline, listOutline });
  }

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      this.products = await this.databaseService.getAllProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.presentToast('Error al cargar los productos');
    }
  }

  async addProduct() {
    try {
      const newProductId = await this.databaseService.createProduct(this.currentProduct);
      this.currentProduct.id = newProductId;
      this.products.push({ ...this.currentProduct });
      this.presentToast('Producto agregado con éxito');
      this.resetForm();
    } catch (error) {
      console.error('Error adding product:', error);
      this.presentToast('Error al agregar el producto');
    }
  }

  async updateProduct() {
    try {
      await this.databaseService.updateProduct(this.currentProduct);
      const index = this.products.findIndex(p => p.id === this.currentProduct.id);
      if (index !== -1) {
        this.products[index] = { ...this.currentProduct };
      }
      this.presentToast('Producto actualizado con éxito');
      this.resetForm();
    } catch (error) {
      console.error('Error updating product:', error);
      this.presentToast('Error al actualizar el producto');
    }
  }

  async deleteProduct(id: number) {
    try {
      await this.databaseService.deleteProduct(id);
      this.products = this.products.filter(p => p.id !== id);
      this.presentToast('Producto eliminado con éxito');
    } catch (error) {
      console.error('Error deleting product:', error);
      this.presentToast('Error al eliminar el producto');
    }
  }

  editProduct(product: Product) {
    this.currentProduct = { ...product };
    this.isEditing = true;
    this.activeSection = 'edit';
  }

  resetForm() {
    this.currentProduct = { id: 0, name: '', description: '', price: 0, category: '', imageURL: '', isAvailable: true };
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