import { create } from 'zustand';
import { BusinessSettings, SystemSettings } from '../types';

interface SettingsState {
  businessSettings: BusinessSettings;
  systemSettings: SystemSettings;
  updateBusinessSettings: (updates: Partial<BusinessSettings>) => void;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;
  resetToDefaults: () => void;
}

const defaultBusinessSettings: BusinessSettings = {
  businessName: 'SuperPOS Market',
  address: '123 Main Street, City, State 12345',
  phone: '+1-555-0100',
  email: 'info@superpos.com',
  taxId: 'TAX123456789',
  currency: 'USD',
  taxRate: 10,
  receiptFooter: 'Thank you for shopping with us!',
};

const defaultSystemSettings: SystemSettings = {
  theme: 'light',
  language: 'en',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'en-US',
  lowStockThreshold: 10,
  autoBackup: true,
  backupFrequency: 'daily',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  businessSettings: defaultBusinessSettings,
  systemSettings: defaultSystemSettings,

  updateBusinessSettings: (updates) => {
    set(state => ({
      businessSettings: { ...state.businessSettings, ...updates }
    }));
  },

  updateSystemSettings: (updates) => {
    set(state => ({
      systemSettings: { ...state.systemSettings, ...updates }
    }));
  },

  resetToDefaults: () => {
    set({
      businessSettings: defaultBusinessSettings,
      systemSettings: defaultSystemSettings,
    });
  },
}));