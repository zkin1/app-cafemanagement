export interface OrderDetail {
    id?: number;
    orderId: number;
    productId: number;
    quantity: number;
    size?: string;
    milkType?: string;
    price: number;
  }