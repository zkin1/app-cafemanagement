import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddUserModalComponent } from './add-user-modal.component';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { User } from '../models/user.model';

describe('AddUserModalComponent', () => {
  let component: AddUserModalComponent;
  let fixture: ComponentFixture<AddUserModalComponent>;
  let modalController: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    modalController = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      declarations: [AddUserModalComponent],
      imports: [
        IonicModule.forRoot(),
        FormsModule
      ],
      providers: [
        { provide: ModalController, useValue: modalController }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AddUserModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Inicialización de componentes', () => {
    it('crea el componente', () => {
      expect(component).toBeTruthy();
    });

    it('2. inyecta ModalController', () => {
      expect(modalController).toBeTruthy();
    });

    it('3. inicializa los valores de usuario predeterminados', () => {
      expect(component.newUser).toBeDefined();
      expect(component.newUser.Name).toBe('');
      expect(component.newUser.Email).toBe('');
      expect(component.newUser.Password).toBe('');
      expect(component.newUser.Role).toBe('employee');
      expect(component.newUser.ApprovalStatus).toBe('pending');
    });
  });

  describe('UI Elementos', () => {
    it('4. elementos de formulario requeridos.', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('ion-title')).toBeTruthy();
      expect(compiled.querySelector('form')).toBeTruthy();
      expect(compiled.querySelector('ion-input[name="name"]')).toBeTruthy();
      expect(compiled.querySelector('ion-input[name="email"]')).toBeTruthy();
      expect(compiled.querySelector('ion-input[name="password"]')).toBeTruthy();
      expect(compiled.querySelector('ion-select[name="role"]')).toBeTruthy();
      expect(compiled.querySelector('ion-select[name="approvalStatus"]')).toBeTruthy();
    });

    it('5. botones requeridos', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('ion-button[type="submit"]')).toBeTruthy();
      expect(compiled.querySelector('ion-button')).toBeTruthy();
    });
  });

  describe('Modal de interacciones', () => {
    it('1. debe descartar el modal al cancelar', () => {
      component.dismissModal();
      expect(modalController.dismiss).toHaveBeenCalledWith(null, 'cancel');
    });

    it('2. Deberá enviar el formulario con los datos del usuario.', () => {
      const testUser: User = {
        Name: 'Test User',
        Email: 'test@test.com',
        Password: 'password123',
        Role: 'employee',
        Username: '',
        ApprovalStatus: 'pending',
        ProfilePicture: undefined
      };

      component.newUser = { ...testUser };
      component.submitForm();

      expect(modalController.dismiss).toHaveBeenCalledWith(testUser, 'confirm');
    });
  });

  describe('Actualizaciones de formularios', () => {
    it('3. actualizar el nombre del usuario', () => {
      fixture.detectChanges();
      component.newUser.Name = 'Test User';
      fixture.detectChanges();

      expect(component.newUser.Name).toBe('Test User');
    });

    it('4. deberá actualizar el rol del usuario', () => {
      fixture.detectChanges();
      component.newUser.Role = 'admin';
      fixture.detectChanges();

      expect(component.newUser.Role).toBe('admin');
    });

    it('5. deberá actualizar el estado de aprobación del usuario', () => {
      fixture.detectChanges();
      component.newUser.ApprovalStatus = 'approved';
      fixture.detectChanges();

      expect(component.newUser.ApprovalStatus).toBe('approved');
    });
  });

  describe('Validaciones', () => {
    it('Solo debe aceptar roles válidos', () => {
      const validRoles: Array<'employee' | 'admin' | 'manager'> = ['employee', 'admin', 'manager'];
      
      validRoles.forEach(role => {
        component.newUser.Role = role;
        expect(component.newUser.Role).toBe(role);
      });
    });
  });
});