import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  public database!: SQLiteObject;

  // Definición de tablas
  tableUser: string = `CREATE TABLE IF NOT EXISTS user(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT NOT NULL UNIQUE, 
    password TEXT NOT NULL, 
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phoneNumber TEXT,
    hireDate TEXT
  );`;

  tableProduct: string = `CREATE TABLE IF NOT EXISTS product(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    imageURL TEXT,
    isAvailable INTEGER DEFAULT 1
  );`;

  tableOrder: string = `CREATE TABLE IF NOT EXISTS orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    tableNumber INTEGER,
    status TEXT NOT NULL,
    notes TEXT,
    totalAmount REAL NOT NULL,
    paymentMethod TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id)
  );`;

  // Inserts por defecto
  defaultAdmin: string = `INSERT OR IGNORE INTO user(id, username, password, role, name, email) 
    VALUES (1, 'admin', 'admin123', 'admin', 'Administrador', 'admin@cafeteria.com');`;

  // BehaviorSubjects para los listados
  listUsers = new BehaviorSubject<User[]>([]);
  listProducts = new BehaviorSubject<Product[]>([]);
  listOrders = new BehaviorSubject<Order[]>([]);

  private isDBReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private sqlite: SQLite, 
    private platform: Platform, 
    private alertController: AlertController
  ) {
    this.createDB();
  }

  async presentAlert(titulo: string, msj: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msj,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Métodos para observables
  fetchUsers(): Observable<User[]> {
    return this.listUsers.asObservable();
  }

  fetchProducts(): Observable<Product[]> {
    return this.listProducts.asObservable();
  }

  fetchOrders(): Observable<Order[]> {
    return this.listOrders.asObservable();
  }

  dbState() {
    return this.isDBReady.asObservable();
  }

  // Crear la Base de Datos
  createDB() {
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'cafeteria.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.createTables();
      }).catch(e => {
        this.presentAlert('Base de Datos', 'Error al crear la BD: ' + JSON.stringify(e));
      });
    });
  }

  async createTables() {
    try {
      await this.database.executeSql(this.tableUser, []);
      await this.database.executeSql(this.tableProduct, []);
      await this.database.executeSql(this.tableOrder, []);
      await this.database.executeSql(this.defaultAdmin, []);
      this.loadInitialData();
      this.isDBReady.next(true);
    } catch (e) {
      this.presentAlert('Creación de Tablas', 'Error al crear las tablas: ' + JSON.stringify(e));
    }
  }

  // Cargar datos iniciales
  async loadInitialData() {
    this.getAllUsers();
    this.getAllProducts();
    this.getAllOrders();
  }

  // Métodos CRUD para User
  async getAllUsers() {
    try {
      const users: User[] = [];
      const data = await this.database.executeSql('SELECT * FROM user', []);
      for (let i = 0; i < data.rows.length; i++) {
        users.push(data.rows.item(i));
      }
      this.listUsers.next(users);
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener usuarios: ' + JSON.stringify(e));
    }
  }

  async updateUserLastLogin(userId: number) {
    try {
      const data = await this.database.executeSql(
        'UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?',
        [userId]
      );
      await this.getAllUsers();
      this.presentAlert('Éxito', 'Último login del usuario actualizado correctamente');
    } catch (e) {
      this.presentAlert('Error', 'Error al actualizar el último login del usuario: ' + JSON.stringify(e));
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const result = await this.database.executeSql(
        'SELECT * FROM Users WHERE Email = ? AND Password = ?',
        [email, password]
      );
      return result.rows.length > 0 ? result.rows.item(0) as User : null;
    } catch (error) {
      this.presentAlert('Error', 'Error autenticando al usuario: ' + JSON.stringify(error));
      throw error;
    }
  }
  
  

  async addUser(user: User) {
    try {
      const data = await this.database.executeSql(
        'INSERT INTO user (username, password, role, name, email, phoneNumber, hireDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.username, user.password, user.role, user.name, user.email, user.phoneNumber, user.hireDate]
      );
      this.getAllUsers();
    } catch (e) {
      this.presentAlert('Error', 'Error al añadir usuario: ' + JSON.stringify(e));
    }
  }

  async updateUser(user: User) {
    try {
      const data = await this.database.executeSql(
        'UPDATE user SET username=?, password=?, role=?, name=?, email=?, phoneNumber=?, hireDate=? WHERE id=?',
        [user.username, user.password, user.role, user.name, user.email, user.phoneNumber, user.hireDate, user.id]
      );
      this.getAllUsers();
    } catch (e) {
      this.presentAlert('Error', 'Error al actualizar usuario: ' + JSON.stringify(e));
    }
  }

  async deleteUser(id: number) {
    try {
      const data = await this.database.executeSql('DELETE FROM user WHERE id = ?', [id]);
      this.getAllUsers();
    } catch (e) {
      this.presentAlert('Error', 'Error al eliminar usuario: ' + JSON.stringify(e));
    }
  }

  // Métodos CRUD para Product
  async getAllProducts() {
    try {
      const products: Product[] = [];
      const data = await this.database.executeSql('SELECT * FROM product', []);
      for (let i = 0; i < data.rows.length; i++) {
        products.push(data.rows.item(i));
      }
      this.listProducts.next(products);
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener productos: ' + JSON.stringify(e));
    }
  }

  async addProduct(product: Product) {
    try {
      const data = await this.database.executeSql(
        'INSERT INTO product (name, description, price, category, imageURL, isAvailable) VALUES (?, ?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0]
      );
      this.getAllProducts();
    } catch (e) {
      this.presentAlert('Error', 'Error al añadir producto: ' + JSON.stringify(e));
    }
  }

  async updateProduct(product: Product) {
    try {
      const data = await this.database.executeSql(
        'UPDATE product SET name=?, description=?, price=?, category=?, imageURL=?, isAvailable=? WHERE id=?',
        [product.name, product.description, product.price, product.category, product.imageURL, product.isAvailable ? 1 : 0, product.id]
      );
      this.getAllProducts();
    } catch (e) {
      this.presentAlert('Error', 'Error al actualizar producto: ' + JSON.stringify(e));
    }
  }

  async deleteProduct(id: number) {
    try {
      const data = await this.database.executeSql('DELETE FROM product WHERE id = ?', [id]);
      this.getAllProducts();
    } catch (e) {
      this.presentAlert('Error', 'Error al eliminar producto: ' + JSON.stringify(e));
    }
  }

  // Métodos CRUD para Order
  async getAllOrders() {
    try {
      const orders: Order[] = [];
      const data = await this.database.executeSql('SELECT * FROM orders', []);
      for (let i = 0; i < data.rows.length; i++) {
        orders.push(data.rows.item(i));
      }
      this.listOrders.next(orders);
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener órdenes: ' + JSON.stringify(e));
    }
  }

  async addOrder(order: Order) {
    try {
      const data = await this.database.executeSql(
        'INSERT INTO orders (userId, tableNumber, status, notes, totalAmount, paymentMethod) VALUES (?, ?, ?, ?, ?, ?)',
        [order.userId, order.tableNumber, order.status, order.notes, order.totalAmount, order.paymentMethod]
      );
      this.getAllOrders();
    } catch (e) {
      this.presentAlert('Error', 'Error al añadir orden: ' + JSON.stringify(e));
    }
  }

  async updateOrder(order: Order) {
    try {
      const data = await this.database.executeSql(
        'UPDATE orders SET userId=?, tableNumber=?, status=?, notes=?, totalAmount=?, paymentMethod=? WHERE id=?',
        [order.userId, order.tableNumber, order.status, order.notes, order.totalAmount, order.paymentMethod, order.id]
      );
      this.getAllOrders();
    } catch (e) {
      this.presentAlert('Error', 'Error al actualizar orden: ' + JSON.stringify(e));
    }
  }

  async deleteOrder(id: number) {
    try {
      const data = await this.database.executeSql('DELETE FROM orders WHERE id = ?', [id]);
      this.getAllOrders();
    } catch (e) {
      this.presentAlert('Error', 'Error al eliminar orden: ' + JSON.stringify(e));
    }
  }

  // Métodos adicionales útiles

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const data = await this.database.executeSql('SELECT * FROM user WHERE id = ?', [id]);
      return data.rows.item(0);
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener usuario por ID: ' + JSON.stringify(e));
      return undefined;
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      const data = await this.database.executeSql('SELECT * FROM product WHERE id = ?', [id]);
      return data.rows.item(0);
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener producto por ID: ' + JSON.stringify(e));
      return undefined;
    }
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    try {
      const data = await this.database.executeSql('SELECT * FROM orders WHERE id = ?', [id]);
      return data.rows.item(0);
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener orden por ID: ' + JSON.stringify(e));
      return undefined;
    }
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    try {
      const orders: Order[] = [];
      const data = await this.database.executeSql('SELECT * FROM orders WHERE userId = ?', [userId]);
      for (let i = 0; i < data.rows.length; i++) {
        orders.push(data.rows.item(i));
      }
      return orders;
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener órdenes por usuario: ' + JSON.stringify(e));
      return [];
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const products: Product[] = [];
      const data = await this.database.executeSql('SELECT * FROM product WHERE category = ?', [category]);
      for (let i = 0; i < data.rows.length; i++) {
        products.push(data.rows.item(i));
      }
      return products;
    } catch (e) {
      this.presentAlert('Error', 'Error al obtener productos por categoría: ' + JSON.stringify(e));
      return [];
    }
  }
}