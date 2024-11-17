import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ForgotPasswordPage } from './forgot-password.page';
import { DatabaseService } from '../services/database.service';
import { EmailService } from '../services/email.service';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let databaseServiceSpy: jasmine.SpyObj<DatabaseService>;
  let emailServiceSpy: jasmine.SpyObj<EmailService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    UserID: 1,
    Email: 'test@test.com',
    Name: 'Test User',
    Password: 'hashedPassword',
    Role: 'user'
  };

  // Mock para EmailJS
  const mockEmailJS = {
    send: () => Promise.resolve({ status: 200, text: 'OK' })
  };

  beforeEach(async () => {
    // Crear spies para los servicios
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['getUserByEmail', 'updatePassword']);
    const emailSpy = jasmine.createSpyObj('EmailService', ['sendVerificationCode']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    const mockLoading = {
      present: jasmine.createSpy('present'),
      dismiss: jasmine.createSpy('dismiss')
    };

    const mockToast = {
      present: jasmine.createSpy('present')
    };

    // Configurar comportamiento de los spies
    loadingSpy.create.and.returnValue(Promise.resolve(mockLoading));
    toastSpy.create.and.returnValue(Promise.resolve(mockToast));
    dbSpy.getUserByEmail.and.returnValue(of(mockUser));
    dbSpy.updatePassword.and.returnValue(of(true));
    emailSpy.sendVerificationCode.and.returnValue(of({ success: true, messageId: '123' }));

    await TestBed.configureTestingModule({
      declarations: [ ForgotPasswordPage ],
      imports: [
        IonicModule.forRoot(),
        FormsModule
      ],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: EmailService, useValue: emailSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    databaseServiceSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    emailServiceSpy = TestBed.inject(EmailService) as jasmine.SpyObj<EmailService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingControllerSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock global emailjs
    (window as any).emailjs = mockEmailJS;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // 5 pruebas por defecto de Angular
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('1. debe inicializar con valores predeterminados', () => {
    expect(component.email).toBe('');
    expect(component.verificationCode).toBe('');
    expect(component.step).toBe('email');
    expect(component.showToast).toBeFalse();
  });

  it('2. Debería haber controles de formulario requeridos', () => {
    expect(component.hasOwnProperty('email')).toBeTrue();
    expect(component.hasOwnProperty('verificationCode')).toBeTrue();
    expect(component.hasOwnProperty('newPassword')).toBeTrue();
    expect(component.hasOwnProperty('confirmPassword')).toBeTrue();
  });

  it('3. Debería volver a navegar correctamente', () => {
    component.step = 'verify';
    component.goBack();
    expect(component.step).toBe('email');

    component.step = 'reset';
    component.goBack();
    expect(component.step).toBe('verify');

    component.step = 'email';
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('4. Debe validar los requisitos de contraseña', () => {
    component.newPassword = 'Test1234!';
    expect(component.hasUpperCase).toBeTrue();
    expect(component.hasLowerCase).toBeTrue();
    expect(component.hasNumber).toBeTrue();
    expect(component.hasSpecialChar).toBeTrue();
    expect(component.isLongEnough).toBeTrue();
  });

  // 5 pruebas personalizadas
  it('1. Debe gestionar el campo de correos electrónicos vacio', fakeAsync(async () => {
    component.email = '';
    await component.sendVerificationCode();
    tick();
    
    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Por favor, ingrese su correo electrónico',
        color: 'warning'
      })
    );
  }));

  it('2. Debería enviar el código de verificación con éxito', fakeAsync(async () => {
    component.email = 'test@test.com';
    await component.sendVerificationCode();
    tick();

    expect(component.step).toBe('verify');
    expect(component.generatedCode.length).toBe(4);
    expect(emailServiceSpy.sendVerificationCode).toHaveBeenCalled();
  }));

  it('3. Debe verificar el código de verificación con éxito', fakeAsync(async () => {
    component.generatedCode = '1234';
    component.verificationCode = '1234';
    await component.verifyCode();
    tick();

    expect(component.step).toBe('reset');
    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Código verificado correctamente',
        color: 'success'
      })
    );
  }));

  it('4. Debería gestionar la falta de coincidencia de contraseñas', fakeAsync(async () => {
    component.newPassword = 'Test1234!';
    component.confirmPassword = 'DifferentPass1!';
    await component.resetPassword();
    tick();

    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Las contraseñas no coinciden',
        color: 'warning'
      })
    );
  }));

  it('5. Debería restablecer la contraseña con éxito', fakeAsync(async () => {
    component.email = 'test@test.com';
    component.newPassword = 'Test1234!';
    component.confirmPassword = 'Test1234!';
    
    await component.resetPassword();
    tick();

    expect(databaseServiceSpy.updatePassword).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(toastControllerSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Contraseña actualizada correctamente',
        color: 'success'
      })
    );
  }));
});