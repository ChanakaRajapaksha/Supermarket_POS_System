import { create } from 'zustand';
import { Product, Customer, Order, DashboardStats } from '../types';

interface DataState {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  dashboardStats: DashboardStats;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  searchProducts: (query: string) => Product[];
  getLowStockProducts: () => Product[];
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Coca Cola 500ml',
    sku: 'CCL-500',
    barcode: '1234567890123',
    price: 2.50,
    costPrice: 1.80,
    category: 'Beverages',
    brand: 'Coca Cola',
    stock: 150,
    minStock: 20,
    taxRate: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Bread Loaf White',
    sku: 'BRD-WHT',
    barcode: '2345678901234',
    price: 3.20,
    costPrice: 2.10,
    category: 'Bakery',
    brand: 'Fresh Bakery',
    stock: 25,
    minStock: 10,
    taxRate: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Milk 1L',
    sku: 'MLK-1L',
    barcode: '3456789012345',
    price: 4.50,
    costPrice: 3.20,
    category: 'Dairy',
    brand: 'Farm Fresh',
    stock: 5,
    minStock: 15,
    taxRate: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Jane Smith',
    email: 'jane@email.com',
    phone: '+1234567890',
    loyaltyPoints: 150,
    totalSpent: 450.00,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Bob Johnson',
    email: 'bob@email.com',
    phone: '+1234567891',
    loyaltyPoints: 75,
    totalSpent: 220.00,
    createdAt: new Date(),
  },
];

export const useDataStore = create<DataState>((set, get) => ({
  products: mockProducts,
  customers: mockCustomers,
  orders: [],
  dashboardStats: {
    todaySales: 1250.75,
    todayTransactions: 42,
    lowStockProducts: 1,
    totalProducts: mockProducts.length,
    totalCustomers: mockCustomers.length,
    monthlyRevenue: 15420.50,
  },
  
  addProduct: (productData) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set(state => ({ products: [...state.products, newProduct] }));
  },
  
  updateProduct: (id, updates) => {
    set(state => ({
      products: state.products.map(product =>
        product.id === id
          ? { ...product, ...updates, updatedAt: new Date() }
          : product
      ),
    }));
  },
  
  deleteProduct: (id) => {
    set(state => ({
      products: state.products.filter(product => product.id !== id),
    }));
  },
  
  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ customers: [...state.customers, newCustomer] }));
  },
  
  updateCustomer: (id, updates) => {
    set(state => ({
      customers: state.customers.map(customer =>
        customer.id === id ? { ...customer, ...updates } : customer
      ),
    }));
  },
  
  deleteCustomer: (id) => {
    set(state => ({
      customers: state.customers.filter(customer => customer.id !== id),
    }));
  },
  
  searchProducts: (query) => {
    const { products } = get();
    if (!query) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase()) ||
      product.barcode.includes(query)
    );
  },
  
  getLowStockProducts: () => {
    const { products } = get();
    return products.filter(product => product.stock <= product.minStock);
  },
}));