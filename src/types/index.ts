export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  image?: string;
  description?: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchase?: Date;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'wallet';
  customerId?: string;
  cashierId: string;
  status: 'completed' | 'refunded' | 'held';
  createdAt: Date;
}

export interface Order {
  id: string;
  type: 'purchase' | 'sale';
  supplierId?: string;
  supplierName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'shipped' | 'delivered';
  orderDate: Date;
  expectedDelivery?: Date;
  notes?: string;
  createdAt: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'cashier' | 'manager';
  isActive: boolean;
  lastLogin?: Date;
  permissions: string[];
  salary?: number;
  hireDate: Date;
  createdAt: Date;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
  logo?: string;
}

export interface SystemSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  lowStockThreshold: number;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  lowStockProducts: number;
  totalProducts: number;
  totalCustomers: number;
  monthlyRevenue: number;
}