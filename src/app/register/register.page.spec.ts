import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, NavController, Platform } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';
import { of, EMPTY } from 'rxjs';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;
  let routerSpy: jasmine.SpyObj<Router>;
  let navControllerSpy: jasmine.SpyObj<NavController>;
  let platformSpy: jasmine.SpyObj<Platform>;

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['getUserByEmail', 'createUser']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const navSpy = jasmine.createSpyObj('NavController', ['navigateForward', 'navigateRoot']);
    const platSpy = jasmine.createSpyObj('Platform', ['is', 'ready']);
    
    platSpy.ready.and.returnValue(Promise.resolve());
    platSpy.is.and.returnValue(true);

    await TestBed.configureTestingModule({
      declarations: [ RegisterPage ],
      imports: [ 
        IonicModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: DatabaseService, useValue: dbSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: NavController, useValue: navSpy },
        { provide: Platform, useValue: platSpy }
      ]
    }).compileComponents();

    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingControllerSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    navControllerSpy = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    platformSpy = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('2. debe inicializarse con un formato no válido', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('3. Debe validar los requisitos de contraseña', () => {
    const passwordControl = component.registerForm.controls['password'];
    
    passwordControl.setValue('weak');
    expect(passwordControl.errors?.['invalidPassword']).toBeTruthy();
    
    passwordControl.setValue('StrongPass123!');
    expect(passwordControl.errors).toBeNull();
  });

  it('4. Debe validar la coincidencia de la contraseña', () => {
    const password = component.registerForm.controls['password'];
    const confirmPassword = component.registerForm.controls['confirmPassword'];
    
    password.setValue('StrongPass123!');
    confirmPassword.setValue('DifferentPass123!');
    
    expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();
    
    confirmPassword.setValue('StrongPass123!');
    expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
  });

  it('5. Debería gestionar el registro con éxito', async () => {
    const mockLoadingElement = {
      present: jasmine.createSpy('present'),
      dismiss: jasmine.createSpy('dismiss'),
      onDidDismiss: jasmine.createSpy('onDidDismiss'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
      componentOnReady: jasmine.createSpy('componentOnReady')
    };

    const mockToastElement = {
      present: jasmine.createSpy('present'),
      dismiss: jasmine.createSpy('dismiss'),
      onDidDismiss: jasmine.createSpy('onDidDismiss'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
      componentOnReady: jasmine.createSpy('componentOnReady')
    };
    
    loadingControllerSpy.create.and.returnValue(Promise.resolve(mockLoadingElement as any));
    toastControllerSpy.create.and.returnValue(Promise.resolve(mockToastElement as any));
    
    databaseServiceSpy.getUserByEmail.and.returnValue(of(null));
    databaseServiceSpy.createUser.and.returnValue(Promise.resolve(1));

    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    });

    await component.onSubmit();

    expect(databaseServiceSpy.createUser).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(mockLoadingElement.dismiss).toHaveBeenCalled();
  });
});