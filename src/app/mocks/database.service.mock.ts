// src/app/mocks/database.service.mock.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';

@Injectable()
export class DatabaseServiceMock {
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private users = new BehaviorSubject<User[]>([]);
  private products = new BehaviorSubject<Product[]>([]);
  private orders = new BehaviorSubject<Order[]>([]);
  
  constructor() {
    this.dbReady.next(true);
  }

  // Database initialization methods
  initializeDatabase() {
    return Promise.resolve();
  }

  createTablesIfNotExist() {
    return Promise.resolve();
  }

  getUserCount(): Promise<number> {
    return Promise.resolve(1);
  }

  insertSeedDataIfEmpty() {
    return Promise.resolve();
  }

  // Observable methods
  dbState() {
    return of(true);
  }

  fetchUsers(): Observable<User[]> {
    return this.users.asObservable();
  }

  fetchProducts(): Observable<Product[]> {
    return this.products.asObservable();
  }

  fetchOrders(): Observable<Order[]> {
    return this.orders.asObservable();
  }

  // User methods
  createUser(user: User): Promise<number> {
    return Promise.resolve(1);
  }

  getAllUsers(): Observable<User[]> {
    return of([{
      UserID: 1,
      Username: 'testUser',
      Password: '',
      Role: 'employee',
      Name: 'Test User',
      Email: 'test@test.com',
      ApprovalStatus: 'approved'
    }]);
  }

  getPendingUsers(): Observable<User[]> {
    return of([]);
  }

  updateUserApprovalStatus(userId: number, status: 'approved' | 'rejected' | 'pending'): Observable<boolean> {
    return of(true);
  }

  // Product methods
  createProduct(product: Product): Promise<number> {
    return Promise.resolve(1);
  }

  getAllProducts(): Observable<Product[]> {
    return of([{
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      price: 1000,
      category: 'Test Category',
      imageURL: 'test.jpg',
      isAvailable: true
    }]);
  }

  // Order methods
  createOrder(order: Order): Promise<number> {
    return Promise.resolve(1);
  }

  getOrdersByStatus(statuses: string[]): Observable<Order[]> {
    return of([]);
  }

  getOrdersCount(statuses: string[], date?: string): Promise<number> {
    return Promise.resolve(0);
  }

  // Authentication
  authenticateUser(email: string, password: string): Promise<User | null> {
    return Promise.resolve({
      UserID: 1,
      Username: 'testUser',
      Password: '',
      Role: 'employee',
      Name: 'Test User',
      Email: email,
      ApprovalStatus: 'approved'
    });
  }

  // Order details
  addProductToOrder(orderDetail: OrderDetail): Promise<number> {
    return Promise.resolve(1);
  }

  getOrderDetails(orderId: number): Observable<OrderDetail[]> {
    return of([]);
  }

  updateOrderStatus(orderId: number, status: string): Observable<boolean> {
    return of(true);
  }

  // Product management
  updateProduct(product: Product): Observable<boolean> {
    return of(true);
  }

  deleteProduct(id: number): Observable<boolean> {
    return of(true);
  }

  // User management
  updateUserFromDb(user: User): Promise<boolean> {
    return Promise.resolve(true);
  }

  deleteUser(userId: number): Observable<boolean> {
    return of(true);
  }

  updateUserLastLogin(userId: number): Observable<boolean> {
    return of(true);
  }

  getUserById(id: number): Observable<User> {
    return of({
      UserID: id,
      Username: 'testUser',
      Password: '',
      Role: 'employee',
      Name: 'Test User',
      Email: 'test@test.com',
      ApprovalStatus: 'approved'
    });
  }

  getUserByEmail(email: string): Observable<User | null> {
    return of({
      UserID: 1,
      Username: 'testUser',
      Password: '',
      Role: 'employee',
      Name: 'Test User',
      Email: email,
      ApprovalStatus: 'approved'
    });
  }

  updateUserPassword(userId: number, currentPassword: string, newPassword: string): Observable<boolean> {
    return of(true);
  }

  // Statistics and reports
  calculateTotalSales(startDate: string, endDate: string, statuses: string[]): Promise<number> {
    return Promise.resolve(0);
  }

  getTopSellingProducts(limit: number = 5): Promise<{productId: number, name: string, totalSold: number}[]> {
    return Promise.resolve([]);
  }

  getOrderCountForToday(): Promise<number> {
    return Promise.resolve(0);
  }

  getActiveEmployeesCount(): Promise<number> {
    return Promise.resolve(0);
  }

  getProductDetails(productName: string): Promise<any> {
    return Promise.resolve({});
  }

  // Profile picture management
  updateUserProfilePicture(userId: number, profilePicture: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  getUserProfilePicture(userId: number): Observable<string | null> {
    return of(null);
  }

  saveProfilePicture(userId: number, imageData: string): Promise<string> {
    return Promise.resolve('mock-profile-picture.jpg');
  }

  getProfilePicture(userId: number): Promise<string | null> {
    return Promise.resolve(null);
  }

  // Misc methods
  removeDuplicateProducts(): Promise<void> {
    return Promise.resolve();
  }

  updatePassword(userId: number, newPassword: string): Observable<boolean> {
    return of(true);
  }

  presentAlert(titulo: string, msj: string): Promise<void> {
    return Promise.resolve();
  }
}