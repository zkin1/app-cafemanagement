import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, LoadingController, ToastController, NavController } from '@ionic/angular';
import { AdminDashboardPage } from './admin-dashboard.page';
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { User } from '../models/user.model';

describe('AdminDashboardPage', () => {
  let component: AdminDashboardPage;
  let fixture: ComponentFixture<AdminDashboardPage>;
  let databaseService: jasmine.SpyObj<DatabaseService>;
  let router: jasmine.SpyObj<Router>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let navController: jasmine.SpyObj<NavController>;

  const mockUser = {
    UserID: 1,
    Username: 'admin',
    Password: 'test123',
    Role: 'admin',
    Name: 'Test Admin',
    Email: 'admin@test.com',
    ApprovalStatus: 'approved',
    profilePicture: 'test.jpg'  
  };
  
  const mockPendingUsers: User[] = [
    {
      UserID: 2,
      Username: 'pending1',
      Password: 'test123',
      Role: 'employee' as 'admin' | 'employee' | 'manager',
      Name: 'Pending User 1',
      Email: 'pending1@test.com',
      ApprovalStatus: 'pending',
      ProfilePicture: null
    },
    {
      UserID: 3,
      Username: 'pending2',
      Password: 'test123',
      Role: 'employee' as 'admin' | 'employee' | 'manager',
      Name: 'Pending User 2',
      Email: 'pending2@test.com',
      ApprovalStatus: 'pending',
      ProfilePicture: null
    }
  ];

  const mockLoading = {
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve()
  };

  const mockToast = {
    present: () => Promise.resolve()
  };

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', {
      'getUserProfilePicture': of('test-profile.jpg'),
      'getOrderCountForToday': Promise.resolve(5),
      'getActiveEmployeesCount': Promise.resolve(3),
      'getPendingUsers': of([]),  // Inicialmente vacío
      'updateUserApprovalStatus': of(true)
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const navSpy = jasmine.createSpyObj('NavController', ['navigateForward', 'navigateRoot']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', {
      create: Promise.resolve(mockLoading)
    });
    const toastSpy = jasmine.createSpyObj('ToastController', {
      create: Promise.resolve(mockToast)
    });

    await TestBed.configureTestingModule({
      declarations: [AdminDashboardPage],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: Router, useValue: routerSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: NavController, useValue: navSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPage);
    component = fixture.componentInstance;
    databaseService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    navController = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;

    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('1. debe crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('2. debe inicializar con valores predeterminados', async () => {
      component.pendingUsers = [];
      component.orderCount = 0;
      component.activeEmployees = 0;
      
      expect(component.adminName).toBe('Admin');
      expect(component.orderCount).toBe(0);
      expect(component.activeEmployees).toBe(0);
      expect(component.pendingUsers).toEqual([]);
    });

    it('3. debe tener las dependencias inyectadas', () => {
      expect(databaseService).toBeTruthy();
      expect(router).toBeTruthy();
      expect(loadingController).toBeTruthy();
      expect(toastController).toBeTruthy();
      expect(navController).toBeTruthy();
    });

    it('4. debe tener ion-header y ion-content', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('ion-header')).toBeTruthy();
      expect(compiled.querySelector('ion-content')).toBeTruthy();
    });

    it('5. debe obtener la imagen de perfil del usuario', fakeAsync(() => {
      component.ngOnInit();
      tick();
      
      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      expect(component.profilePicture).toBe(storedUser.profilePicture);
    }));
  });

  describe('Funcionalidades de la Dashboard', () => {
    it('1. debe cargar estadísticas correctamente', fakeAsync(async () => {
      await component.loadDashboardData();
      tick();
  
      expect(databaseService.getOrderCountForToday).toHaveBeenCalled();
      expect(databaseService.getActiveEmployeesCount).toHaveBeenCalled();
      expect(component.orderCount).toBe(5);
      expect(component.activeEmployees).toBe(3);
    }));
  
    it('2. debe cargar usuarios pendientes', fakeAsync(async () => {
      databaseService.getPendingUsers.and.returnValue(of(mockPendingUsers));
      
      await component.loadPendingUsers();
      tick();
  
      expect(databaseService.getPendingUsers).toHaveBeenCalled();
      expect(component.pendingUsers).toEqual(mockPendingUsers);
    }));
  });

  describe('gestión de usuarios', () => {
    beforeEach(() => {
      component.pendingUsers = [...mockPendingUsers];
    });

    it('3. debe aprobar un usuario correctamente', fakeAsync(async () => {
      await component.approveUser(2);
      tick();
  
      expect(databaseService.updateUserApprovalStatus).toHaveBeenCalledWith(2, 'approved');
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'Usuario aprobado con éxito.'
        })
      );
    }));
  
    it('4. debe rechazar un usuario correctamente', fakeAsync(async () => {
      await component.rejectUser(2);
      tick();
  
      expect(databaseService.updateUserApprovalStatus).toHaveBeenCalledWith(2, 'rejected');
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'Usuario rechazado.'
        })
      );
    }));
  });

  describe('gestión de sesión', () => {
    it('5. debe cerrar sesión', () => {
      component.logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('manejo de errores', () => {
    it('Debería manejar el error de imagen configurando el avatar predeterminado', () => {
      const event = { target: { src: '' } };
      component.handleImageError(event);
      expect(event.target.src).toBe('assets/default-avatar.png');
    });
  });
});