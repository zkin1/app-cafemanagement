import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { CrudPage } from './crud.page';
import { DatabaseService } from '../services/database.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('CrudPage', () => {
  let component: CrudPage;
  let fixture: ComponentFixture<CrudPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;

  // Mock Data
  const mockProducts = [
    {
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'Test Category',
      imageURL: 'test.jpg',
      isAvailable: true
    }
  ];

  beforeEach(async () => {
    // Create spies
    databaseServiceSpy = jasmine.createSpyObj('DatabaseService', {
      getAllProducts: of(mockProducts),
      createProduct: Promise.resolve(1),
      updateProduct: of(true),
      deleteProduct: of(true)
    });

    const mockLoading = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    };

    const mockToast = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
    };

    loadingControllerSpy = jasmine.createSpyObj('LoadingController', {
      create: Promise.resolve(mockLoading)
    });

    toastControllerSpy = jasmine.createSpyObj('ToastController', {
      create: Promise.resolve(mockToast)
    });

    await TestBed.configureTestingModule({
      declarations: [CrudPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: databaseServiceSpy },
        { provide: LoadingController, useValue: loadingControllerSpy },
        { provide: ToastController, useValue: toastControllerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CrudPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test de creación del componente
  it('1. debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  // Test de inicialización
  it('2. debe inicializar correctamente', () => {
    expect(component.products).toEqual([]);
    expect(component.currentProduct).toBeDefined();
    expect(component.isEditing).toBeFalse();
    expect(component.activeSection).toBe('view');
    expect(component.showToast).toBeFalse();
  });

  // Test de carga de productos
  it('3. debe cargar productos', async () => {
    await component.loadProducts();
    expect(databaseServiceSpy.getAllProducts).toHaveBeenCalled();
    expect(component.products.length).toBeGreaterThan(0);
  });

  // Test de reset del formulario
  it('4. debe resetear el formulario', () => {
    component.resetForm();
    expect(component.currentProduct).toEqual({
      id: 0,
      name: '',
      description: '',
      price: 0,
      category: '',
      imageURL: '',
      isAvailable: true
    });
    expect(component.isEditing).toBeFalse();
  });

  // Test de manejo de imagen por defecto
  it('1. Debería manejar el error de imagen configurando la imagen predeterminada', () => {
    const event = { target: { src: '' } };
    component.handleImageError(event);
    expect(event.target.src).toBe('assets/default-product-image.jpg');
  });

  // Test de cambio de sección
  it('2. Debería cambiar la sección', () => {
    component.setActiveSection('add');
    expect(component.activeSection).toBe('add');
    expect(component.isEditing).toBeFalse();
  });

  // Test de edición de producto
  it('3. Debería editar un producto', () => {
    const productToEdit = mockProducts[0];
    component.editProduct(productToEdit);
    expect(component.currentProduct).toEqual(productToEdit);
    expect(component.isEditing).toBeTrue();
    expect(component.activeSection).toBe('edit');
  });

  // Test de presentación de toast
  it('4. Debería presentar un toast', async () => {
    const message = 'Test message';
    await component.presentToast(message);
    expect(toastControllerSpy.create).toHaveBeenCalled();
  });

  // Test de URL de imagen
  it('5. Debería obtener la URL de la imagen', () => {
    // @ts-ignore: Accessing private method for testing
    const imageUrl = component.getImageUrl('test.jpg');
    expect(imageUrl).toBe('assets/test.jpg');

    // @ts-ignore: Accessing private method for testing
    const defaultImageUrl = component.getImageUrl('');
    expect(defaultImageUrl).toBe('assets/default-product-image.jpg');

    // @ts-ignore: Accessing private method for testing
    const dataUrl = component.getImageUrl('data:image/jpeg;base64,test');
    expect(dataUrl).toBe('data:image/jpeg;base64,test');
  });

  afterEach(() => {
    fixture.destroy();
  });
});