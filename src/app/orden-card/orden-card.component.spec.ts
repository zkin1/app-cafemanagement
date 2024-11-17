import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { OrdenCardComponent } from './orden-card.component';
import { Order } from '../models/order.model';
import { OrderDetail } from '../models/order-detail.model';

describe('OrdenCardComponent', () => {
  let component: OrdenCardComponent;
  let fixture: ComponentFixture<OrdenCardComponent>;

  // Mock OrderDetail para pruebas
  const mockItems: OrderDetail[] = [
    {
      id: 1,
      orderId: 1,
      productId: 1,
      quantity: 2,
      price: 2500,
      name: 'Café',
      size: 'Grande',
      milkType: 'Normal',
      image: 'cafe.jpg'
    },
    {
      id: 2,
      orderId: 1,
      productId: 2,
      quantity: 1,
      price: 3500,
      name: 'Pastel',
      size: 'Normal',
      milkType: null,
      image: 'pastel.jpg'
    }
  ];

  // Mock order para pruebas
  const mockOrder: Order = {
    id: 1,
    orderNumber: 1001,
    userId: 1,
    status: 'Solicitado',
    tableNumber: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: "Nota de prueba",
    totalAmount: 8500,
    paymentMethod: "efectivo",
    items: mockItems
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrdenCardComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdenCardComponent);
    component = fixture.componentInstance;
    
    component.orden = mockOrder;
    fixture.detectChanges();
  });

  it('1. debe cargar el componente', () => {
    expect(component).toBeTruthy();
  });

  it('3. should correctly initialize with input order', () => {
    expect(component.orden).toBeTruthy();
    expect(component.orden.id).toBe(1);
    expect(component.orden.status).toBe('Solicitado');
    expect(component.orden.tableNumber).toBe(5);
  });

  it('4. Debería calcular correctamente el total del pedido', () => {
    const total = component.getOrderTotal();
    expect(total).toBe(8500);
  });

  it('5. Debe manejar el cálculo del total del pedido con una matriz de artículos vacía', () => {
    component.orden = {
      id: 2,
      orderNumber: 1002,
      userId: 1,
      status: 'Solicitado',
      tableNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
      totalAmount: 0,
      paymentMethod: "efectivo",
      items: []
    };
    const total = component.getOrderTotal();
    expect(total).toBe(0);
  });

  it('1. Debe manejar el cálculo del total del pedido con artículos no definidos', () => {
    component.orden = {
      id: 3,
      orderNumber: 1003,
      userId: 1,
      status: 'Solicitado',
      tableNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
      totalAmount: 0,
      paymentMethod: "efectivo"
    };
    const total = component.getOrderTotal();
    expect(total).toBe(0);
  });

  it('2. Debería emitir el evento cambiarEstado con los valores correctos', () => {
    spyOn(component.cambiarEstado, 'emit');
    
    const nuevoEstado = 'En proceso';
    component.onCambiarEstado(nuevoEstado);
    
    expect(component.cambiarEstado.emit).toHaveBeenCalledWith({
      orden: component.orden,
      nuevoEstado: nuevoEstado
    });
  });

  it('3. Debe manejar artículos con precio o cantidad faltantes', () => {
    const incompleteMockItems: OrderDetail[] = [
      {
        id: 1,
        orderId: 4,
        productId: 1,
        quantity: 2,
        price: 0,
        name: 'Café',
        size: 'Grande',
        milkType: 'Normal',
        image: 'cafe.jpg'
      },
      {
        id: 2,
        orderId: 4,
        productId: 2,
        quantity: 1,
        price: 3500,
        name: 'Pastel',
        size: 'Normal',
        milkType: null,
        image: 'pastel.jpg'
      }
    ];

    component.orden = {
      id: 4,
      orderNumber: 1004,
      userId: 1,
      status: 'Solicitado',
      tableNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "",
      totalAmount: 3500,
      paymentMethod: "efectivo",
      items: incompleteMockItems
    };
    
    const total = component.getOrderTotal();
    expect(total).toBe(3500);
  });

  it('4. Debe manejar cambios de estado para diferentes valores de estado.', () => {
    spyOn(component.cambiarEstado, 'emit');
    
    const estados = ['Solicitado', 'En proceso', 'Listo', 'Entregado', 'Cancelado'];
    
    estados.forEach(estado => {
      component.onCambiarEstado(estado);
      expect(component.cambiarEstado.emit).toHaveBeenCalledWith({
        orden: component.orden,
        nuevoEstado: estado
      });
    });
    
    expect(component.cambiarEstado.emit).toHaveBeenCalledTimes(estados.length);
  });
});