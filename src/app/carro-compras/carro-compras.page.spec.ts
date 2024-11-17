import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CarroComprasPage } from './carro-compras.page';
import { DatabaseService } from '../services/database.service';

describe('CarroComprasPage', () => {
  let component: CarroComprasPage;
  let fixture: ComponentFixture<CarroComprasPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCartItem = {
    id: 1,
    name: 'Café',
    description: 'Café caliente',
    price: 2.50,
    image: 'cafe.jpg',
    selectedSize: 'Medium',
    selectedMilk: 'Regular',
    quantity: 1,
    finalPrice: 2.50
  };

  const mockUser = {
    id: 1,
    name: 'Test User'
  };

  beforeEach(async () => {
    // Crear spies para todos los servicios
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['createOrder', 'addProductToOrder']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const alertSpy = jasmine.createSpyObj('AlertController', ['create']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    // Mock del loading element
    const mockLoading = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    };

    // Mock del toast con comportamiento asíncrono
    const mockToast = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
    };

    // Configurar los spies
    loadingSpy.create.and.returnValue(Promise.resolve(mockLoading));
    toastSpy.create.and.returnValue(Promise.resolve(mockToast));
    
    // Mock del alert con handler funcional
    alertSpy.create.and.callFake((options) => {
      const mockAlert = {
        present: jasmine.createSpy('present').and.callFake(() => {
          // Simular que el usuario presiona el botón "Eliminar"
          if (options.buttons && options.buttons[1] && options.buttons[1].handler) {
            setTimeout(() => {
              options.buttons[1].handler();
            });
          }
          return Promise.resolve();
        }),
        dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
      };
      return Promise.resolve(mockAlert);
    });

    // Configurar TestBed
    await TestBed.configureTestingModule({
      declarations: [CarroComprasPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: AlertController, useValue: alertSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.callFake((key) => {
        if (key === 'currentUser') return JSON.stringify(mockUser);
        if (key === `cart_${mockUser.id}`) return JSON.stringify({
          orderNumber: 1,
          items: [mockCartItem]
        });
        return null;
      }),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem')
    };

    spyOn(window.localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
    spyOn(window.localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);
    spyOn(window.localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem);

    // Crear el componente y obtener los spies
    fixture = TestBed.createComponent(CarroComprasPage);
    component = fixture.componentInstance;
    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingControllerSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    alertControllerSpy = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  // Pruebas por defecto
  it('1. debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe inicializar con valores predeterminados', () => {
    expect(component.showToast).toBeFalse();
    expect(component.toastMessage).toBe('');
    expect(component.currentOrder.status).toBe('Solicitado');
  });

  it('3. debe cargar el carro de compras correctamente desde localStorage', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(localStorage.getItem).toHaveBeenCalledWith('currentUser');
    expect(localStorage.getItem).toHaveBeenCalledWith(`cart_${mockUser.id}`);
  }));

  it('4. debe calcular el total correctamente', () => {
    component.currentOrderItems = [
      { ...mockCartItem, quantity: 2, finalPrice: 2.50 }
    ];
    expect(component.calculateTotal()).toBe(5.00);
  });

  it('5. Debería manejar el carrito vacío', () => {
    component.currentOrderItems = [];
    expect(component.calculateTotal()).toBe(0);
  });

  // Pruebas personalizadas
  it('1. Debería actualizar la cantidad correctamente', fakeAsync(async () => {
    component.currentOrderItems = [{ ...mockCartItem }];
    await component.updateQuantity(component.currentOrderItems[0], 1);
    tick();
    expect(component.currentOrderItems[0].quantity).toBe(2);
  }));

  it('2. Debería eliminar el artículo cuando la cantidad llegue a cero', fakeAsync(async () => {
    // Configurar estado inicial
    component.currentOrderItems = [{ ...mockCartItem }];
    
    // Llamar a updateQuantity con -1 para activar la eliminación
    await component.updateQuantity(component.currentOrderItems[0], -1);
    tick();

    // Verificar que se mostró el alert de confirmación
    expect(alertControllerSpy.create).toHaveBeenCalledWith({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar ${mockCartItem.name} de su orden?`,
      buttons: jasmine.any(Array)
    });

    // Avanzar los timers para manejar la confirmación del alert
    tick(100);

    // Verificar que el item fue eliminado
    expect(component.currentOrderItems.length).toBe(0);

    // Verificar que se mostró el toast
    expect(toastControllerSpy.create).toHaveBeenCalledWith({
      message: 'Producto eliminado de la orden',
      duration: 3000,
      position: 'top'
    });

    tick();
  }));

  it('3. Debe validar el pedido antes de la confirmación.', fakeAsync(async () => {
    component.currentOrderItems = [mockCartItem];
    component.currentOrder.tableNumber = null;
    
    await component.confirmarOrden();
    tick();
    
    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Por favor, seleccione un número de mesa antes de confirmar la orden.',
        duration: 3000,
        position: 'top'
      })
    );
  }));

  it('4. Debería procesarse el pedido con éxito', fakeAsync(async () => {
    // Configurar estado inicial
    component.currentOrderItems = [mockCartItem];
    component.currentOrder.tableNumber = 1;
    
    // Mock de las respuestas del servicio
    databaseServiceSpy.createOrder.and.returnValue(Promise.resolve(1));
    databaseServiceSpy.addProductToOrder.and.returnValue(Promise.resolve(1)); // Retorna un Promise<number>
    
    // Ejecutar la confirmación de la orden
    await component.confirmarOrden();
    tick();
    
    // Verificar que se llamaron los métodos esperados
    expect(databaseServiceSpy.createOrder).toHaveBeenCalled();
    expect(databaseServiceSpy.addProductToOrder).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/main']);
    
    tick();
  }));

  it('5. Debe manejar actualizaciones de almacenamiento local', fakeAsync(async () => {
    component.currentOrderItems = [mockCartItem];
    component.updateLocalStorage();
    tick();
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      `cart_${mockUser.id}`,
      jasmine.any(String)
    );
  }));
});