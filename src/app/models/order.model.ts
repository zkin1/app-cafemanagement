export interface Order {
    id?: number;
    userId: number;
    tableNumber: number;
    status: 'Solicitado' | 'En proceso' | 'Listo' | 'Cancelado' | 'Entregado';
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
    totalAmount: number;
    paymentMethod?: string;
  }