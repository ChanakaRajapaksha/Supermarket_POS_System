import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Save, 
  RotateCcw, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Building, 
  Globe,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useInventoryStore } from '../../store/inventoryStore';
import { Supplier } from '../../types';
import toast from 'react-hot-toast';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSupplier?: Supplier | null;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ 
  isOpen, 
  onClose, 
  editingSupplier 
}) => {
  const { addSupplier, updateSupplier } = useInventoryStore();
  
  const [formData, setFormData] = useState({
    name: editingSupplier?.name || '',
    email: editingSupplier?.email || '',
    phone: editingSupplier?.phone || '',
    address: editingSupplier?.address || '',
    contactPerson: editingSupplier?.contactPerson || '',
    website: '',
    taxId: '',
    paymentTerms: '30',
    category: '',
    notes: '',
    isActive: editingSupplier?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Food & Beverages',
    'Dairy Products',
    'Bakery Items',
    'Meat & Seafood',
    'Fruits & Vegetables',
    'Frozen Foods',
    'Household Items',
    'Personal Care',
    'Electronics',
    'Office Supplies',
    'Cleaning Supplies',
    'Other'
  ];

  const paymentTermsOptions = [
    { value: '0', label: 'Cash on Delivery (COD)' },
    { value: '7', label: 'Net 7 days' },
    { value: '15', label: 'Net 15 days' },
    { value: '30', label: 'Net 30 days' },
    { value: '45', label: 'Net 45 days' },
    { value: '60', label: 'Net 60 days' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Supplier name is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      if (editingSupplier) {
        updateSupplier(editingSupplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        addSupplier(formData);
        toast.success('Supplier added successfully');
      }
      handleClose();
    } catch (error) {
      toast.error('Failed to save supplier');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      website: '',
      taxId: '',
      paymentTerms: '30',
      category: '',
      notes: '',
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  const handleReset = () => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name,
        email: editingSupplier.email || '',
        phone: editingSupplier.phone || '',
        address: editingSupplier.address || '',
        contactPerson: editingSupplier.contactPerson || '',
        website: '',
        taxId: '',
        paymentTerms: '30',
        category: '',
        notes: '',
        isActive: editingSupplier.isActive,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        website: '',
        taxId: '',
        paymentTerms: '30',
        category: '',
        notes: '',
        isActive: true,
      });
    }
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingSupplier ? 'Update supplier information' : 'Enter supplier details to add to your network'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Supplier Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                    placeholder="Enter supplier company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                      errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                  )}
                </div>

                <Input
                  label="Tax ID / Registration Number"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="Enter tax ID or registration number"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contact Person *"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  error={errors.contactPerson}
                  placeholder="Primary contact person name"
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  placeholder="contact@supplier.com"
                />

                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={errors.phone}
                  placeholder="+1 (555) 123-4567"
                />

                <Input
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.supplier.com"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Enter complete address including city, state, and postal code"
                />
              </div>
            </div>

            {/* Business Terms */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Business Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    {paymentTermsOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active Supplier
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Additional notes about this supplier (delivery schedules, special terms, etc.)"
                />
              </div>
            </div>

            {/* Supplier Status Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Supplier Status</h3>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  formData.isActive 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {formData.isActive ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                  {formData.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Payment Terms: {paymentTermsOptions.find(opt => opt.value === formData.paymentTerms)?.label}
                </div>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                {formData.isActive 
                  ? 'This supplier will be available for creating purchase orders and managing inventory.'
                  : 'This supplier will be hidden from active operations but data will be preserved.'
                }
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;