import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, LoadingController, ToastController, Platform, AlertController } from '@ionic/angular';
import { AdminPage } from './admin.page';
import { DatabaseService } from '../services/database.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('AdminPage', () => {
  let component: AdminPage;
  let fixture: ComponentFixture<AdminPage>;
  let databaseService: jasmine.SpyObj<DatabaseService>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let alertController: jasmine.SpyObj<AlertController>;

  const mockTopProducts = [
    { productId: 1, name: 'Producto 1', totalSold: 10 },
    { productId: 2, name: 'Producto 2', totalSold: 8 }
  ];

  const mockDailySales = [
    { 
      day: 'Lunes',
      date: new Date(),
      amount: 1000,
      canceledAmount: 200,
      canceledOrders: 2
    }
  ];

  const mockLoading = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
  };

  const mockToast = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
  };

  const mockAlert = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
  };

  beforeEach(async () => {
    databaseService = jasmine.createSpyObj('DatabaseService', {
      'calculateTotalSales': Promise.resolve(5000),
      'getTopSellingProducts': Promise.resolve(mockTopProducts),
      'getOrdersCount': Promise.resolve(3)
    });

    loadingController = jasmine.createSpyObj('LoadingController', {
      create: Promise.resolve(mockLoading)
    });

    toastController = jasmine.createSpyObj('ToastController', {
      create: Promise.resolve(mockToast)
    });

    alertController = jasmine.createSpyObj('AlertController', {
      create: Promise.resolve(mockAlert)
    });

    await TestBed.configureTestingModule({
      declarations: [AdminPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: databaseService },
        { provide: LoadingController, useValue: loadingController },
        { provide: ToastController, useValue: toastController },
        { provide: AlertController, useValue: alertController }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. debe ser creado el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe tener las dependencias inyectadas', () => {
    expect(databaseService).toBeTruthy();
    expect(loadingController).toBeTruthy();
    expect(toastController).toBeTruthy();
    expect(alertController).toBeTruthy();
  });

  it('3. debe inicializar con valores predeterminados', () => {
    expect(component.totalSales).toBe(0);
    expect(component.ventasRealizadas).toBe(0);
    expect(component.ventasCanceladas).toBe(0);
    expect(component.topProducts).toEqual([]);
    expect(component.selectedDay).toBeNull();
  });

  it('4. debe tener ion-header y ion-content', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ion-header')).toBeTruthy();
    expect(compiled.querySelector('ion-content')).toBeTruthy();
  });

  it('5. debe suscribirse y desuscribirse de observables', () => {
    const subscriptionSpy = spyOn(component['subscriptions'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subscriptionSpy).toHaveBeenCalled();
  });


  it('1. debe cargar estadísticas correctamente', fakeAsync(async () => {
    await component.loadStatistics();
    tick();

    expect(loadingController.create).toHaveBeenCalled();
    expect(databaseService.calculateTotalSales).toHaveBeenCalled();
    expect(databaseService.getTopSellingProducts).toHaveBeenCalled();
    expect(component.topProducts.length).toBeGreaterThan(0);
    expect(mockLoading.dismiss).toHaveBeenCalled();
  }));

  it('2. debe mostrar detalles del día', () => {
    const mockDay = {
      day: 'Lunes',
      date: new Date(),
      amount: 1000,
      canceledAmount: 200,
      canceledOrders: 2
    };

    component.showDayDetails(mockDay);
    expect(component.selectedDay).toEqual(mockDay);
  });

  it('3. debe seleccionar órdenes canceladas', () => {
    const mockDay = {
      day: 'Lunes',
      date: new Date(),
      amount: 1000,
      canceledAmount: 200,
      canceledOrders: 2
    };
    
    component.selectedDay = mockDay;
    const result = component.selectCancelOrders();
    expect(result).toBe(200);
  });

  it('4. debe presentar un toast', async () => {
    const message = 'Test message';
    await component['presentToast'](message);
    expect(toastController.create).toHaveBeenCalledWith({
      message,
      duration: 2000,
      position: 'bottom'
    });
  });

  it('5. debe manejar errores al cargar las estadísticas', fakeAsync(async () => {
    databaseService.calculateTotalSales.and.rejectWith('Error');
    
    await component.loadStatistics();
    tick();

    expect(toastController.create).toHaveBeenCalledWith({
      message: 'Error al cargar estadísticas. Por favor, intente de nuevo.',
      duration: 2000,
      position: 'bottom'
    });
    expect(mockLoading.dismiss).toHaveBeenCalled();
  }));

  // Prueba adicional para verificar la limpieza del gráfico
  it('6. debe limpiar el gráfico', () => {
    const mockChart = { destroy: jasmine.createSpy('destroy') };
    component['chart'] = mockChart as any;
    
    component.ngOnDestroy();
    
    expect(mockChart.destroy).toHaveBeenCalled();
  });
});