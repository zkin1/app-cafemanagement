export interface Inventory {
    id?: number;
    productId: number;
    quantity: number;
    lastRestockedAt?: Date;
  }