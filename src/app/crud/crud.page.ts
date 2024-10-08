import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Product } from '../models/product.model';
import { ToastController, LoadingController } from '@ionic/angular';
import { Subscription, Observable, from, of} from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-crud',
  templateUrl: './crud.page.html',
  styleUrls: ['./crud.page.scss'],
})
export class CrudPage implements OnInit, OnDestroy {

  showToast: boolean = false;
  toastMessage: string = '';

  products: Product[] = [];
  currentProduct: Product = { id: 0, name: '', description: '', price: 0, category: '', imageURL: '', isAvailable: true };
  isEditing = false;
  activeSection: 'add' | 'edit' | 'delete' | 'view' = 'view';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.loadProducts();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadProducts() {
    const loading = await this.loadingController.create({
      message: 'Cargando productos...',
    });
    await loading.present();

    try {
      this.products = await this.getAllProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.presentToast('Error al cargar los productos');
    } finally {
      await loading.dismiss();
    }
  }

  private getAllProducts(): Promise<Product[]> {
    const result = this.databaseService.getAllProducts();
    if (result instanceof Observable) {
      return result.pipe(
        map(products => products || []),
        catchError(() => of([]))
      ).toPromise().then(value => value ?? []);
    }
    return Promise.resolve(result || []);
  }
  
  async addProduct() {
    const loading = await this.loadingController.create({
      message: 'Agregando producto...',
    });
    await loading.present();

    try {
      const newProductId = await this.createProduct(this.currentProduct);
      if (newProductId !== undefined) {
        this.currentProduct.id = newProductId;
        this.products.push({ ...this.currentProduct });
        this.presentToast('Producto agregado con éxito');
        this.resetForm();
      } else {
        throw new Error('No se pudo crear el producto');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      this.presentToast('Error al agregar el producto');
    } finally {
      await loading.dismiss();
    }
  }

  private createProduct(product: Product): Promise<number | undefined> {
    const result = this.databaseService.createProduct(product);
    if (result instanceof Observable) {
      return result.toPromise();
    }
    return result;
  }

  async updateProduct() {
    const loading = await this.loadingController.create({
      message: 'Actualizando producto...',
    });
    await loading.present();

    try {
      const success = await this.updateProductInDb(this.currentProduct);
      if (success) {
        const index = this.products.findIndex(p => p.id === this.currentProduct.id);
        if (index !== -1) {
          this.products[index] = { ...this.currentProduct };
        }
        this.presentToast('Producto actualizado con éxito');
        this.resetForm();
      } else {
        throw new Error('No se pudo actualizar el producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      this.presentToast('Error al actualizar el producto');
    } finally {
      await loading.dismiss();
    }
  }

  private updateProductInDb(product: Product): Promise<boolean> {
    const result = this.databaseService.updateProduct(product);
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true),
        catchError(() => of(false))
      ).toPromise().then(value => value ?? false);
    }
    return Promise.resolve(!!result);
  }

  async deleteProduct(id: number) {
    const loading = await this.loadingController.create({
      message: 'Eliminando producto...',
    });
    await loading.present();

    try {
      const success = await this.deleteProductFromDb(id);
      if (success) {
        this.products = this.products.filter(p => p.id !== id);
        this.presentToast('Producto eliminado con éxito');
      } else {
        throw new Error('No se pudo eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      this.presentToast('Error al eliminar el producto');
    } finally {
      await loading.dismiss();
    }
  }

  private deleteProductFromDb(id: number): Promise<boolean> {
    const result = this.databaseService.deleteProduct(id);
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true),
        catchError(() => of(false))
      ).toPromise().then(value => value ?? false);
    }
    return Promise.resolve(!!result);
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
    await toast.present();
  }

  setActiveSection(section: 'add' | 'edit' | 'delete' | 'view') {
    this.activeSection = section;
    if (section !== 'edit') {
      this.resetForm();
    }
  }
}