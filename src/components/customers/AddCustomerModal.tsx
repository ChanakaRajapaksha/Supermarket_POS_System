import React, { useState } from 'react';
import { 
  X, 
  User, 
  Save, 
  RotateCcw, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star,
  CreditCard,
  Gift,
  AlertCircle,
  CheckCircle,
  Building,
  Hash,
  Globe,
  FileText,
  Users,
  DollarSign
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useDataStore } from '../../store/dataStore';
import { Customer } from '../../types';
import toast from 'react-hot-toast';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer?: Customer | null;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ 
  isOpen, 
  onClose, 
  editingCustomer 
}) => {
  const { addCustomer, updateCustomer } = useDataStore();
  
  const [formData, setFormData] = useState({
    name: editingCustomer?.name || '',
    email: editingCustomer?.email || '',
    phone: editingCustomer?.phone || '',
    address: editingCustomer?.address || '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    company: '',
    taxId: '',
    website: '',
    preferredContactMethod: 'email' as 'email' | 'phone' | 'sms',
    customerType: 'individual' as 'individual' | 'business',
    loyaltyTier: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum',
    creditLimit: 0,
    paymentTerms: '0',
    discountRate: 0,
    notes: '',
    tags: [] as string[],
    socialMedia: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    },
    preferences: {
      newsletter: true,
      promotions: true,
      smsNotifications: false,
      emailNotifications: true
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const customerTypes = [
    { value: 'individual', label: 'Individual Customer' },
    { value: 'business', label: 'Business Customer' }
  ];

  const loyaltyTiers = [
    { value: 'bronze', label: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'silver', label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'gold', label: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'platinum', label: 'Platinum', color: 'text-purple-600', bg: 'bg-purple-100' }
  ];

  const paymentTermsOptions = [
    { value: '0', label: 'Cash Only' },
    { value: '7', label: 'Net 7 days' },
    { value: '15', label: 'Net 15 days' },
    { value: '30', label: 'Net 30 days' },
    { value: '45', label: 'Net 45 days' },
    { value: '60', label: 'Net 60 days' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (formData.customerType === 'business' && !formData.company.trim()) {
      newErrors.company = 'Company name is required for business customers';
    }
    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative';
    }
    if (formData.discountRate < 0 || formData.discountRate > 100) {
      newErrors.discountRate = 'Discount rate must be between 0-100%';
    }

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
      const customerData = {
        ...formData,
        loyaltyPoints: editingCustomer?.loyaltyPoints || 0,
        totalSpent: editingCustomer?.totalSpent || 0,
        lastPurchase: editingCustomer?.lastPurchase
      };

      if (editingCustomer) {
        updateCustomer(editingCustomer.id, customerData);
        toast.success('Customer updated successfully');
      } else {
        addCustomer(customerData);
        toast.success('Customer added successfully');
      }
      handleClose();
    } catch (error) {
      toast.error('Failed to save customer');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: '',
      occupation: '',
      company: '',
      taxId: '',
      website: '',
      preferredContactMethod: 'email',
      customerType: 'individual',
      loyaltyTier: 'bronze',
      creditLimit: 0,
      paymentTerms: '0',
      discountRate: 0,
      notes: '',
      tags: [],
      socialMedia: {
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: ''
      },
      preferences: {
        newsletter: true,
        promotions: true,
        smsNotifications: false,
        emailNotifications: true
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setErrors({});
    setNewTag('');
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const generateCustomerId = () => {
    const prefix = formData.customerType === 'business' ? 'BUS' : 'IND';
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingCustomer ? 'Update customer information' : 'Create a new customer profile with detailed information'}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Type Selection */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Customer Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, customerType: type.value as any })}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formData.customerType === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label={formData.customerType === 'business' ? 'Contact Person Name *' : 'Full Name *'}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={errors.name}
                      placeholder="Enter full name"
                    />
                  </div>

                  {formData.customerType === 'business' && (
                    <div className="md:col-span-2">
                      <Input
                        label="Company Name *"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        error={errors.company}
                        placeholder="Enter company name"
                      />
                    </div>
                  )}

                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    placeholder="customer@email.com"
                  />

                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                    placeholder="+1 (555) 123-4567"
                  />

                  {formData.customerType === 'individual' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>

                      <Input
                        label="Occupation"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="Enter occupation"
                      />
                    </>
                  )}

                  {formData.customerType === 'business' && (
                    <>
                      <Input
                        label="Tax ID / Registration Number"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="Enter tax ID"
                      />

                      <Input
                        label="Website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://www.company.com"
                      />
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>

              {/* Business Terms */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Business Terms
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loyalty Tier
                    </label>
                    <select
                      value={formData.loyaltyTier}
                      onChange={(e) => setFormData({ ...formData, loyaltyTier: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {loyaltyTiers.map(tier => (
                        <option key={tier.value} value={tier.value}>{tier.label}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Credit Limit ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    error={errors.creditLimit}
                    placeholder="0.00"
                  />

                  <Input
                    label="Discount Rate (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                    error={errors.discountRate}
                    placeholder="0.0"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {paymentTermsOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Preferences */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Contact Method
                    </label>
                    <select
                      value={formData.preferredContactMethod}
                      onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Notification Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.newsletter}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, newsletter: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Newsletter subscription</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.promotions}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, promotions: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Promotional offers</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.emailNotifications}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, emailNotifications: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.smsNotifications}
                        onChange={(e) => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, smsNotifications: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">SMS notifications</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {formData.customerType === 'individual' && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Contact Name"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                      })}
                      placeholder="Emergency contact name"
                    />

                    <Input
                      label="Contact Phone"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                      })}
                      placeholder="Emergency contact phone"
                    />

                    <Input
                      label="Relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                      })}
                      placeholder="e.g., Spouse, Parent, Friend"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-6">
              {/* Customer Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Customer Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Type:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300 capitalize">
                      {formData.customerType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Loyalty Tier:</span>
                    <span className={`font-medium capitalize ${
                      loyaltyTiers.find(t => t.value === formData.loyaltyTier)?.color
                    }`}>
                      {formData.loyaltyTier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Credit Limit:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300">
                      ${formData.creditLimit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Discount Rate:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300">
                      {formData.discountRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Payment Terms:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300">
                      {paymentTermsOptions.find(p => p.value === formData.paymentTerms)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Tags */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Hash className="w-4 h-4 mr-2" />
                  Customer Tags
                </h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <Button size="sm" onClick={addTag} disabled={!newTag.trim()}>
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Social Media
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Facebook"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                    })}
                    placeholder="Facebook profile URL"
                  />
                  <Input
                    label="Twitter"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                    })}
                    placeholder="Twitter handle"
                  />
                  <Input
                    label="LinkedIn"
                    value={formData.socialMedia.linkedin}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, linkedin: e.target.value }
                    })}
                    placeholder="LinkedIn profile URL"
                  />
                  <Input
                    label="Instagram"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                    })}
                    placeholder="Instagram handle"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notes
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Additional notes about this customer..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (editingCustomer) {
                    setFormData({
                      name: editingCustomer.name,
                      email: editingCustomer.email || '',
                      phone: editingCustomer.phone || '',
                      address: editingCustomer.address || '',
                      dateOfBirth: '',
                      gender: '',
                      occupation: '',
                      company: '',
                      taxId: '',
                      website: '',
                      preferredContactMethod: 'email',
                      customerType: 'individual',
                      loyaltyTier: 'bronze',
                      creditLimit: 0,
                      paymentTerms: '0',
                      discountRate: 0,
                      notes: '',
                      tags: [],
                      socialMedia: {
                        facebook: '',
                        twitter: '',
                        linkedin: '',
                        instagram: ''
                      },
                      preferences: {
                        newsletter: true,
                        promotions: true,
                        smsNotifications: false,
                        emailNotifications: true
                      },
                      emergencyContact: {
                        name: '',
                        phone: '',
                        relationship: ''
                      }
                    });
                  } else {
                    handleClose();
                  }
                  setErrors({});
                }}
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
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;