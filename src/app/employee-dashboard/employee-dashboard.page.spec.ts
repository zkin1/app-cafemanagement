import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, LoadingController, ToastController, NavController } from '@ionic/angular';
import { EmployeeDashboardPage } from './employee-dashboard.page';
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('EmployeeDashboardPage', () => {
  let component: EmployeeDashboardPage;
  let fixture: ComponentFixture<EmployeeDashboardPage>;
  let mockDatabaseService: any;
  let mockLoadingController: any;
  let mockToastController: any;
  let mockRouter: any;
  let mockNavController: any;

  // Mock user data
  const mockUser = {
    id: 1,
    name: 'Test Employee',
    profilePicture: 'test-profile.jpg'
  };

  // Mock loading element
  const mockLoadingElement = {
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve()
  };

  // Mock toast element
  const mockToastElement = {
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve()
  };

  beforeEach(async () => {
    // Initialize mock services
    mockDatabaseService = {
      getUserProfilePicture: jasmine.createSpy('getUserProfilePicture').and.returnValue(of('test-profile.jpg')),
      getOrderCountForToday: jasmine.createSpy('getOrderCountForToday').and.returnValue(Promise.resolve(5)),
      getOrdersCount: jasmine.createSpy('getOrdersCount').and.returnValue(Promise.resolve(3))
    };

    mockLoadingController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockLoadingElement))
    };

    mockToastController = {
      create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockToastElement))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockNavController = {
      navigateForward: jasmine.createSpy('navigateForward'),
      navigateRoot: jasmine.createSpy('navigateRoot')
    };

    // Configure TestBed
    await TestBed.configureTestingModule({
      declarations: [EmployeeDashboardPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: ToastController, useValue: mockToastController },
        { provide: Router, useValue: mockRouter },
        { provide: NavController, useValue: mockNavController }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    // Create component and inject services
    fixture = TestBed.createComponent(EmployeeDashboardPage);
    component = fixture.componentInstance;

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    spyOn(localStorage, 'removeItem');

    fixture.detectChanges();
  });

  // Basic component tests
  it('1. debe cerar el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe inicializarse con valores predeterminados', async () => {
    await fixture.whenStable();
    expect(component.employeeName).toBeDefined();
    expect(component.ordersToday).toBeDefined();
    expect(component.pendingOrders).toBeDefined();
  });

  // Service injection tests
  it('3. Debe tener todos los servicios requeridoss', () => {
    expect(TestBed.inject(DatabaseService)).toBeTruthy();
    expect(TestBed.inject(LoadingController)).toBeTruthy();
    expect(TestBed.inject(ToastController)).toBeTruthy();
    expect(TestBed.inject(Router)).toBeTruthy();
    expect(TestBed.inject(NavController)).toBeTruthy();
  });

  // Template tests
  it('4.Debe proporcionar los elementos ionic necesarios', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ion-header')).toBeTruthy();
    expect(compiled.querySelector('ion-content')).toBeTruthy();
  });

  // Functionality tests
  it('5. Debe cargar los datos del usuario desde localStorage al iniciar.', async () => {
    await fixture.whenStable();
    expect(localStorage.getItem).toHaveBeenCalledWith('currentUser');
    expect(component.profilePicture).toBe(mockUser.profilePicture);
  });

  it('1. Debería cargar los datos de los empleados con éxito', fakeAsync(() => {
    component.loadEmployeeData();
    tick();

    expect(mockDatabaseService.getUserProfilePicture).toHaveBeenCalled();
    expect(mockDatabaseService.getOrderCountForToday).toHaveBeenCalled();
    expect(mockDatabaseService.getOrdersCount).toHaveBeenCalled();
    expect(component.ordersToday).toBe(5);
    expect(component.pendingOrders).toBe(3);
  }));

  it('2. Debería gestionar el cierre de sesión correctamente', () => {
    component.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('3. Debería manejar el error de imagen configurando el avatar predeterminado', () => {
    const event = { target: { src: '' } };
    component.handleImageError(event);
    expect(event.target.src).toBe('assets/default-avatar.png');
  });

  it('4. Debe mostrar y descartar el indicador de carga durante la carga de datos', fakeAsync(() => {
    component.loadEmployeeData();
    tick();
    
    expect(mockLoadingController.create).toHaveBeenCalled();
    expect(mockLoadingElement.present).toBeDefined();
    expect(mockLoadingElement.dismiss).toBeDefined();
  }));

  it('5. Debe mostrar un mensaje de error si ocurre un error al cargar los datos', fakeAsync(() => {
    mockDatabaseService.getOrderCountForToday.and.returnValue(Promise.reject('Error'));
    const toastSpy = spyOn(component, 'presentToast');
    
    component.loadEmployeeData();
    tick();
    
    expect(toastSpy).toHaveBeenCalledWith('Error al cargar datos. Por favor, intente de nuevo.');
  }));
});