import { create } from 'zustand';
import { StaffMember } from '../types';

interface StaffState {
  staff: StaffMember[];
  addStaff: (staff: Omit<StaffMember, 'id' | 'createdAt'>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  getStaffByRole: (role: 'admin' | 'cashier' | 'manager') => StaffMember[];
  toggleStaffStatus: (id: string) => void;
}

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@pos.com',
    phone: '+1-555-0001',
    role: 'admin',
    isActive: true,
    lastLogin: new Date(),
    permissions: ['all'],
    salary: 5000,
    hireDate: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    name: 'Jane Cashier',
    email: 'jane@pos.com',
    phone: '+1-555-0002',
    role: 'cashier',
    isActive: true,
    lastLogin: new Date('2024-01-25'),
    permissions: ['sales', 'customers'],
    salary: 2500,
    hireDate: new Date('2023-06-15'),
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '3',
    name: 'Bob Manager',
    email: 'bob@pos.com',
    phone: '+1-555-0003',
    role: 'manager',
    isActive: true,
    lastLogin: new Date('2024-01-24'),
    permissions: ['sales', 'products', 'inventory', 'customers', 'reports'],
    salary: 4000,
    hireDate: new Date('2023-03-10'),
    createdAt: new Date('2023-03-10'),
  },
];

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: mockStaff,

  addStaff: (staffData) => {
    const newStaff: StaffMember = {
      ...staffData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ 
      staff: [...state.staff, newStaff] 
    }));
  },

  updateStaff: (id, updates) => {
    set(state => ({
      staff: state.staff.map(member =>
        member.id === id ? { ...member, ...updates } : member
      ),
    }));
  },

  deleteStaff: (id) => {
    set(state => ({
      staff: state.staff.filter(member => member.id !== id),
    }));
  },

  getStaffByRole: (role) => {
    const { staff } = get();
    return staff.filter(member => member.role === role);
  },

  toggleStaffStatus: (id) => {
    set(state => ({
      staff: state.staff.map(member =>
        member.id === id ? { ...member, isActive: !member.isActive } : member
      ),
    }));
  },
}));