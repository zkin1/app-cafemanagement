import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { EmployeeManagementPage } from './employee-management.page';
import { DatabaseService } from '../services/database.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Camera } from '@capacitor/camera';
import { of } from 'rxjs';
import { User } from '../models/user.model';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('EmployeeManagementPage', () => {
  let component: EmployeeManagementPage;
  let fixture: ComponentFixture<EmployeeManagementPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;

  const mockUser: User = {
    UserID: 1,
    Username: 'testUser',
    Password: 'password123',
    Role: 'employee',
    Name: 'Test User',
    Email: 'test@example.com',
    ApprovalStatus: 'approved',
    ProfilePicture: 'assets/default-avatar.png'
  };

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', [
      'getAllUsers',
      'getUserProfilePicture',
      'updateUserProfilePicture',
      'getUserById',
      'updateUserFromDb',
      'updateUserApprovalStatus',
      'deleteUser',
      'createUser'
    ]);

    // Configurar retornos de los spies
    dbSpy.getAllUsers.and.returnValue(of([mockUser]));
    dbSpy.getUserProfilePicture.and.returnValue(of('test.jpg'));
    dbSpy.updateUserProfilePicture.and.returnValue(Promise.resolve(true));
    dbSpy.getUserById.and.returnValue(of(mockUser));
    dbSpy.updateUserFromDb.and.returnValue(Promise.resolve(true));
    dbSpy.updateUserApprovalStatus.and.returnValue(of(true));
    dbSpy.deleteUser.and.returnValue(of(true));
    dbSpy.createUser.and.returnValue(Promise.resolve(1));

    const mockIonicController = {
      create: () => Promise.resolve({
        present: () => Promise.resolve(),
        dismiss: () => Promise.resolve(),
        onDidDismiss: () => Promise.resolve({ role: 'confirm', data: mockUser })
      })
    };

    await TestBed.configureTestingModule({
      declarations: [EmployeeManagementPage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: mockIonicController },
        { provide: LoadingController, useValue: mockIonicController },
        { provide: AlertController, useValue: mockIonicController },
        { provide: ModalController, useValue: mockIonicController }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeManagementPage);
    component = fixture.componentInstance;
    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingControllerSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    alertControllerSpy = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    modalControllerSpy = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({
      id: 1,
      profilePicture: 'test.jpg'
    }));
    spyOn(localStorage, 'setItem').and.callFake(() => {});

    fixture.detectChanges();
  });

  it('1. debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. Debería tener una matriz de usuarios inicial vacía', () => {
    expect(component.users).toEqual([]);
  });

  it('3. Debería tener ion-title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ion-title')).toBeTruthy();
  });

  it('4. should have ion-searchbar', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ion-searchbar')).toBeTruthy();
  });

  it('5. Debería tener ion-fab-button', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('ion-fab-button')).toBeTruthy();
  });

  it('1. Debería cargar usuarios al iniciar.', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(databaseServiceSpy.getAllUsers).toHaveBeenCalled();
  }));

  it('2. Debería filtrar a los usuarios correctamente', () => {
    component.users = [mockUser];
    component.searchEmployees({ target: { value: 'test' } });
    expect(component.filteredUsers.length).toBe(1);
    
    component.searchEmployees({ target: { value: 'nonexistent' } });
    expect(component.filteredUsers.length).toBe(0);
  });

  it('3. Debería gestionar la eliminación de usuarios', fakeAsync(() => {
    component.users = [mockUser];
    component.filteredUsers = [mockUser];
    
    component.deleteUser(mockUser);
    tick();
    
    expect(databaseServiceSpy.deleteUser).toHaveBeenCalledWith(mockUser.UserID);
  }));

  it('4. Debería actualizar el estado de aprobación del usuario.', fakeAsync(() => {
    component.updateUserApprovalStatus(mockUser, 'approved');
    tick();
    
    expect(databaseServiceSpy.updateUserApprovalStatus).toHaveBeenCalledWith(
      mockUser.UserID,
      'approved'
    );
  }));

  it('5. should handle basic user data updates', fakeAsync(() => {
    const updatedUser = { ...mockUser, Name: 'Updated Name' };
    component.updateUser(updatedUser);
    tick();
    expect(databaseServiceSpy.updateUserFromDb).toHaveBeenCalledWith(updatedUser);
  }));

  // Pruebas adicionales
  it('Debe manejar actualizaciones de datos básicos del usuario.', () => {
    expect(component.getRoleColor('admin')).toBe('primary');
    expect(component.getRoleColor('employee')).toBe('secondary');
  });

  it('Debería obtener los colores de estado de aprobación correctos', () => {
    expect(component.getApprovalStatusColor('approved')).toBe('success');
    expect(component.getApprovalStatusColor('pending')).toBe('warning');
    expect(component.getApprovalStatusColor('rejected')).toBe('danger');
  });

  it('Debería manejar correctamente a los empleados de búsqueda.', () => {
    component.users = [mockUser];
    
    component.searchEmployees({ target: { value: 'Test' } });
    expect(component.filteredUsers.length).toBe(1);
    
    component.searchEmployees({ target: { value: 'xyz' } });
    expect(component.filteredUsers.length).toBe(0);
  });

  it('Debería manejar el error de imagen', () => {
    const event = { target: { src: '' } };
    component.handleImageError(event);
    expect(event.target.src).toBe('assets/default-avatar.png');
  });

  it('Deberían obtenerse las etiquetas de roles correctas', () => {
    expect(component.getRoleLabel('admin')).toBe('Administrador');
    expect(component.getRoleLabel('employee')).toBe('Empleado');
  });

  it('Deberían obtenerse etiquetas de estado correctas', () => {
    expect(component.getApprovalStatusLabel('approved')).toBe('Aprobado');
    expect(component.getApprovalStatusLabel('pending')).toBe('Pendiente');
    expect(component.getApprovalStatusLabel('rejected')).toBe('Rechazado');
  });
});