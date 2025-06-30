import { create } from 'zustand';
import { CartItem, Product, Sale, Customer } from '../types';

interface POSState {
  cart: CartItem[];
  currentCustomer: Customer | null;
  heldBills: Sale[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  holdBill: () => void;
  resumeBill: (billId: string) => void;
  getCartTotal: () => { subtotal: number; tax: number; total: number };
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  currentCustomer: null,
  heldBills: [],
  
  addToCart: (product: Product, quantity = 1) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        cart: [...cart, { product, quantity, discount: 0 }],
      });
    }
  },
  
  removeFromCart: (productId: string) => {
    set(state => ({
      cart: state.cart.filter(item => item.product.id !== productId),
    }));
  },
  
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    set(state => ({
      cart: state.cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },
  
  applyDiscount: (productId: string, discount: number) => {
    set(state => ({
      cart: state.cart.map(item =>
        item.product.id === productId ? { ...item, discount } : item
      ),
    }));
  },
  
  clearCart: () => {
    set({ cart: [], currentCustomer: null });
  },
  
  setCustomer: (customer: Customer | null) => {
    set({ currentCustomer: customer });
  },
  
  holdBill: () => {
    const { cart, currentCustomer } = get();
    if (cart.length === 0) return;
    
    const { subtotal, tax, total } = get().getCartTotal();
    const heldBill: Sale = {
      id: `held-${Date.now()}`,
      items: cart,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod: 'cash',
      customerId: currentCustomer?.id,
      cashierId: '1',
      status: 'held',
      createdAt: new Date(),
    };
    
    set(state => ({
      heldBills: [...state.heldBills, heldBill],
      cart: [],
      currentCustomer: null,
    }));
  },
  
  resumeBill: (billId: string) => {
    const { heldBills } = get();
    const bill = heldBills.find(b => b.id === billId);
    if (!bill) return;
    
    set(state => ({
      cart: bill.items,
      currentCustomer: bill.customerId ? null : null, // Would fetch customer by ID
      heldBills: state.heldBills.filter(b => b.id !== billId),
    }));
  },
  
  getCartTotal: () => {
    const { cart } = get();
    let subtotal = 0;
    let tax = 0;
    
    cart.forEach(item => {
      const itemTotal = item.product.price * item.quantity;
      const discountAmount = (itemTotal * item.discount) / 100;
      const itemSubtotal = itemTotal - discountAmount;
      
      subtotal += itemSubtotal;
      tax += (itemSubtotal * item.product.taxRate) / 100;
    });
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100,
    };
  },
}));