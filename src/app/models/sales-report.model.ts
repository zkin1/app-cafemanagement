export interface SalesReport {
    id?: number;
    date: string;
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProduct: number;
    generatedBy: number;
    createdAt?: string;
  }