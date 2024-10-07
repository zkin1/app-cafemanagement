export interface Table {
    id?: number;
    tableNumber: number;
    capacity: number;
    status: 'Libre' | 'Ocupada' | 'Reservada';
  }