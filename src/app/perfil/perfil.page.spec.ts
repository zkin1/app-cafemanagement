import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilPage } from './perfil.page';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { User } from '../models/user.model';

describe('PerfilPage', () => {
  let component: PerfilPage;
  let fixture: ComponentFixture<PerfilPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    UserID: 1,
    Username: 'testUser',
    Password: 'Test123!',
    Role: 'employee',
    Name: 'Test User',
    Email: 'test@test.com',
    LastLogin: new Date(),
    ApprovalStatus: 'approved'
  };

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', [
      'getUserById', 
      'getUserProfilePicture', 
      'updateUserFromDb',
      'updateUserPassword',
      'updateUserProfilePicture'
    ]);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const alertSpy = jasmine.createSpyObj('AlertController', ['create']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ PerfilPage ],
      imports: [ 
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: AlertController, useValue: alertSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingControllerSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    alertControllerSpy = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock localStorage
    const mockLocalStorage = {
      currentUser: JSON.stringify({ id: 1, profilePicture: 'test.jpg' })
    };
    spyOn(localStorage, 'getItem').and.callFake(key => mockLocalStorage[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, value) => mockLocalStorage[key] = value);

    // Setup default spy returns
    databaseServiceSpy.getUserById.and.returnValue(of(mockUser));
    databaseServiceSpy.getUserProfilePicture.and.returnValue(of('test.jpg'));
    
    const mockLoading = {
      present: jasmine.createSpy('present'),
      dismiss: jasmine.createSpy('dismiss')
    };
    loadingControllerSpy.create.and.returnValue(Promise.resolve(mockLoading as any));

    const mockToast = {
      present: jasmine.createSpy('present')
    };
    toastControllerSpy.create.and.returnValue(Promise.resolve(mockToast as any));

    fixture = TestBed.createComponent(PerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. Debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe inicializarse con formularios no válidos', () => {
    expect(component.perfilForm.valid).toBeFalsy();
    expect(component.passwordForm.valid).toBeFalsy();
  });

  it('3. Debe validar los requisitos de contraseña.', () => {
    const passwordControl = component.passwordForm.get('nuevaContrasena');
    
    // Test invalid password
    passwordControl?.setValue('weak');
    expect(passwordControl?.errors?.['invalidPassword']).toBeTruthy();
    
    // Test valid password
    passwordControl?.setValue('StrongPass123!');
    expect(passwordControl?.errors).toBeNull();
  });

  it('4. Debe validar la coincidencia de la contraseña', () => {
    const nuevaContrasena = component.passwordForm.get('nuevaContrasena');
    const confirmarContrasena = component.passwordForm.get('confirmarContrasena');
    
    nuevaContrasena?.setValue('StrongPass123!');
    confirmarContrasena?.setValue('DifferentPass123!');
    expect(component.passwordForm.errors?.['passwordMismatch']).toBeTruthy();
    
    confirmarContrasena?.setValue('StrongPass123!');
    expect(component.passwordForm.errors?.['passwordMismatch']).toBeFalsy();
  });

  it('5. Debe validar la coincidencia de la contraseña', async () => {
    // Mock successful profile loading
    databaseServiceSpy.getUserById.and.returnValue(of(mockUser));
    databaseServiceSpy.getUserProfilePicture.and.returnValue(of('test.jpg'));

    await component.cargarPerfilUsuario();

    expect(component.usuario).toEqual(mockUser);
    expect(component.profilePicture).toBe('test.jpg');
    expect(component.perfilForm.get('name')?.value).toBe(mockUser.Name);
    expect(component.perfilForm.get('email')?.value).toBe(mockUser.Email);
  });
});