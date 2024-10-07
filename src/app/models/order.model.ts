import { OrderDetail } from './order-detail.model';

export interface Order {
  id?: number;
  orderNumber: number;
  userId: number;
  tableNumber: number | null;
  status: 'Solicitado' | 'En proceso' | 'Listo' | 'Cancelado' | 'Entregado';
  notes: string;
  totalAmount: number;  
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
  items?: OrderDetail[];
}