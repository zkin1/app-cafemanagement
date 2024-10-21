import { TestBed } from '@angular/core/testing';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { DatabaseService } from './database.service';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';
import { of } from 'rxjs';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let sqliteMock: jasmine.SpyObj<SQLite>;
  let platformMock: jasmine.SpyObj<Platform>;

  beforeEach(() => {
    sqliteMock = jasmine.createSpyObj('SQLite', ['create']);
    platformMock = jasmine.createSpyObj('Platform', ['ready']);

    TestBed.configureTestingModule({
      providers: [
        DatabaseService,
        { provide: SQLite, useValue: sqliteMock },
        { provide: Platform, useValue: platformMock }
      ]
    });
    service = TestBed.inject(DatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate user', (done) => {
    const mockUser: User = {
      UserID: 1,
      Username: 'testuser',
      Email: 'test@example.com',
      Password: 'password',
      Role: 'employee',
      Name: 'Test User',
      ApprovalStatus: 'approved'
    };
    spyOn(service, 'authenticateUser').and.returnValue(Promise.resolve(mockUser));

    service.authenticateUser('test@example.com', 'password').then(result => {
      expect(result).toEqual(mockUser);
      done();
    });
  });

  it('should create new user', (done) => {
    const newUser: User = {
      Username: 'newuser',
      Email: 'new@example.com',
      Password: 'newpassword',
      Role: 'employee',
      Name: 'New User',
      ApprovalStatus: 'pending'
    };
    spyOn(service, 'createUser').and.returnValue(Promise.resolve(1));

    service.createUser(newUser).then(result => {
      expect(result).toBe(1);
      done();
    });
  });

  it('should update user approval status', (done) => {
    spyOn(service, 'updateUserApprovalStatus').and.returnValue(of(true));

    service.updateUserApprovalStatus(1, 'approved').subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should get all products', (done) => {
    const mockProducts: Product[] = [
      { id: 1, name: 'Coffee', description: 'Hot coffee', price: 2.5, category: 'Drinks', imageURL: 'coffee.jpg', isAvailable: true },
      { id: 2, name: 'Tea', description: 'Hot tea', price: 2.0, category: 'Drinks', imageURL: 'tea.jpg', isAvailable: true }
    ];
    spyOn(service, 'getAllProducts').and.returnValue(of(mockProducts));

    service.getAllProducts().subscribe(result => {
      expect(result).toEqual(mockProducts);
      done();
    });
  });

  it('should create new order', (done) => {
    const newOrder: Order = {
      orderNumber: 1,
      userId: 1,
      tableNumber: 5,
      status: 'Solicitado',
      notes: 'No sugar',
      totalAmount: 10.5,
      paymentMethod: 'cash'
    };
    spyOn(service, 'createOrder').and.returnValue(Promise.resolve(1));

    service.createOrder(newOrder).then(result => {
      expect(result).toBe(1);
      done();
    });
  });

  it('should update order status', (done) => {
    spyOn(service, 'updateOrderStatus').and.returnValue(of(true));

    service.updateOrderStatus(1, 'En proceso').subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should get order details', (done) => {
    const mockOrderDetails: OrderDetail[] = [
      { id: 1, orderId: 1, productId: 1, quantity: 2, price: 5.0 },
      { id: 2, orderId: 1, productId: 2, quantity: 1, price: 2.0 }
    ];
    spyOn(service, 'getOrderDetails').and.returnValue(of(mockOrderDetails));

    service.getOrderDetails(1).subscribe(result => {
      expect(result).toEqual(mockOrderDetails);
      done();
    });
  });
});