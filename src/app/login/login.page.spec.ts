import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ToastController, NavController, Platform } from '@ionic/angular';
import { LoginPage } from './login.page';
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { of, EMPTY } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let routerSpy: jasmine.SpyObj<Router>;
  let navControllerSpy: jasmine.SpyObj<NavController>;
  let platformSpy: jasmine.SpyObj<Platform>;
  let mockStorage: { [key: string]: string };
  let localStorageGetItemSpy: jasmine.Spy;
  let localStorageSetItemSpy: jasmine.Spy;

  const mockUser: User = {
    UserID: 1,
    Username: 'testuser',
    Password: 'password123',
    Role: 'employee',
    Name: 'Test User',
    Email: 'test@test.com',
    ApprovalStatus: 'approved'
  };

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['authenticateUser', 'updateUserLastLogin']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const navSpy = jasmine.createSpyObj('NavController', ['navigateForward', 'navigateRoot']);
    const platSpy = jasmine.createSpyObj('Platform', ['is', 'ready']);

    // Configure Platform spy
    platSpy.ready.and.returnValue(Promise.resolve());
    platSpy.is.and.returnValue(true);

    // Mock localStorage
    mockStorage = {};
    localStorageGetItemSpy = spyOn(localStorage, 'getItem').and.callFake(key => mockStorage[key] || null);
    localStorageSetItemSpy = spyOn(localStorage, 'setItem').and.callFake((key, value) => mockStorage[key] = value);

    // Mock toast
    const mockToastElement = {
      present: jasmine.createSpy('present')
    };
    toastSpy.create.and.returnValue(Promise.resolve(mockToastElement));

    await TestBed.configureTestingModule({
      declarations: [ LoginPage ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: NavController, useValue: navSpy },
        { provide: Platform, useValue: platSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    navControllerSpy = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    platformSpy = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;

    // Configure updateUserLastLogin to return Observable
    databaseServiceSpy.updateUserLastLogin.and.returnValue(of(true));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Authentication Checks', () => {
    it('1. Debería redirigir al panel de administración si el usuario es administrador.', () => {
      mockStorage['currentUser'] = JSON.stringify({ id: 1, role: 'admin' });
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-dashboard']);
    });

    it('2. Debería redirigir al panel de control del empleado si el usuario es empleado.', () => {
      mockStorage['currentUser'] = JSON.stringify({ id: 1, role: 'employee' });
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/employee-dashboard']);
    });

    it('3. Debe permanecer en el inicio de sesión si ningún usuario está autenticado', () => {
      mockStorage = {};
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('proceso de inicio de sesión', () => {
    it('4. Debería aparecer un mensaje de error si falta el correo electrónico o la contraseña', async () => {
      component.email = '';
      component.password = 'password123';
      await component.onSubmit();
      expect(toastControllerSpy.create).toHaveBeenCalledWith({
        message: 'Por favor, ingrese email y contraseña.',
        duration: 2000,
        position: 'top'
      });
    });

    it('5. Debería autenticar al usuario correctamente', async () => {
      component.email = 'test@test.com';
      component.password = 'password123';
      
      databaseServiceSpy.authenticateUser.and.returnValue(Promise.resolve(mockUser));
      
      await component.onSubmit();
      
      expect(localStorageSetItemSpy).toHaveBeenCalled();
      expect(databaseServiceSpy.updateUserLastLogin).toHaveBeenCalledWith(mockUser.UserID);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/employee-dashboard']);
    });

    it('6. Debe manejar el estado de aprobación pendiente', async () => {
      const pendingUser = { ...mockUser, ApprovalStatus: 'pending' as 'pending' };
      component.email = 'test@test.com';
      component.password = 'password123';
      
      databaseServiceSpy.authenticateUser.and.returnValue(Promise.resolve(pendingUser));
      
      await component.onSubmit();
      
      expect(toastControllerSpy.create).toHaveBeenCalledWith({
        message: 'Su cuenta está pendiente de aprobación. Por favor, espere la confirmación del administrador.',
        duration: 2000,
        position: 'top'
      });
    });

    it('7. Debe manejar el estado de aprobación rechazada', async () => {
      const rejectedUser = { ...mockUser, ApprovalStatus: 'rejected' as 'rejected' };
      component.email = 'test@test.com';
      component.password = 'password123';
      
      databaseServiceSpy.authenticateUser.and.returnValue(Promise.resolve(rejectedUser));
      
      await component.onSubmit();
      
      expect(toastControllerSpy.create).toHaveBeenCalledWith({
        message: 'Su cuenta ha sido rechazada. Por favor, contacte al administrador.',
        duration: 2000,
        position: 'top'
      });
    });

    it('8. Debería manejar credenciales no válidas', async () => {
      component.email = 'test@test.com';
      component.password = 'wrongpassword';
      
      databaseServiceSpy.authenticateUser.and.returnValue(Promise.resolve(null));
      
      await component.onSubmit();
      
      expect(toastControllerSpy.create).toHaveBeenCalledWith({
        message: 'Credenciales incorrectas. Por favor, intente de nuevo.',
        duration: 2000,
        position: 'top'
      });
    });

    it('9. Debería manejar el error de autenticación', async () => {
      component.email = 'test@test.com';
      component.password = 'password123';
      
      databaseServiceSpy.authenticateUser.and.rejectWith(new Error('Database error'));
      
      await component.onSubmit();
      
      expect(toastControllerSpy.create).toHaveBeenCalledWith({
        message: 'Ocurrió un error durante el inicio de sesión. Por favor, intente de nuevo.',
        duration: 2000,
        position: 'top'
      });
    });
  });

  describe('10. Recuperación de contraseña', () => {
    it('Debería aparecer un mensaje de notificación cuando se hace clic en "Olvidé mi contraseña"', async () => {
      await component.forgotPassword();
      expect(toastControllerSpy.create).toHaveBeenCalledWith({
        message: 'Se ha enviado un correo con instrucciones para recuperar tu contraseña.',
        duration: 2000,
        position: 'top'
      });
    });
  });
});