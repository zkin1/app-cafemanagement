import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';
import { SalesReport } from '../models/sales-report.model';
import { Inventory } from '../models/inventory.model';
import { Table } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initializeDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
    });
  }

  private async initializeDatabase(): Promise<void> {
    if (this.initialized) return;

    if (Capacitor.isNativePlatform()) {
      try {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
        this.db = await this.sqlite.createConnection(
          'cafeteria',
          false,
          'no-encryption',
          1,
          false
        );
        await this.db.open();
        await this.createTables();
        await this.createIndexes();
        await this.createTriggers();
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
      }
    } else {
      console.warn('SQLite is not available on this platform');
    }
  }

  private async ensureDatabaseInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDatabase();
    }
    if (!this.db) {
      throw new Error('Database connection not initialized');
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT NOT NULL UNIQUE,
        Password TEXT NOT NULL,
        Role TEXT NOT NULL CHECK (Role IN ('employee', 'admin', 'manager')),
        Name TEXT NOT NULL,
        Email TEXT UNIQUE,
        PhoneNumber TEXT,
        HireDate DATE,
        LastLogin DATETIME
      )`,
      `CREATE TABLE IF NOT EXISTS Products (
        ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Description TEXT,
        Price REAL NOT NULL,
        Category TEXT NOT NULL,
        ImageURL TEXT,
        IsAvailable BOOLEAN DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS ProductCategories (
        CategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL UNIQUE,
        Description TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS Orders (
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
      )`,
      `CREATE TABLE IF NOT EXISTS OrderDetails (
        OrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
        OrderID INTEGER,
        ProductID INTEGER,
        Quantity INTEGER NOT NULL,
        Size TEXT,
        MilkType TEXT,
        Price REAL NOT NULL,
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
      )`,
      `CREATE TABLE IF NOT EXISTS SalesReports (
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
      )`,
      `CREATE TABLE IF NOT EXISTS Inventory (
        InventoryID INTEGER PRIMARY KEY AUTOINCREMENT,
        ProductID INTEGER,
        Quantity INTEGER NOT NULL,
        LastRestockedAt DATETIME,
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
      )`,
      `CREATE TABLE IF NOT EXISTS Tables (
        TableID INTEGER PRIMARY KEY AUTOINCREMENT,
        TableNumber INTEGER UNIQUE NOT NULL,
        Capacity INTEGER NOT NULL,
        Status TEXT CHECK (Status IN ('Libre', 'Ocupada', 'Reservada'))
      )`
    ];

    for (const query of queries) {
      await this.db!.execute(query);
    }
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_role ON Users(Role)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON Products(Category)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(Status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_userid ON Orders(UserID)',
      'CREATE INDEX IF NOT EXISTS idx_orderdetails_orderid ON OrderDetails(OrderID)',
      'CREATE INDEX IF NOT EXISTS idx_orderdetails_productid ON OrderDetails(ProductID)',
      'CREATE INDEX IF NOT EXISTS idx_salesreports_date ON SalesReports(Date)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_productid ON Inventory(ProductID)'
    ];

    for (const index of indexes) {
      await this.db!.execute(index);
    }
  }

  private async createTriggers(): Promise<void> {
    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS update_product_timestamp 
       AFTER UPDATE ON Products
       BEGIN
         UPDATE Products SET UpdatedAt = CURRENT_TIMESTAMP WHERE ProductID = NEW.ProductID;
       END`,
      `CREATE TRIGGER IF NOT EXISTS update_order_timestamp 
       AFTER UPDATE ON Orders
       BEGIN
         UPDATE Orders SET UpdatedAt = CURRENT_TIMESTAMP WHERE OrderID = NEW.OrderID;
       END`
    ];

    for (const trigger of triggers) {
      await this.db!.execute(trigger);
    }
  }

  // User CRUD operations
  async createUser(user: User): Promise<number> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `INSERT INTO Users (Username, Password, Role, Name, Email, PhoneNumber, HireDate)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const result = await this.db!.run(query, [user.username, user.password, user.role, user.name, user.email, user.phoneNumber, user.hireDate]);
      return result.changes?.lastId ?? 0;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByCredentials(username: string, password: string): Promise<User | null> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM Users WHERE Username = ? AND Password = ?`;
      const result = await this.db!.query(query, [username, password]);
      return result.values && result.values.length > 0 ? result.values[0] as User : null;
    } catch (error) {
      console.error('Error getting user by credentials:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<void> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `UPDATE Users SET Username = ?, Password = ?, Role = ?, Name = ?, Email = ?, PhoneNumber = ?, HireDate = ?
                     WHERE UserID = ?`;
      await this.db!.run(query, [user.username, user.password, user.role, user.name, user.email, user.phoneNumber, user.hireDate, user.id]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM Users`;
      const result = await this.db!.query(query);
      return result.values as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `DELETE FROM Users WHERE UserID = ?`;
      await this.db!.run(query, [userId]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Product CRUD operations
  async createProduct(product: Product): Promise<number> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `INSERT INTO Products (Name, Description, Price, Category, ImageURL, IsAvailable)
                     VALUES (?, ?, ?, ?, ?, ?)`;
      const result = await this.db!.run(query, [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable]);
      return result.changes?.lastId ?? 0;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async getProductById(productId: number): Promise<Product | null> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM Products WHERE ProductID = ?`;
      const result = await this.db!.query(query, [productId]);
      return result.values && result.values.length > 0 ? result.values[0] as Product : null;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  }

  async updateProduct(product: Product): Promise<void> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `UPDATE Products SET Name = ?, Description = ?, Price = ?, Category = ?, ImageURL = ?, IsAvailable = ?
                     WHERE ProductID = ?`;
      await this.db!.run(query, [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable, product.id]);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM Products`;
      const result = await this.db!.query(query);
      return result.values as Product[];
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }

  async deleteProduct(productId: number): Promise<void> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `DELETE FROM Products WHERE ProductID = ?`;
      await this.db!.run(query, [productId]);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Order operations
  async createOrder(order: Order): Promise<number> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `INSERT INTO Orders (UserID, TableNumber, Status, Notes, TotalAmount, PaymentMethod)
                     VALUES (?, ?, ?, ?, ?, ?)`;
      const result = await this.db!.run(query, [order.userId, order.tableNumber, order.status, order.notes, order.totalAmount, order.paymentMethod]);
      return result.changes?.lastId ?? 0;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM Orders WHERE OrderID = ?`;
      const result = await this.db!.query(query, [orderId]);
      return result.values && result.values.length > 0 ? result.values[0] as Order : null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<void> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `UPDATE Orders SET Status = ? WHERE OrderID = ?`;
      await this.db!.run(query, [status, orderId]);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM Orders WHERE Status = ?`;
      const result = await this.db!.query(query, [status]);
      return result.values as Order[];
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw error;
    }
  }

  // OrderDetails operations
  async addProductToOrder(orderDetail: OrderDetail): Promise<void> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `INSERT INTO OrderDetails (OrderID, ProductID, Quantity, Size, MilkType, Price)
                     VALUES (?, ?, ?, ?, ?, ?)`;
      await this.db!.run(query, [orderDetail.orderId, orderDetail.productId, orderDetail.quantity, orderDetail.size, orderDetail.milkType, orderDetail.price]);
    } catch (error) {
      console.error('Error adding product to order:', error);
      throw error;
    }
  }

  async getOrderDetails(orderId: number): Promise<OrderDetail[]> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM OrderDetails WHERE OrderID = ?`;
      const result = await this.db!.query(query, [orderId]);
      return result.values as OrderDetail[];
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }

  // SalesReport operations
  async createSalesReport(report: SalesReport): Promise<number> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `INSERT INTO SalesReports (Date, TotalSales, TotalOrders, AverageOrderValue, TopSellingProduct, GeneratedBy)
                     VALUES (?, ?, ?, ?, ?, ?)`;
      const result = await this.db!.run(query, [report.date, report.totalSales, report.totalOrders, report.averageOrderValue, report.topSellingProduct, report.generatedBy]);
      return result.changes?.lastId ?? 0;
    } catch (error) {
      console.error('Error creating sales report:', error);
      throw error;
    }
  }

  async getSalesReportsByDateRange(startDate: string, endDate: string): Promise<SalesReport[]> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `SELECT * FROM SalesReports WHERE Date BETWEEN ? AND ?`;
      const result = await this.db!.query(query, [startDate, endDate]);
      return result.values as SalesReport[];
    } catch (error) {
      console.error('Error getting sales reports by date range:', error);
      throw error;
    }
  }


  async getOrdersByEmployeeAndDate(employeeId: number, date: string): Promise<Order[]> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `
        SELECT * FROM Orders 
        WHERE UserID = ? AND DATE(CreatedAt) = ?
      `;
      const result = await this.db!.query(query, [employeeId, date]);
      return result.values as Order[];
    } catch (error) {
      console.error('Error getting orders by employee and date:', error);
      throw error;
    }
  }

  async calculateTotalSales(startDate: string, endDate: string): Promise<number> {
    await this.ensureDatabaseInitialized();
    try {
      const query = `
        SELECT SUM(TotalAmount) as TotalSales 
        FROM Orders 
        WHERE DATE(CreatedAt) BETWEEN ? AND ?
      `;
      const result = await this.db!.query(query, [startDate, endDate]);
      return result.values && result.values.length > 0 ? result.values[0].TotalSales || 0 : 0;
    } catch (error) {
      console.error('Error calculating total sales:', error);
      throw error;
    }
  }

  async getTopSellingProducts(limit: number = 5): Promise<{productId: number, name: string, totalSold: number}[]> {
    await this.ensureDatabaseInitialized();
    try {
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
      const result = await this.db!.query(query, [limit]);
      return result.values as {productId: number, name: string, totalSold: number}[];
    } catch (error) {
      console.error('Error getting top selling products:', error);
      throw error;
    }
  }
  
}

