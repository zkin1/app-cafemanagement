import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { MainPage } from './main.page';
import { DatabaseService } from '../services/database.service';
import { DatabaseServiceMock } from '../mocks/database.service.mock';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Product } from '../models/product.model';
import { of } from 'rxjs';

interface ExtendedProduct extends Product {
  showOptions: boolean;
  selectedSize: string;
  selectedMilk: string;
  imageURL: string;
}

describe('MainPage', () => {
  let component: MainPage;
  let fixture: ComponentFixture<MainPage>;
  let databaseService: jasmine.SpyObj<DatabaseService>;
  let toastController: jasmine.SpyObj<ToastController>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let router: Router;

  const mockProduct: ExtendedProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 2500,
    category: 'Test Category',
    imageURL: 'test.jpg',
    isAvailable: true,
    showOptions: false,
    selectedSize: 'medium',
    selectedMilk: 'regular'
  };

  const mockUser = {
    id: 1,
    name: 'Test User'
  };

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['getAllProducts']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);

    dbSpy.getAllProducts.and.returnValue(of([mockProduct]));

    const mockLoadingElement = {
      present: jasmine.createSpy('present'),
      dismiss: jasmine.createSpy('dismiss')
    };
    loadingSpy.create.and.returnValue(Promise.resolve(mockLoadingElement));

    const mockToastElement = {
      present: jasmine.createSpy('present')
    };
    toastSpy.create.and.returnValue(Promise.resolve(mockToastElement));

    await TestBed.configureTestingModule({
      declarations: [MainPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MainPage);
    component = fixture.componentInstance;
    databaseService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    router = TestBed.inject(Router);

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'currentUser') return JSON.stringify(mockUser);
      if (key === `cart_${mockUser.id}`) return JSON.stringify({
        orderNumber: 1,
        userId: mockUser.id,
        items: [mockProduct]
      });
      if (key === `lastOrderNumber_${mockUser.id}`) return '1';
      return null;
    });

    spyOn(localStorage, 'setItem').and.callFake(() => {});
    spyOn(localStorage, 'removeItem').and.callFake(() => {});
  });

  // 5 pruebas por defecto
  it('1. debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe inicializar con valores predeterminados', () => {
    expect(component.products).toBeDefined();
    expect(component.products.length).toBe(0);
    expect(component.currentOrderNumber).toBeGreaterThan(0);
  });

  it('3. Debería cargar productos al iniciar', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(databaseService.getAllProducts).toHaveBeenCalled();
  }));

  it('4. Debería calcular el precio correctamente', () => {
    const product = { ...mockProduct };
    
    product.selectedSize = 'pequeño';
    expect(component.calculatePrice(product)).toBe(1500);
    
    product.selectedSize = 'grande';
    expect(component.calculatePrice(product)).toBe(3500);
  });

  it('5. Debería manejar errores de imagen', () => {
    const event = { target: { src: '' } };
    component.handleImageError(event);
    expect(event.target.src).toBe('assets/default-product-image.jpg');
  });

  // 5 pruebas personalizadas
  it('1. Debería agregar el producto al carrito', fakeAsync(() => {
    const product = { ...mockProduct };
    component.addToCart(product);
    tick();
    expect(component.currentOrderItems.length).toBeGreaterThan(0);
  }));

  it('2. Debería actualizar la cantidad en el carrito', fakeAsync(() => {
    const product = { ...mockProduct };
    component.currentOrderItems = [{ ...product, quantity: 1 }];
    component.updateQuantity(product, 1);
    expect(component.currentOrderItems[0].quantity).toBe(2);
  }));

  it('3. Debería cargar el pedido actual', fakeAsync(() => {
    component.loadCurrentOrder();
    tick();
    expect(component.currentOrderItems).toBeDefined();
  }));
  it('4. Debe manejar el pedido completo', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.currentOrderItems = [mockProduct];
    
    component.completeOrder();
    tick(); 
    tick(100);
    
    expect(router.navigate).toHaveBeenCalledWith(['/carro-compras']);
}));

  it('5. Debería evitar que se completen pedidos vacíos.', fakeAsync(() => {
    component.currentOrderItems = [];
    component.completeOrder();
    tick();
    expect(toastController.create).toHaveBeenCalledWith({
      message: 'El carrito está vacío. Añada productos antes de completar la orden.',
      duration: 2000,
      position: 'top'
    });
  }));

  // Tests adicionales para manejo de errores
  it('Debe gestionar los errores de carga del producto.', fakeAsync(() => {
    databaseService.getAllProducts.and.returnValue(of([]));
    component.loadProducts();
    tick();
    expect(component.products.length).toBe(0);
  }));

  it('Debería negar agregar al carrito cuando no se inicia sesión', fakeAsync(() => {
    // Forma correcta de espiar un getter
    spyOnProperty(component, 'isLoggedIn').and.returnValue(false);
    spyOn(router, 'navigate');
    
    component.addToCart(mockProduct);
    tick();
    
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.currentOrderItems.length).toBe(0);
}));
});