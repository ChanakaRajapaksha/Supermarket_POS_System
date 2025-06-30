import { create } from 'zustand';
import { Order } from '../types';

interface OrderState {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrdersByType: (type: 'purchase' | 'sale') => Order[];
}

const mockOrders: Order[] = [
  {
    id: '1',
    type: 'purchase',
    supplierId: '1',
    supplierName: 'Fresh Foods Distributors',
    items: [
      {
        productId: '1',
        productName: 'Coca Cola 500ml',
        quantity: 100,
        unitPrice: 1.80,
        total: 180.00,
      },
      {
        productId: '2',
        productName: 'Bread Loaf White',
        quantity: 50,
        unitPrice: 2.10,
        total: 105.00,
      },
    ],
    subtotal: 285.00,
    tax: 28.50,
    total: 313.50,
    status: 'completed',
    orderDate: new Date('2024-01-20'),
    expectedDelivery: new Date('2024-01-25'),
    notes: 'Regular weekly order',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    type: 'purchase',
    supplierId: '2',
    supplierName: 'Beverage Supply Co.',
    items: [
      {
        productId: '1',
        productName: 'Coca Cola 500ml',
        quantity: 200,
        unitPrice: 1.75,
        total: 350.00,
      },
    ],
    subtotal: 350.00,
    tax: 35.00,
    total: 385.00,
    status: 'pending',
    orderDate: new Date('2024-01-26'),
    expectedDelivery: new Date('2024-01-30'),
    notes: 'Bulk order for promotion',
    createdAt: new Date('2024-01-26'),
  },
];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: mockOrders,

  addOrder: (orderData) => {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ 
      orders: [newOrder, ...state.orders] 
    }));
  },

  updateOrder: (id, updates) => {
    set(state => ({
      orders: state.orders.map(order =>
        order.id === id ? { ...order, ...updates } : order
      ),
    }));
  },

  deleteOrder: (id) => {
    set(state => ({
      orders: state.orders.filter(order => order.id !== id),
    }));
  },

  getOrdersByStatus: (status) => {
    const { orders } = get();
    return orders.filter(order => order.status === status);
  },

  getOrdersByType: (type) => {
    const { orders } = get();
    return orders.filter(order => order.type === type);
  },
}));