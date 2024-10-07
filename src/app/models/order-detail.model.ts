export interface OrderDetail {
  id?: number;
  orderId: number;
  productId: number;
  quantity: number;
  size?: string;
  milkType?: string;
  price: number;
  name?: string;
  image?: string;
  selectedSize?: string;
  selectedMilk?: string;
  finalPrice?: number;
}