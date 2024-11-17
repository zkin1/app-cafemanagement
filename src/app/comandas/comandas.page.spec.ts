import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { ComandasPage } from './comandas.page';
import { DatabaseService } from '../services/database.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';

describe('ComandasPage', () => {
  let component: ComandasPage;
  let fixture: ComponentFixture<ComandasPage>;
  let databaseService: jasmine.SpyObj<DatabaseService>;
  let toastController: jasmine.SpyObj<ToastController>;
  let loadingController: jasmine.SpyObj<LoadingController>;

  // Mock completo de Order con tipos correctos
  const mockOrders: Order[] = [
    {
      id: 1,
      orderNumber: 1001,
      userId: 1,
      status: 'Solicitado',
      tableNumber: 1,
      notes: '',
      totalAmount: 100,
      paymentMethod: 'efectivo',
      createdAt: new Date(),
      items: []
    },
    {
      id: 2,
      orderNumber: 1002,
      userId: 1,
      status: 'En proceso',
      tableNumber: 2,
      notes: '',
      totalAmount: 200,
      paymentMethod: 'efectivo',
      createdAt: new Date(),
      items: []
    },
    {
      id: 3,
      orderNumber: 1003,
      userId: 1,
      status: 'Listo',
      tableNumber: 3,
      notes: '',
      totalAmount: 300,
      paymentMethod: 'efectivo',
      createdAt: new Date(),
      items: []
    }
  ];

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', [
      'getOrdersByStatus',
      'getOrderDetails',
      'updateOrderStatus',
      'getOrdersCount'
    ]);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);

    // Mock responses
    dbSpy.getOrdersByStatus.and.returnValue(of(mockOrders));
    dbSpy.getOrderDetails.and.returnValue(of([]));
    dbSpy.updateOrderStatus.and.returnValue(of(true));
    dbSpy.getOrdersCount.and.returnValue(Promise.resolve(3));

    toastSpy.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve()
    }));

    loadingSpy.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve()
    }));

    await TestBed.configureTestingModule({
      declarations: [ComandasPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ComandasPage);
    component = fixture.componentInstance;
    databaseService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    fixture.detectChanges();
  });
  
  it('1. debe cargar el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe tener las dependencias inyectadas', () => {
    expect(databaseService).toBeTruthy();
    expect(toastController).toBeTruthy();
    expect(loadingController).toBeTruthy();
  });

  it('3. debe inicializar con valores predeterminados', () => {
    expect(component.ordenesSolicitadas).toEqual([]);
    expect(component.ordenesEnProceso).toEqual([]);
    expect(component.ordenesListas).toEqual([]);
    expect(component.ordenesCanceladas).toEqual([]);
    expect(component.currentSegment).toBe('solicitadas');
  });

  it('4. debe tener ion-header y ion-content', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ion-header')).toBeTruthy();
    expect(compiled.querySelector('ion-content')).toBeTruthy();
    expect(compiled.querySelector('ion-segment')).toBeTruthy();
  });

  it('5. debe suscribirse y desuscribirse de observables', () => {
    const subscription = component['subscriptions'];
    expect(subscription).toBeTruthy();
    component.ngOnDestroy();
    expect(subscription.closed).toBeTrue();
  });


  it('1. Debe cargar pedidos y calcular el total diario al inicio.', fakeAsync(async () => {
    await component.ngOnInit();
    tick();

    expect(databaseService.getOrdersByStatus).toHaveBeenCalledWith([
      'Solicitado', 'En proceso', 'Listo', 'Cancelado'
    ]);
    expect(databaseService.getOrdersCount).toHaveBeenCalled();
    expect(component.totalOrdenesDiarias).toBe(3);
  }));

  it('2. Debería actualizar el estado del pedido y moverlo a la lista correcta', fakeAsync(async () => {
    component.ordenesSolicitadas = [mockOrders[0]];
    component.ordenesEnProceso = [];

    await component.cambiarEstado(mockOrders[0], 'En proceso');
    tick();

    expect(databaseService.updateOrderStatus).toHaveBeenCalledWith(1, 'En proceso');
    expect(toastController.create).toHaveBeenCalled();
    expect(component.ordenesSolicitadas.length).toBe(0);
    expect(component.ordenesEnProceso.length).toBe(1);
    expect(component.ordenesEnProceso[0].status).toBe('En proceso');
  }));

  it('3. Debería calcular correctamente los pedidos totales.', () => {
    component.ordenesSolicitadas = [mockOrders[0]];
    component.ordenesEnProceso = [mockOrders[1]];
    component.ordenesListas = [mockOrders[2]];
    
    expect(component.totalOrdenes()).toBe(3);
    expect(component.hayOrdenes()).toBeTrue();
  });

  it('4. Debe manejar los cambios de segmento correctamente.', () => {
    const mockEvent = { detail: { value: 'enProceso' } };
    component.segmentChanged(mockEvent);
    expect(component.currentSegment).toBe('enProceso');
  });

  it('5. Debería calcular correctamente el total del pedido.', () => {
    const mockOrder: Order = {
      ...mockOrders[0],
      items: [
        { id: 1, orderId: 1, productId: 1, quantity: 2, price: 100, productName: 'Test Product' } as OrderDetail,
        { id: 2, orderId: 1, productId: 2, quantity: 1, price: 50, productName: 'Test Product 2' } as OrderDetail
      ]
    };
    
    const total = component.getOrderTotal(mockOrder);
    expect(total).toBe(250);
  });
});