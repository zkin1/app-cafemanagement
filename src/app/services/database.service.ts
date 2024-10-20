import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, from,throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { of, firstValueFrom, forkJoin } from 'rxjs';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';
import { Plugins } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
const { Console } = Plugins;


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

      await this.createTablesIfNotExist();
      await this.insertSeedDataIfEmpty();
      this.dbReady.next(true);
    } catch (error) {
      console.error('Error initializing database', error);
      this.presentAlert('Error', 'Failed to initialize the database. Please try again.');
    }
  }

  async createTablesIfNotExist() {
    const tables = [this.tableUsers, this.tableProducts, this.tableOrders, this.tableOrderDetails, this.tableSalesReports];
    for (const table of tables) {
      await this.database.executeSql(table, []);
    }
  }

  async getUserCount(): Promise<number> {
    const result = await this.database.executeSql('SELECT COUNT(*) as count FROM Users', []);
    return result.rows.item(0).count;
  }

  async insertSeedDataIfEmpty() {
    const userCount = await this.getUserCount();
    if (userCount === 0) {
      await firstValueFrom(this.insertSeedData());
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
    LastLogin DATETIME,
    ApprovalStatus TEXT NOT NULL CHECK (ApprovalStatus IN ('pending', 'approved', 'rejected')),
    ProfilePicture TEXT
  );`;

  tableProducts: string = `
  CREATE TABLE IF NOT EXISTS Products (
    ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
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
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    TotalSales REAL NOT NULL,
    TotalOrders INTEGER NOT NULL,
    CanceledOrders INTEGER NOT NULL,
    CanceledSales REAL NOT NULL,
    TopSellingProducts TEXT NOT NULL,
    DailySales TEXT NOT NULL,
    GeneratedBy INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (GeneratedBy) REFERENCES Users(UserID)
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
      await this.database.executeSql('DROP TABLE IF EXISTS Users', []);
      await this.database.executeSql('DROP TABLE IF EXISTS Products', []);
      await this.database.executeSql('DROP TABLE IF EXISTS Orders', []);
      await this.database.executeSql('DROP TABLE IF EXISTS OrderDetails', []);
      await this.database.executeSql('DROP TABLE IF EXISTS SalesReports', []);
  
      await this.database.executeSql(this.tableUsers, []);
      await this.database.executeSql(this.tableProducts, []);
      await this.database.executeSql(this.tableOrders, []);
      await this.database.executeSql(this.tableOrderDetails, []);
      await this.database.executeSql(this.tableSalesReports, []);
  
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
  async createUser(user: User): Promise<number | null> {
    console.log('Iniciando creación de usuario en la base de datos');
    try {
      const result = await this.database.executeSql(
        'INSERT INTO Users (Username, Password, Role, Name, Email, ApprovalStatus) VALUES (?, ?, ?, ?, ?, ?)',
        [user.Username, user.Password, user.Role, user.Name, user.Email, user.ApprovalStatus]
      );
      console.log('Usuario insertado con éxito, ID:', result.insertId);
      return result.insertId;
    } catch (error: unknown) {
      console.error('Error al crear usuario:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: Users.Email')) {
        console.log('Error de email duplicado');
        return null;
      }
      throw error;
    }
  }

  getAllUsers(): Observable<User[]> {
    return from(this.database.executeSql('SELECT * FROM Users', [])).pipe(
      map(data => {
        console.log('Resultado de la consulta SQL:', data);
        let users: User[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          const row = data.rows.item(i);
          users.push({
            UserID: row.UserID,
            Username: row.Username,
            Password: '', // No devolvemos la contraseña real por seguridad
            Role: row.Role as 'employee' | 'admin' | 'manager',
            Name: row.Name,
            Email: row.Email,
            PhoneNumber: row.PhoneNumber,
            HireDate: row.HireDate ? new Date(row.HireDate) : undefined,
            LastLogin: row.LastLogin ? new Date(row.LastLogin) : undefined,
            ApprovalStatus: row.ApprovalStatus as 'pending' | 'approved' | 'rejected',
            ProfilePicture: row.ProfilePicture || undefined
          });
        }
        console.log('Usuarios procesados:', users);
        return users;
      }),
      catchError(error => {
        console.error('Error en getAllUsers:', error);
        return throwError(() => new Error('Error al obtener usuarios: ' + error.message));
      })
    );
  }

  getPendingUsers(): Observable<User[]> {
    return from(this.database.executeSql('SELECT * FROM Users WHERE ApprovalStatus = ?', ['pending'])).pipe(
      map(data => {
        let users: User[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          users.push(data.rows.item(i));
        }
        return users;
      })
    );
  }

  updateUserApprovalStatus(userId: number, status: 'approved' | 'rejected' | 'pending'): Observable<boolean> {
    console.log(`Actualizando estado de aprobación para usuario ${userId} a ${status}`);
    return from(this.database.executeSql(
      'UPDATE Users SET ApprovalStatus = ? WHERE UserID = ?',
      [status, userId]
    )).pipe(
      map(result => {
        console.log('Resultado de la actualización:', result);
        return result.rowsAffected > 0;
      }),
      catchError(error => {
        console.error('Error al actualizar el estado de aprobación:', error);
        return of(false);
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
    const query = `
      SELECT DISTINCT p.*
      FROM Products p
      LEFT JOIN (
        SELECT Name, MIN(ProductID) as MinID
        FROM Products
        GROUP BY Name
      ) p2 ON p.Name = p2.Name AND p.ProductID = p2.MinID
      WHERE p2.MinID IS NOT NULL
    `;
    return from(this.database.executeSql(query, [])).pipe(
      map(data => {
        console.log('Resultado de la consulta de productos:', JSON.stringify(data));
        let products: Product[] = [];
        
        for (let i = 0; i < data.rows.length; i++) {
          let item = data.rows.item(i);
          console.log('Producto individual:', JSON.stringify(item));
          
          const product: Product = {
            id: item.ProductID,
            name: item.Name,
            description: item.Description,
            price: item.Price,
            category: item.Category,
            imageURL: item.ImageURL,
            isAvailable: item.IsAvailable === 1
          };
          products.push(product);
        }
        
        console.log('Productos procesados:', JSON.stringify(products));
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
            id: data.rows.item(i).OrderID,
            status: data.rows.item(i).Status,
            tableNumber: data.rows.item(i).TableNumber
          });
        }
        return orders;
      })
    );
  }
  
  async getOrdersCount(statuses: string[]): Promise<number> {
    const placeholders = statuses.map(() => '?').join(',');
    const query = `SELECT COUNT(*) as count FROM Orders WHERE Status IN (${placeholders})`;
    const result = await this.database.executeSql(query, statuses);
    return result.rows.item(0).count;
  }
  // Método de autenticación
  async authenticateUser(email: string, password: string): Promise<User | null> {
    console.log('Intentando autenticar usuario:', email);
    try {
      const query = 'SELECT * FROM Users WHERE Email = ?';
      const result = await this.database.executeSql(query, [email]);
      console.log('Resultado de la consulta:', JSON.stringify(result));
  
      if (result.rows.length > 0) {
        const user = result.rows.item(0);
        console.log('Usuario encontrado:', JSON.stringify(user));
        if (user.Password === password) {
          console.log('Contraseña correcta');
          if (user.ApprovalStatus === 'approved') {
            console.log('Usuario aprobado');
            return user;
          } else {
            console.log('Usuario no aprobado. Estado:', user.ApprovalStatus);
            return null;
          }
        } else {
          console.log('Contraseña incorrecta');
        }
      } else {
        console.log('No se encontró usuario con ese email');
      }
      return null;
    } catch (error) {
      console.error('Error durante la autenticación:', error);
      throw error;
    }
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
  async calculateTotalSales(startDate: string, endDate: string, statuses: string[] = ['Solicitado', 'En proceso', 'Listo', 'Entregado']): Promise<number> {
    const placeholders = statuses.map(() => '?').join(',');
    const query = `
      SELECT SUM(TotalAmount) as TotalSales 
      FROM Orders 
      WHERE DATE(CreatedAt) BETWEEN ? AND ? 
      AND Status IN (${placeholders})
    `;
    const params = [startDate, endDate, ...statuses];
    
    try {
      const data = await this.database.executeSql(query, params);
      return data.rows.item(0).TotalSales || 0;
    } catch (error) {
      console.error('Error al calcular ventas totales:', error);
      return 0;
    }
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
      JOIN Orders o ON od.OrderID = o.OrderID
      WHERE o.Status != 'Cancelado'
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

  addProductToOrder(orderDetail: OrderDetail): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO OrderDetails (OrderID, ProductID, Quantity, Size, MilkType, Price) VALUES (?, ?, ?, ?, ?, ?)';
      const values = [orderDetail.orderId, orderDetail.productId, orderDetail.quantity, orderDetail.size, orderDetail.milkType, orderDetail.price];
      
      this.database.executeSql(sql, values)
        .then(data => {
          resolve(data.insertId);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  getOrderDetails(orderId: number): Observable<OrderDetail[]> {
    return from(this.database.executeSql(`
      SELECT od.*, p.Name, p.ImageURL 
      FROM OrderDetails od
      LEFT JOIN Products p ON od.ProductID = p.ProductID
      WHERE od.OrderID = ?
    `, [orderId])).pipe(
      map(data => {
        let orderDetails: OrderDetail[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          orderDetails.push({
            id: item.OrderDetailID,
            orderId: item.OrderID,
            productId: item.ProductID,
            quantity: item.Quantity,
            size: item.Size,
            milkType: item.MilkType,
            price: item.Price,
            name: item.Name || 'Producto desconocido',
            image: item.ImageURL || 'assets/default-product-image.jpg'
          });
        }
        return orderDetails;
      })
    );
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
  

  deleteUser(userId: number): Observable<boolean> {
    return from(this.database.executeSql('DELETE FROM Users WHERE UserID = ?', [userId])).pipe(
      map(result => result.rowsAffected > 0),
      catchError(error => {
        console.error('Error deleting user:', error);
        return of(false);
      })
    );
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
    return from(this.database.executeSql('SELECT * FROM Users WHERE Email = ?', [email])).pipe(
      map(data => {
        if (data.rows.length > 0) {
          return {
            UserID: data.rows.item(0).UserID,
            Username: data.rows.item(0).Username,
            Password: data.rows.item(0).Password,
            Role: data.rows.item(0).Role,
            Name: data.rows.item(0).Name,
            Email: data.rows.item(0).Email,
            PhoneNumber: data.rows.item(0).PhoneNumber,
            HireDate: data.rows.item(0).HireDate ? new Date(data.rows.item(0).HireDate) : undefined,
            LastLogin: data.rows.item(0).LastLogin ? new Date(data.rows.item(0).LastLogin) : undefined,
            ApprovalStatus: data.rows.item(0).ApprovalStatus
          };
        }
        return null;
      })
    );
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


insertSeedData(): Observable<boolean> {
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com', approvalStatus: 'approved' },
      { username: 'employee1', password: 'emp123', role: 'employee', name: 'Employee One', email: 'emp1@example.com', approvalStatus: 'approved' }
    ];
  
    const products = [
      { name: 'Café Americano', description: 'Café negro tradicional', price: 2500, category: 'Bebidas calientes', imageURL: 'americano.jpg', isAvailable: true },
      { name: 'Cappuccino', description: 'Espresso con leche espumosa', price: 3000, category: 'Bebidas calientes', imageURL: 'cappuccino.jpg', isAvailable: true },
      { name: 'Latte', description: 'Café con leche cremosa', price: 3200, category: 'Bebidas calientes', imageURL: 'latte.jpg', isAvailable: true },
    ];
  
    return forkJoin([
      ...users.map(user => 
        from(this.database.executeSql(
          'INSERT OR IGNORE INTO Users (Username, Password, Role, Name, Email, ApprovalStatus) VALUES (?, ?, ?, ?, ?, ?)', 
          [user.username, user.password, user.role, user.name, user.email, user.approvalStatus]
        ))
      ),
      ...products.map(product => 
        from(this.database.executeSql(
          'INSERT OR IGNORE INTO Products (Name, Description, Price, Category, ImageURL, IsAvailable) VALUES (?, ?, ?, ?, ?, ?)', 
          [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0]
        ))
      )
    ]).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error in insertSeedData:', error);
        return of(false);
      })
    );
  }

  getOrderCountForToday(): Promise<number> {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString().split('T')[0];
      const query = `SELECT COUNT(*) as count FROM Orders WHERE DATE(CreatedAt) = ?`;
      this.database.executeSql(query, [today]).then(data => {
        resolve(data.rows.item(0).count);
      }, err => {
        reject(err);
      });
    });
  }

  getActiveEmployeesCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `SELECT COUNT(*) as count FROM Users WHERE Role = 'employee' AND LastLogin IS NOT NULL`;
      this.database.executeSql(query, []).then(data => {
        resolve(data.rows.item(0).count);
      }, err => {
        reject(err);
      });
    });
  }


  async getProductDetails(productName: string): Promise<any> {
    const query = `
      SELECT 
        p.Name as name,
        SUM(od.Quantity) as totalSold,
        SUM(od.Quantity * od.Price) as totalRevenue,
        p.Stock as currentStock
      FROM Products p
      LEFT JOIN OrderDetails od ON p.ProductID = od.ProductID
      WHERE p.Name = ?
      GROUP BY p.ProductID
    `;
    
    try {
      const result = await this.database.executeSql(query, [productName]);
      if (result.rows.length > 0) {
        return result.rows.item(0);
      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error al obtener detalles del producto:', error);
      throw error;
    }
  }

  async updateUserProfilePicture(userId: number, profilePicture: string): Promise<boolean> {
    const query = 'UPDATE Users SET ProfilePicture = ? WHERE UserID = ?';
    try {
      const result = await this.database.executeSql(query, [profilePicture, userId]);
      console.log(`Foto de perfil actualizada para el usuario ${userId}`);
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return false;
    }
  }

  getUserProfilePicture(userId: number): Observable<string | null> {
    return from(this.database.executeSql('SELECT ProfilePicture FROM Users WHERE UserID = ?', [userId])).pipe(
      map(data => {
        if (data.rows.length > 0) {
          const profilePicture = data.rows.item(0).ProfilePicture;
          console.log(`Foto de perfil para usuario ${userId}:`, profilePicture);
          return profilePicture;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Error al obtener la foto de perfil para el usuario ${userId}:`, error);
        return of(null);
      })
    );
  }

  async saveProfilePicture(userId: number, imageData: string): Promise<string> {
    const fileName = `profile_${userId}_${new Date().getTime()}.jpg`;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: imageData,
      directory: Directory.Data
    });

    // Guarda la ruta en la base de datos
    await this.database.executeSql(
      'UPDATE Users SET ProfilePicture = ? WHERE UserID = ?',
      [savedFile.uri, userId]
    );

    return savedFile.uri;
  }

    async getProfilePicture(userId: number): Promise<string | null> {
    const data = await this.database.executeSql(
      'SELECT ProfilePicture FROM Users WHERE UserID = ?',
      [userId]
    );
    if (data.rows.length > 0) {
      const profilePicturePath = data.rows.item(0).ProfilePicture;
      if (profilePicturePath) {
        const readFile = await Filesystem.readFile({
          path: profilePicturePath,
          directory: Directory.Data
        });
        return `data:image/jpeg;base64,${readFile.data}`;
      }
    }
    return null;
  }


  async removeDuplicateProducts() {
    const query = `
      DELETE FROM Products
      WHERE ProductID NOT IN (
        SELECT MIN(ProductID)
        FROM Products
        GROUP BY Name
      )
    `;
    await this.database.executeSql(query, []);
  }
  
}

