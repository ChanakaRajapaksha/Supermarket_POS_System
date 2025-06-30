import { create } from 'zustand';
import { InventoryTransaction, Supplier } from '../types';

interface InventoryState {
  transactions: InventoryTransaction[];
  suppliers: Supplier[];
  addTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getTransactionsByProduct: (productId: string) => InventoryTransaction[];
  getTransactionsByType: (type: 'in' | 'out' | 'adjustment') => InventoryTransaction[];
}

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Fresh Foods Distributors',
    email: 'orders@freshfoods.com',
    phone: '+1-555-0101',
    address: '123 Warehouse St, City, State 12345',
    contactPerson: 'John Smith',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Beverage Supply Co.',
    email: 'sales@beveragesupply.com',
    phone: '+1-555-0102',
    address: '456 Distribution Ave, City, State 12345',
    contactPerson: 'Sarah Johnson',
    isActive: true,
    createdAt: new Date('2024-01-20'),
  },
];

const mockTransactions: InventoryTransaction[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Coca Cola 500ml',
    type: 'in',
    quantity: 100,
    previousStock: 50,
    newStock: 150,
    reason: 'Stock replenishment',
    reference: 'PO-2024-001',
    userId: '1',
    userName: 'Admin User',
    createdAt: new Date('2024-01-25'),
  },
  {
    id: '2',
    productId: '3',
    productName: 'Milk 1L',
    type: 'out',
    quantity: 10,
    previousStock: 15,
    newStock: 5,
    reason: 'Sale transaction',
    reference: 'SALE-2024-001',
    userId: '1',
    userName: 'Admin User',
    createdAt: new Date('2024-01-26'),
  },
];

export const useInventoryStore = create<InventoryState>((set, get) => ({
  transactions: mockTransactions,
  suppliers: mockSuppliers,

  addTransaction: (transactionData) => {
    const newTransaction: InventoryTransaction = {
      ...transactionData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ 
      transactions: [newTransaction, ...state.transactions] 
    }));
  },

  addSupplier: (supplierData) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ 
      suppliers: [...state.suppliers, newSupplier] 
    }));
  },

  updateSupplier: (id, updates) => {
    set(state => ({
      suppliers: state.suppliers.map(supplier =>
        supplier.id === id ? { ...supplier, ...updates } : supplier
      ),
    }));
  },

  deleteSupplier: (id) => {
    set(state => ({
      suppliers: state.suppliers.filter(supplier => supplier.id !== id),
    }));
  },

  getTransactionsByProduct: (productId) => {
    const { transactions } = get();
    return transactions.filter(t => t.productId === productId);
  },

  getTransactionsByType: (type) => {
    const { transactions } = get();
    return transactions.filter(t => t.type === type);
  },
}));