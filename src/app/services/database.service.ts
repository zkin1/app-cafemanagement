import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {catchError, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { of, firstValueFrom, forkJoin } from 'rxjs';
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
      await firstValueFrom(this.insertSeedData());
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
  
      // Insertar datos de ejemplo usando insertSeedData
      await this.insertSeedData().toPromise();
  
      this.loadInitialData();
      this.isDBReady.next(true);
    } catch (e) {
      this.presentAlert('Creación de Tablas', 'Error al crear las tablas: ' + JSON.stringify(e));
    }
  }

  // Cargar datos iniciales
  loadInitialData() {
    forkJoin([
      this.getAllUsers(),
      this.getAllProducts(),
      this.getOrdersByStatus(['Solicitado', 'En proceso', 'Listo'])
    ]).subscribe({
      next: ([users, products, orders]) => {
        this.users.next(users);
        this.products.next(products);
        this.orders.next(orders);
        console.log('Initial data loaded successfully');
      },
      error: error => console.error('Error loading initial data:', error)
    });
  }

  // Métodos CRUD para Users
  async createUser(user: User): Promise<number> {
    const data = [user.Username, user.Password, user.Role, user.Name, user.Email, user.PhoneNumber, user.HireDate?.toISOString()];
    const result = await this.database.executeSql('INSERT INTO Users (Username, Password, Role, Name, Email, PhoneNumber, HireDate) VALUES (?, ?, ?, ?, ?, ?, ?)', data);
    this.getAllUsers();
    return result.insertId;
  }

  getAllUsers(): Observable<User[]> {
    return from(this.database.executeSql('SELECT * FROM Users', [])).pipe(
      map(data => {
        let users: User[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          users.push(data.rows.item(i));
        }
        return users;
      })
    );
  }

  // Métodos CRUD para Products
  async createProduct(product: Product): Promise<number> {
    const data = [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0];
    const result = await this.database.executeSql('INSERT INTO Products (Name, Description, Price, Category, ImageURL, IsAvailable) VALUES (?, ?, ?, ?, ?, ?)', data);
    this.getAllProducts();
    return result.insertId;
  }

  getAllProducts(): Observable<Product[]> {
    console.log('Obteniendo todos los productos...');
    return from(this.database.executeSql('SELECT * FROM Products', [])).pipe(
      map(data => {
        console.log('Resultado de la consulta de productos:', JSON.stringify(data));
        let products: Product[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          let item = data.rows.item(i);
          console.log('Producto individual:', JSON.stringify(item));
          products.push({
            id: item.ProductID,
            name: item.Name,
            description: item.Description,
            price: item.Price,
            category: item.Category,
            imageURL: item.ImageURL,
            isAvailable: item.IsAvailable === 1
          });
        }
        console.log('Productos procesados:', JSON.stringify(products));
        this.products.next(products);
        return products;
      }),
      catchError(error => {
        console.error('Error al obtener productos:', error);
        return of([]);
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

  getOrdersByStatus(statuses: string[]): Observable<Order[]> {
    const placeholders = statuses.map(() => '?').join(',');
    return from(this.database.executeSql(`SELECT * FROM Orders WHERE Status IN (${placeholders})`, statuses)).pipe(
      map(data => {
        let orders: Order[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          orders.push({
            ...data.rows.item(i),
            status: data.rows.item(i).Status 
          });
        }
        return orders;
      })
    );
  }

  // Método de autenticación
  async authenticateUser(email: string, password: string): Promise<User | null> {
    console.log('Intentando autenticar usuario:', email);
    const data = await this.database.executeSql(
      'SELECT * FROM Users WHERE Email = ? AND Password = ?', 
      [email, password]
    );
    console.log('Resultado de la consulta:', data);
    if (data.rows.length > 0) {
      const user: User = {
        UserID: data.rows.item(0).UserID,
        Username: data.rows.item(0).Username,
        Password: data.rows.item(0).Password,
        Role: data.rows.item(0).Role,
        Name: data.rows.item(0).Name,
        Email: data.rows.item(0).Email,
        PhoneNumber: data.rows.item(0).PhoneNumber,
        HireDate: data.rows.item(0).HireDate ? new Date(data.rows.item(0).HireDate) : undefined,
        LastLogin: data.rows.item(0).LastLogin ? new Date(data.rows.item(0).LastLogin) : undefined
      };
      console.log('Usuario autenticado:', JSON.stringify(user));
      return user;
    }
    console.log('No se encontró usuario');
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
    const sql = 'UPDATE Users SET Username = ?, Name = ?, Email = ? WHERE UserID = ?';
    const data = [user.Username, user.Name, user.Email, user.UserID];
  
    const result = new Observable<boolean>(observer => {
      this.database.executeSql(sql, data)
        .then(() => {
          observer.next(true);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  
    return result.pipe(
      map(() => true),
      catchError(() => of(false))
    )
    .toPromise()
    .then(res => res !== undefined ? res : false);
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
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' },
      { username: 'employee1', password: 'emp123', role: 'employee', name: 'Employee One', email: 'emp1@example.com' }
    ];
  
    const products = [
      { name: 'Café Americano', description: 'Café negro tradicional', price: 2500, category: 'Bebidas calientes', imageURL: 'americano.jpg', isAvailable: true },
      { name: 'Cappuccino', description: 'Espresso con leche espumosa', price: 3000, category: 'Bebidas calientes', imageURL: 'cappuccino.jpg', isAvailable: true },
      { name: 'Latte', description: 'Café con leche cremosa', price: 3200, category: 'Bebidas calientes', imageURL: 'latte.jpg', isAvailable: true },
      { name: 'Mocha', description: 'Café con chocolate y leche', price: 3500, category: 'Bebidas calientes', imageURL: 'mocha.jpg', isAvailable: true },
      { name: 'Espresso', description: 'Café concentrado', price: 2000, category: 'Bebidas calientes', imageURL: 'espresso.jpg', isAvailable: true }
    ];
  
    return forkJoin([
      from(this.database.executeSql('SELECT COUNT(*) as count FROM Users', [])),
      from(this.database.executeSql('SELECT COUNT(*) as count FROM Products', []))
    ]).pipe(
      map(([userResult, productResult]) => {
        const userCount = userResult.rows.item(0).count;
        const productCount = productResult.rows.item(0).count;
        return userCount === 0 || productCount === 0;
      }),
      switchMap(shouldInsert => {
        if (shouldInsert) {
          console.log('Insertando datos de ejemplo...');
          const userInserts = users.map(user => 
            this.database.executeSql(
              'INSERT OR IGNORE INTO Users (Username, Password, Role, Name, Email) VALUES (?, ?, ?, ?, ?)', 
              [user.username, user.password, user.role, user.name, user.email]
            )
          );
  
          const productInserts = products.map(product => 
            this.database.executeSql(
              'INSERT OR IGNORE INTO Products (Name, Description, Price, Category, ImageURL, IsAvailable) VALUES (?, ?, ?, ?, ?, ?)', 
              [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0]
            )
          );
  
          return forkJoin([...userInserts, ...productInserts]);
        }
        return of(null);
      }),
      map(result => {
        if (result) {
          console.log('Seed data inserted successfully');
          // Verificar los datos insertados
          this.getAllUsers().subscribe(users => console.log('Users after seed:', users));
          this.getAllProducts().subscribe(products => console.log('Products after seed:', products));
          return true;
        } else {
          console.log('Seed data already exists');
          return false;
        }
      }),
      catchError(error => {
        console.error('Error in insertSeedData:', error);
        return of(false);
      })
    );
  }
  
}