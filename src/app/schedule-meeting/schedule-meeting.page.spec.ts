import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ScheduleMeetingPage } from './schedule-meeting.page';
import { DatabaseService } from '../services/database.service';
import { EmailService } from '../services/email.service';
import { of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { EmailResult } from '../models/email.interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ScheduleMeetingPage', () => {
  let componente: ScheduleMeetingPage;
  let fixture: ComponentFixture<ScheduleMeetingPage>;
  let servicioBaseDatosSpy: jasmine.SpyObj<DatabaseService>;
  let servicioEmailSpy: jasmine.SpyObj<EmailService>;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;
  let loadingControllerSpy: jasmine.SpyObj<LoadingController>;

  const usuariosPrueba: User[] = [
    {
      UserID: 1,
      Username: 'usuario1',
      Password: 'password123',
      Role: 'employee',
      Name: 'Usuario 1',
      Email: 'usuario1@test.com',
      PhoneNumber: '123456789',
      HireDate: new Date('2023-01-01'),
      LastLogin: new Date('2024-03-15'),
      ApprovalStatus: 'approved',
      ProfilePicture: null
    },
    {
      UserID: 2,
      Username: 'usuario2',
      Password: 'password456',
      Role: 'employee',
      Name: 'Usuario 2',
      Email: 'usuario2@test.com',
      PhoneNumber: '987654321',
      HireDate: new Date('2023-02-01'),
      LastLogin: new Date('2024-03-15'),
      ApprovalStatus: 'approved',
      ProfilePicture: null
    }
  ];

  const emailResponseExitosa: EmailResult = {
    success: true
  };

  const emailResponseFallida: EmailResult = {
    success: false,
    error: 'Error al enviar el correo'
  };

  beforeEach(async () => {
    const dbSpy = jasmine.createSpyObj('DatabaseService', ['getAllUsers']);
    const emailSpy = jasmine.createSpyObj('EmailService', ['sendMeetingInvitation']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);

    const mockLoading = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      dismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    };

    const mockToast = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve())
    };

    loadingSpy.create.and.returnValue(Promise.resolve(mockLoading));
    toastSpy.create.and.returnValue(Promise.resolve(mockToast));
    dbSpy.getAllUsers.and.returnValue(of(usuariosPrueba));
    emailSpy.sendMeetingInvitation.and.returnValue(of(emailResponseExitosa));

    await TestBed.configureTestingModule({
      declarations: [ ScheduleMeetingPage ],
      imports: [
        IonicModule.forRoot(),
        FormsModule
      ],
      providers: [
        { provide: DatabaseService, useValue: dbSpy },
        { provide: EmailService, useValue: emailSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: LoadingController, useValue: loadingSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleMeetingPage);
    componente = fixture.componentInstance;
    servicioBaseDatosSpy = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    servicioEmailSpy = TestBed.inject(EmailService) as jasmine.SpyObj<EmailService>;
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    loadingControllerSpy = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;

    fixture.detectChanges();
  });

  // 1. Prueba de creación del componente
  it('1. debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  // 2. Prueba de inicialización
  it('2. debería inicializarse con valores por defecto', () => {
    expect(componente.meeting.title).toBe('');
    expect(componente.meeting.datetime).toBe('');
    expect(componente.meeting.description).toBe('');
    expect(componente.meeting.participants).toEqual([]);
    expect(componente.isSubmitting).toBeFalse();
  });

  // 3. Prueba de carga de usuarios
  it('3. debería cargar usuarios al iniciar', fakeAsync(() => {
    componente.ngOnInit();
    tick();
    
    expect(servicioBaseDatosSpy.getAllUsers).toHaveBeenCalled();
    expect(componente.users).toEqual(usuariosPrueba);
  }));

  // 4. Prueba de manejo de error en carga de usuarios
  it('4. debería manejar error al cargar usuarios', fakeAsync(() => {
    servicioBaseDatosSpy.getAllUsers.and.returnValue(throwError(() => new Error('Error al cargar usuarios')));
    
    componente.ngOnInit();
    tick();
    
    expect(toastControllerSpy.create).toHaveBeenCalledWith({
      message: 'Error al cargar los usuarios',
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
  }));

  // 5. Prueba de validación de participantes
  it('5. debería validar participantes antes de programar', fakeAsync(async () => {
    const evento = new Event('submit');
    await componente.scheduleMeeting(evento);
    
    expect(toastControllerSpy.create).toHaveBeenCalledWith({
      message: 'Debes seleccionar al menos un participante.',
      duration: 3000,
      position: 'top',
      color: 'warning'
    });
  }));

  // 6. Prueba de programación exitosa
  it('6. debería programar reunión exitosamente', fakeAsync(async () => {
    const evento = new Event('submit');
    const datosPrueba = {
      title: 'Reunión de Prueba',
      datetime: '2024-12-01T10:00:00',
      description: 'Descripción de Prueba',
      participants: [usuariosPrueba[0].Email]
    };
    
    componente.meeting = { ...datosPrueba };

    await componente.scheduleMeeting(evento);
    tick();

    expect(servicioEmailSpy.sendMeetingInvitation).toHaveBeenCalledWith(
      usuariosPrueba[0].Email,
      datosPrueba.title,
      jasmine.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
      datosPrueba.description
    );

    expect(toastControllerSpy.create).toHaveBeenCalledWith({
      message: 'Reunión programada y correos enviados con éxito',
      duration: 3000,
      position: 'top',
      color: 'success'
    });

    expect(componente.meeting).toEqual({
      title: '',
      datetime: '',
      description: '',
      participants: []
    });
  }));

  // 7. Prueba de manejo de fallo en envío de correos
  it('7. debería manejar fallo en envío de correos', fakeAsync(async () => {
    const evento = new Event('submit');
    componente.meeting = {
      title: 'Reunión de Prueba',
      datetime: '2024-12-01T10:00:00',
      description: 'Descripción de Prueba',
      participants: [usuariosPrueba[0].Email]
    };

    servicioEmailSpy.sendMeetingInvitation.and.returnValue(of(emailResponseFallida));

    await componente.scheduleMeeting(evento);
    tick();

    expect(toastControllerSpy.create).toHaveBeenCalledWith({
      message: 'Reunión programada pero hubo errores al enviar algunos correos: usuario1@test.com',
      duration: 3000,
      position: 'top',
      color: 'warning'
    });
  }));

  // 8. Prueba de manejo de error en programación
  it('8. debería manejar error en programación de reunión', fakeAsync(async () => {
    const evento = new Event('submit');
    componente.meeting = {
      title: 'Reunión de Prueba',
      datetime: '2024-12-01T10:00:00',
      description: 'Descripción de Prueba',
      participants: [usuariosPrueba[0].Email]
    };

    servicioEmailSpy.sendMeetingInvitation.and.returnValue(
      throwError(() => new Error('Falló el envío de correo'))
    );

    await componente.scheduleMeeting(evento);
    tick();

    expect(toastControllerSpy.create).toHaveBeenCalledWith({
      message: 'Reunión programada pero hubo errores al enviar algunos correos: usuario1@test.com',
      duration: 3000,
      position: 'top',
      color: 'warning'
    });
  }));

  // 9. Prueba de formateo de fecha
  it('9. debería formatear fecha y hora correctamente', () => {
    const fechaString = '2024-12-01T10:00:00';
    const fechaFormateada = componente['formatDateTime'](fechaString);
    expect(fechaFormateada).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(fechaFormateada).toContain('10:00');
  });

  // 10. Prueba de manejo de fecha inválida
  it('10. debería manejar formato de fecha inválido', () => {
    // Espiar console.error
    const consoleSpy = spyOn(console, 'error');
    
    // Probar con undefined
    const resultadoUndefined = componente['formatDateTime'](undefined as any);
    expect(resultadoUndefined).toBe('Invalid Date');
    
    // Probar con un string inválido
    const resultadoInvalido = componente['formatDateTime']('no-es-una-fecha');
    expect(resultadoInvalido).toBe('Invalid Date');
    
    // Verificar que no se llamó a console.error ya que no se lanza excepción
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});