import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { of } from 'rxjs';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private database!: SQLiteObject;
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private platform: Platform, 
    private sqlite: SQLite,
    private alertController: AlertController
  ) {
    this.platform.ready().then(() => {
      this.initializeDatabase();
    });
  }

  async initializeDatabase() {
    try {
      this.database = await this.sqlite.create({
        name: 'cafeteria.db',
        location: 'default'
      });
      await this.createTables();
      await this.insertSeedData();
      this.dbReady.next(true);
    } catch (error) {
      console.error('Error initializing database', error);
      this.presentAlert('Error', 'Failed to initialize the database. Please try again.');
    }
  }




  // Tablas
  tableUsers: string = `
    CREATE TABLE IF NOT EXISTS Users (
      UserID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT NOT NULL UNIQUE,
      Password TEXT NOT NULL,
      Role TEXT NOT NULL CHECK (Role IN ('employee', 'admin', 'manager')),
      Name TEXT NOT NULL,
      Email TEXT UNIQUE,
      PhoneNumber TEXT,
      HireDate DATE,
      LastLogin DATETIME
    );`;

  tableProducts: string = `
    CREATE TABLE IF NOT EXISTS Products (
      ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Description TEXT,
      Price REAL NOT NULL,
      Category TEXT NOT NULL,
      ImageURL TEXT,
      IsAvailable BOOLEAN DEFAULT 1,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

  tableOrders: string = `
    CREATE TABLE IF NOT EXISTS Orders (
      OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
      UserID INTEGER,
      TableNumber INTEGER,
      Status TEXT NOT NULL CHECK (Status IN ('Solicitado', 'En proceso', 'Listo', 'Cancelado', 'Entregado')),
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      Notes TEXT,
      TotalAmount REAL NOT NULL,
      PaymentMethod TEXT,
      FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );`;

  tableOrderDetails: string = `
    CREATE TABLE IF NOT EXISTS OrderDetails (
      OrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
      OrderID INTEGER,
      ProductID INTEGER,
      Quantity INTEGER NOT NULL,
      Size TEXT,
      MilkType TEXT,
      Price REAL NOT NULL,
      FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
      FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
    );`;

  tableSalesReports: string = `
    CREATE TABLE IF NOT EXISTS SalesReports (
      ReportID INTEGER PRIMARY KEY AUTOINCREMENT,
      Date DATE NOT NULL,
      TotalSales REAL NOT NULL,
      TotalOrders INTEGER NOT NULL,
      AverageOrderValue REAL,
      TopSellingProduct INTEGER,
      GeneratedBy INTEGER,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (GeneratedBy) REFERENCES Users(UserID),
      FOREIGN KEY (TopSellingProduct) REFERENCES Products(ProductID)
    );`;

  // Datos de ejemplo
  sampleAdminUser: string = `
    INSERT OR IGNORE INTO Users (UserID, Username, Password, Role, Name, Email)
    VALUES (1, 'admin', 'admin123', 'admin', 'Administrador', 'admin@cafeteria.com');`;

  sampleProduct: string = `
    INSERT OR IGNORE INTO Products (ProductID, Name, Description, Price, Category, ImageURL, IsAvailable)
    VALUES (1, 'Café Americano', 'Café negro tradicional', 2500, 'Bebidas calientes', 'assets/americano.jpg', 1);`;

  // BehaviorSubjects para los listados
  private users = new BehaviorSubject<User[]>([]);
  private products = new BehaviorSubject<Product[]>([]);
  private orders = new BehaviorSubject<Order[]>([]);

  // Observable para el estado de la base de datos
  private isDBReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  

  async presentAlert(titulo: string, msj: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msj,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Observables
  dbState() {
    return this.isDBReady.asObservable();
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

  async createTables() {
    try {
      await this.database.executeSql(this.tableUsers, []);
      await this.database.executeSql(this.tableProducts, []);
      await this.database.executeSql(this.tableOrders, []);
      await this.database.executeSql(this.tableOrderDetails, []);
      await this.database.executeSql(this.tableSalesReports, []);
  
      // Insertar datos de ejemplo
      await this.database.executeSql(this.sampleAdminUser, []);
      await this.database.executeSql(this.sampleProduct, []);
  
      this.loadInitialData();
      this.isDBReady.next(true);
    } catch (e) {
      this.presentAlert('Creación de Tablas', 'Error al crear las tablas: ' + JSON.stringify(e));
    }
  }

  // Cargar datos iniciales
  loadInitialData() {
    this.getAllUsers();
    this.getAllProducts();
    this.getOrdersByStatus(['Solicitado', 'En proceso', 'Listo']);
  }

  // Métodos CRUD para Users
  async createUser(user: User): Promise<number> {
    const data = [user.username, user.password, user.role, user.name, user.email, user.phoneNumber, user.hireDate?.toISOString()];
    const result = await this.database.executeSql('INSERT INTO Users (Username, Password, Role, Name, Email, PhoneNumber, HireDate) VALUES (?, ?, ?, ?, ?, ?, ?)', data);
    this.getAllUsers();
    return result.insertId;
  }

  async getAllUsers(): Promise<User[]> {
    const data = await this.database.executeSql('SELECT * FROM Users', []);
    let users: User[] = [];
  
    if (data.rows.length > 0) {
      for (let i = 0; i < data.rows.length; i++) {
        users.push(data.rows.item(i));
      }
    }
  
    return users;
  }
  

  // Métodos CRUD para Products
  async createProduct(product: Product): Promise<number> {
    const data = [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0];
    const result = await this.database.executeSql('INSERT INTO Products (Name, Description, Price, Category, ImageURL, IsAvailable) VALUES (?, ?, ?, ?, ?, ?)', data);
    this.getAllProducts();
    return result.insertId;
  }

  getAllProducts(): Observable<Product[]> {
    return from(this.database.executeSql('SELECT * FROM Products', []))
      .pipe(
        map(data => {
          let products: Product[] = [];
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              products.push(data.rows.item(i));
            }
          }
          return products;
        })
      );
  }

  // Métodos para Orders
  async createOrder(order: Order): Promise<number> {
    const data = [order.userId, order.tableNumber, order.status, order.notes, order.totalAmount, order.paymentMethod];
    const result = await this.database.executeSql('INSERT INTO Orders (UserID, TableNumber, Status, Notes, TotalAmount, PaymentMethod) VALUES (?, ?, ?, ?, ?, ?)', data);
    this.getOrdersByStatus(['Solicitado', 'En proceso', 'Listo']);
    return result.insertId;
  }

  async getOrdersByStatus(statuses: string[]): Promise<Order[]> {
    const placeholders = statuses.map(() => '?').join(',');
    const data = await this.database.executeSql(`SELECT * FROM Orders WHERE Status IN (${placeholders})`, statuses);
    let orders: Order[] = [];
    
    if (data.rows.length > 0) {
      for (let i = 0; i < data.rows.length; i++) {
        orders.push(data.rows.item(i));
      }
    }
  
    this.orders.next(orders); 
  
    return orders;
  }

  // Método de autenticación
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const data = await this.database.executeSql('SELECT * FROM Users WHERE Email = ? AND Password = ?', [email, password]);
    if (data.rows.length > 0) {
      return data.rows.item(0);
    }
    return null;
  }

  pdateProduct(product: Product): Promise<boolean> | Observable<any> {
    const data = [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0, product.id];
    return from(this.database.executeSql('UPDATE Products SET Name = ?, Description = ?, Price = ?, Category = ?, ImageURL = ?, IsAvailable = ? WHERE ProductID = ?', data))
      .pipe(
        map(() => {
          this.getAllProducts();
          return true;
        })
      );
  }

  // Método para calcular ventas totales
  async calculateTotalSales(startDate: string, endDate: string): Promise<number> {
    const data = await this.database.executeSql('SELECT SUM(TotalAmount) as TotalSales FROM Orders WHERE DATE(CreatedAt) BETWEEN ? AND ?', [startDate, endDate]);
    return data.rows.item(0).TotalSales || 0;
  }

  // Método para obtener productos más vendidos
  async getTopSellingProducts(limit: number = 5): Promise<{productId: number, name: string, totalSold: number}[]> {
    const query = `
      SELECT 
        p.ProductID as productId, 
        p.Name as name, 
        SUM(od.Quantity) as totalSold
      FROM OrderDetails od
      JOIN Products p ON od.ProductID = p.ProductID
      GROUP BY od.ProductID
      ORDER BY totalSold DESC
      LIMIT ?
    `;
    const data = await this.database.executeSql(query, [limit]);
    let topProducts: {productId: number, name: string, totalSold: number}[] = [];
    if (data.rows.length > 0) {
      for (let i = 0; i < data.rows.length; i++) {
        topProducts.push(data.rows.item(i));
      }
    }
    return topProducts;
  }

  addProductToOrder(orderDetail: OrderDetail): Observable<number> {
    return new Observable(observer => {
      const sql = 'INSERT INTO OrderDetails (OrderID, ProductID, Quantity, Size, MilkType, Price) VALUES (?, ?, ?, ?, ?, ?)';
      const data = [orderDetail.orderId, orderDetail.productId, orderDetail.quantity, orderDetail.size, orderDetail.milkType, orderDetail.price];
      
      this.database.executeSql(sql, data)
        .then(res => {
          observer.next(res.insertId);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  getOrderDetails(orderId: number): Observable<OrderDetail[]> {
    return new Observable(observer => {
      const sql = 'SELECT * FROM OrderDetails WHERE OrderID = ?';
      this.database.executeSql(sql, [orderId])
        .then(data => {
          let orderDetails: OrderDetail[] = [];
          for (let i = 0; i < data.rows.length; i++) {
            orderDetails.push(data.rows.item(i));
          }
          observer.next(orderDetails);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  updateOrderStatus(orderId: number, status: string): Observable<boolean> {
    return new Observable(observer => {
      const sql = 'UPDATE Orders SET Status = ? WHERE OrderID = ?';
      this.database.executeSql(sql, [status, orderId])
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  updateProduct(product: Product): Observable<boolean> {
    return new Observable(observer => {
      const sql = 'UPDATE Products SET Name = ?, Description = ?, Price = ?, Category = ?, ImageURL = ?, IsAvailable = ? WHERE ProductID = ?';
      const data = [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0, product.id];
      
      this.database.executeSql(sql, data)
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  deleteProduct(id: number): Promise<boolean> | Observable<any> {
    return from(this.database.executeSql('DELETE FROM Products WHERE ProductID = ?', [id]))
      .pipe(
        map(() => {
          this.getAllProducts();
          return true;
        })
      );
  }
  public updateUserFromDb(user: User): Promise<boolean> {
    const sql = 'UPDATE Users SET Username = ?, Name = ?, Email = ?, Role = ? WHERE UserID = ?';
    const data = [user.username, user.name, user.email, user.role, user.id];
  
    // Realiza la consulta SQL directamente usando `executeSql`
    const result = new Observable<boolean>(observer => {
      this.database.executeSql(sql, data)
        .then(() => {
          observer.next(true);  // Si la operación es exitosa, emitimos `true`
          observer.complete();
        })
        .catch(error => {
          observer.error(error); // Si ocurre un error, lo manejamos
        });
    });
  
    return result.pipe(
      map(() => true), // Retornamos `true` si la operación fue exitosa
      catchError(() => of(false)) // En caso de error, retornamos `false`
    )
    .toPromise()
    .then(res => res !== undefined ? res : false); // Aseguramos que nunca se retorne `undefined`
  }
  

  deleteUser(id: number): Observable<boolean> {
    return new Observable(observer => {
      const sql = 'DELETE FROM Users WHERE UserID = ?';
      this.database.executeSql(sql, [id])
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  updateUserLastLogin(userId: number): Observable<boolean> {
    return new Observable(observer => {
      const sql = 'UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?';
      this.database.executeSql(sql, [userId])
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  getUserById(id: number): Observable<User> {
    return new Observable(observer => {
      const sql = 'SELECT * FROM Users WHERE UserID = ?';
      this.database.executeSql(sql, [id])
        .then(data => {
          if (data.rows.length > 0) {
            observer.next(data.rows.item(0));
          } else {
            observer.error('User not found');
          }
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  getUserByEmail(email: string): Observable<User | null> {
    return new Observable(observer => {
      const sql = 'SELECT * FROM Users WHERE Email = ?';
      this.database.executeSql(sql, [email])
        .then(data => {
          if (data.rows.length > 0) {
            observer.next(data.rows.item(0));
          } else {
            observer.next(null);
          }
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  updateUserPassword(userId: number, currentPassword: string, newPassword: string): Observable<boolean> {
    const sql = 'UPDATE Users SET Password = ? WHERE UserID = ? AND Password = ?';
    const data = [newPassword, userId, currentPassword];
  
    return new Observable(observer => {
      this.database.executeSql(sql, data)
        .then(() => {
          observer.next(true);  // Si la operación fue exitosa
          observer.complete();
        })
        .catch(error => {
          observer.error(error);  // Si hay un error, lo emitimos
        });
    });
  }

  // Método para insertar datos de prueba
  insertSeedData(): Observable<boolean> {
    return new Observable(observer => {
      const users = [
        { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' },
        { username: 'employee1', password: 'emp123', role: 'employee', name: 'Employee One', email: 'emp1@example.com' }
      ];

      const products = [
        { name: 'Café Americano', description: 'Café negro tradicional', price: 2500, category: 'Bebidas calientes', imageURL: 'assets/americano.jpg', isAvailable: true },
        { name: 'Cappuccino', description: 'Espresso con leche espumosa', price: 3000, category: 'Bebidas calientes', imageURL: 'assets/cappuccino.jpg', isAvailable: true }
      ];

      // Insertar usuarios
      const userPromises = users.map(user => 
        this.database.executeSql('INSERT OR IGNORE INTO Users (Username, Password, Role, Name, Email) VALUES (?, ?, ?, ?, ?)', 
          [user.username, user.password, user.role, user.name, user.email])
      );

      // Insertar productos
      const productPromises = products.map(product => 
        this.database.executeSql('INSERT OR IGNORE INTO Products (Name, Description, Price, Category, ImageURL, IsAvailable) VALUES (?, ?, ?, ?, ?, ?)', 
          [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0])
      );

      Promise.all([...userPromises, ...productPromises])
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch(e => observer.error(e));
    });
  }

  
  
}