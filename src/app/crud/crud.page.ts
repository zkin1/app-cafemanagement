import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Product } from '../models/product.model';
import { ToastController, LoadingController } from '@ionic/angular';
import { Subscription, Observable, from, of, lastValueFrom} from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';

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

  async selectImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        this.currentProduct.imageURL = image.dataUrl;
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      this.presentToast('Error al seleccionar la imagen');
    }
  }

  async loadProducts() {
    const loading = await this.loadingController.create({
      message: 'Cargando productos...',
    });
    await loading.present();
  
    try {
      const products = await this.getAllProducts();
      console.log('Productos obtenidos de la base de datos:', products);
  
      this.products = products.map(product => ({
        ...product,
        imageURL: this.getImageUrl(product.imageURL),
        showOptions: false,
        selectedSize: 'medium',
        selectedMilk: 'regular'
      }));
  
      console.log('Productos procesados:', this.products);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      await this.presentToast('Error al cargar los productos. Por favor, intente de nuevo.');
    } finally {
      await loading.dismiss();
    }
  }

  private getImageUrl(imageUri: string): string {
    if (!imageUri) {
      return 'assets/default-product-image.jpg';
    }
  
    if (imageUri.startsWith('data:image') || imageUri.startsWith('assets/')) {
      return imageUri;
    }
  
    return `assets/${imageUri}`;
  }


  private getAllProducts(): Promise<Product[]> {
    return firstValueFrom(this.databaseService.getAllProducts().pipe(
      catchError(error => {
        console.error('Error al obtener productos:', error);
        return of([]);
      })
    ));
  }
  
  async addProduct() {
    const loading = await this.loadingController.create({
      message: 'Agregando producto...',
    });
    await loading.present();
  
    try {
      if (this.currentProduct.imageURL && this.currentProduct.imageURL.startsWith('data:image')) {
        const fileName = `product_${new Date().getTime()}.jpeg`;
        this.currentProduct.imageURL = await this.saveImage(this.currentProduct.imageURL, fileName);
      }
  
      const newProductId = await this.createProduct(this.currentProduct);
      if (newProductId !== undefined) {
        this.currentProduct.id = newProductId;
        this.products.push({ ...this.currentProduct });
        this.presentToast('Producto agregado con éxito');
        this.resetForm();
        await this.loadProducts();
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
    if (this.currentProduct.price < 0) {
      this.presentToast('El precio debe ser mayor o igual a 0');
      return;
    }
  
    const loading = await this.loadingController.create({
      message: 'Actualizando producto...',
    });
    await loading.present();
  
    try {
      if (this.currentProduct.imageURL && this.currentProduct.imageURL.startsWith('data:image')) {
        const fileName = `product_${this.currentProduct.id}_${new Date().getTime()}.jpeg`;
        this.currentProduct.imageURL = await this.saveImage(this.currentProduct.imageURL, fileName);
      }
  
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
      console.error('Error al actualizar el producto:', error);
      this.presentToast('Error al actualizar el producto');
    } finally {
      await loading.dismiss();
    }
  }
  private async saveImage(imageDataUrl: string, fileName: string): Promise<string> {
    try {
      // Extraer la base64 del Data URL
      const base64Data = imageDataUrl.split(',')[1];
  
      // Guardar el archivo en el directorio de datos de la aplicación
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });
  
      // Devolver la ruta completa del archivo guardado
      return savedFile.uri;
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      throw new Error('No se pudo guardar la imagen');
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
        await this.loadProducts();
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


  handleImageError(event: any) {
    event.target.src = 'assets/default-product-image.jpg';
  }


}