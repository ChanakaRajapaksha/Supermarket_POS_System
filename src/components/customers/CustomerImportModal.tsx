import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Save,
  AlertTriangle,
  Download,
  Users,
  Mail,
  Phone,
  Star,
  DollarSign,
  User,
  Building
} from 'lucide-react';
import Button from '../ui/Button';
import { useDataStore } from '../../store/dataStore';
import { Customer } from '../../types';
import toast from 'react-hot-toast';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ImportPreview {
  valid: Omit<Customer, 'id' | 'createdAt'>[];
  errors: ImportError[];
  total: number;
  duplicates: string[];
}

const CustomerImportModal: React.FC<CustomerImportModalProps> = ({ isOpen, onClose }) => {
  const { customers, addCustomer } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateEmails: true,
    validatePhones: true,
    autoAssignLoyalty: true,
    defaultLoyaltyPoints: 0,
    requireEmail: false,
    requirePhone: false
  });

  const sampleData = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0101',
      address: '123 Main St, City, State 12345',
      loyaltyPoints: 150,
      totalSpent: 450.75,
      lastPurchase: '2024-01-20',
      customerType: 'individual',
      loyaltyTier: 'silver',
      notes: 'Preferred customer'
    },
    {
      name: 'ABC Corporation',
      email: 'orders@abccorp.com',
      phone: '+1-555-0102',
      address: '456 Business Ave, City, State 12345',
      loyaltyPoints: 500,
      totalSpent: 2500.00,
      lastPurchase: '2024-01-25',
      customerType: 'business',
      loyaltyTier: 'gold',
      contactPerson: 'Jane Doe',
      taxId: 'TAX123456',
      notes: 'Corporate account'
    }
  ];

  const validateImportData = (data: any[]): ImportPreview => {
    const valid: Omit<Customer, 'id' | 'createdAt'>[] = [];
    const errors: ImportError[] = [];
    const duplicates: string[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header row and 0-based index
      const rowErrors: ImportError[] = [];
      
      // Required field validation
      if (!row.name?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Customer name is required', value: row.name });
      }
      
      // Email validation
      if (row.email) {
        if (importOptions.validateEmails && !/\S+@\S+\.\S+/.test(row.email)) {
          rowErrors.push({ row: rowNumber, field: 'email', message: 'Invalid email format', value: row.email });
        }
        // Check for duplicate emails
        const existingCustomer = customers.find(c => c.email === row.email);
        if (existingCustomer) {
          duplicates.push(`Row ${rowNumber}: Email ${row.email} already exists`);
          if (!importOptions.skipDuplicates && !importOptions.updateExisting) {
            rowErrors.push({ row: rowNumber, field: 'email', message: 'Email already exists', value: row.email });
          }
        }
      } else if (importOptions.requireEmail) {
        rowErrors.push({ row: rowNumber, field: 'email', message: 'Email is required', value: row.email });
      }
      
      // Phone validation
      if (row.phone) {
        if (importOptions.validatePhones && !/^[\+]?[1-9][\d]{0,15}$/.test(row.phone.replace(/[\s\-\(\)]/g, ''))) {
          rowErrors.push({ row: rowNumber, field: 'phone', message: 'Invalid phone format', value: row.phone });
        }
      } else if (importOptions.requirePhone) {
        rowErrors.push({ row: rowNumber, field: 'phone', message: 'Phone number is required', value: row.phone });
      }
      
      // Numeric validation
      const loyaltyPoints = parseInt(row.loyaltyPoints) || importOptions.defaultLoyaltyPoints;
      const totalSpent = parseFloat(row.totalSpent) || 0;
      
      if (row.loyaltyPoints && (isNaN(loyaltyPoints) || loyaltyPoints < 0)) {
        rowErrors.push({ row: rowNumber, field: 'loyaltyPoints', message: 'Loyalty points must be a non-negative number', value: row.loyaltyPoints });
      }
      if (row.totalSpent && (isNaN(totalSpent) || totalSpent < 0)) {
        rowErrors.push({ row: rowNumber, field: 'totalSpent', message: 'Total spent must be a non-negative number', value: row.totalSpent });
      }
      
      // Date validation
      let lastPurchase: Date | undefined;
      if (row.lastPurchase) {
        lastPurchase = new Date(row.lastPurchase);
        if (isNaN(lastPurchase.getTime())) {
          rowErrors.push({ row: rowNumber, field: 'lastPurchase', message: 'Invalid date format', value: row.lastPurchase });
          lastPurchase = undefined;
        }
      }
      
      if (rowErrors.length === 0) {
        valid.push({
          name: row.name.trim(),
          email: row.email?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          address: row.address?.trim() || undefined,
          loyaltyPoints,
          totalSpent,
          lastPurchase
        });
      } else {
        errors.push(...rowErrors);
      }
    });
    
    return { valid, errors, total: data.length, duplicates };
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      let data: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format');
      }
      
      const preview = validateImportData(data);
      setImportPreview(preview);
    } catch (error) {
      toast.error('Failed to parse file. Please check the format.');
      setImportFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!importPreview?.valid.length) return;
    
    setIsProcessing(true);
    
    try {
      let importedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;
      
      importPreview.valid.forEach(customerData => {
        const existingCustomer = customers.find(c => c.email === customerData.email);
        
        if (existingCustomer) {
          if (importOptions.updateExisting) {
            // Update existing customer logic would go here
            updatedCount++;
          } else if (importOptions.skipDuplicates) {
            skippedCount++;
          }
        } else {
          addCustomer(customerData);
          importedCount++;
        }
      });
      
      let message = `Import completed: ${importedCount} new customers added`;
      if (skippedCount > 0) message += `, ${skippedCount} duplicates skipped`;
      if (updatedCount > 0) message += `, ${updatedCount} customers updated`;
      
      toast.success(message);
      onClose();
    } catch (error) {
      toast.error('Failed to import customers');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadTemplate = () => {
    const content = generateCSV(sampleData);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import Customers
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a CSV or JSON file to import customers in bulk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Import Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Import Instructions</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Supported formats: CSV, JSON</li>
              <li>• Required fields: <strong>name</strong></li>
              <li>• Optional fields: email, phone, address, loyaltyPoints, totalSpent, lastPurchase</li>
              <li>• Email addresses must be unique (duplicates will be handled based on your settings)</li>
              <li>• Dates should be in YYYY-MM-DD format</li>
              <li>• Numbers should not contain currency symbols or commas</li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Download Template</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get a sample CSV file with the correct format and example data
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Import Options */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Import Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicates}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      skipDuplicates: e.target.checked,
                      updateExisting: e.target.checked ? false : importOptions.updateExisting
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Skip duplicate customers</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.updateExisting}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      updateExisting: e.target.checked,
                      skipDuplicates: e.target.checked ? false : importOptions.skipDuplicates
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Update existing customers</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.validateEmails}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      validateEmails: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Validate email addresses</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.validatePhones}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      validatePhones: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Validate phone numbers</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.requireEmail}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      requireEmail: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require email address</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.requirePhone}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      requirePhone: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require phone number</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.autoAssignLoyalty}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      autoAssignLoyalty: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-assign loyalty points</span>
                </label>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Default loyalty points:</span>
                  <input
                    type="number"
                    min="0"
                    value={importOptions.defaultLoyaltyPoints}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      defaultLoyaltyPoints: parseInt(e.target.value) || 0
                    })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {importFile ? importFile.name : 'Choose a file to import'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    CSV or JSON files up to 10MB
                  </p>
                </div>
                <div className="mt-4 flex justify-center space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select File
                      </>
                    )}
                  </Button>
                  {importFile && (
                    <Button variant="secondary" onClick={resetImport}>
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Import Preview */}
          {importPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-300">Valid Records</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {importPreview.valid.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-300">Errors</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {importPreview.errors.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-300">Total Records</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {importPreview.total}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duplicates Warning */}
              {importPreview.duplicates.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 dark:text-orange-300 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Duplicate Customers Found ({importPreview.duplicates.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importPreview.duplicates.slice(0, 5).map((duplicate, index) => (
                      <div key={index} className="text-sm text-orange-800 dark:text-orange-300">
                        {duplicate}
                      </div>
                    ))}
                    {importPreview.duplicates.length > 5 && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        ... and {importPreview.duplicates.length - 5} more duplicates
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {importPreview.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 dark:text-red-300 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Import Errors ({importPreview.errors.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importPreview.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-800 dark:text-red-300">
                        <span className="font-medium">Row {error.row}:</span> {error.message} 
                        <span className="text-red-600 dark:text-red-400"> ({error.field}: "{error.value}")</span>
                      </div>
                    ))}
                    {importPreview.errors.length > 10 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        ... and {importPreview.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Valid Records Preview */}
              {importPreview.valid.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 dark:text-green-300 mb-3 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Valid Records ({importPreview.valid.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {importPreview.valid.slice(0, 5).map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300">{customer.name}</p>
                              <div className="flex items-center space-x-4 text-xs text-green-600 dark:text-green-400">
                                {customer.email && (
                                  <span className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {customer.email}
                                  </span>
                                )}
                                {customer.phone && (
                                  <span className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {customer.phone}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Star className="w-3 h-3 mr-1" />
                                  {customer.loyaltyPoints} pts
                                </span>
                                <span className="flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  ${customer.totalSpent.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {importPreview.valid.length > 5 && (
                        <p className="text-green-600 dark:text-green-400 text-center py-2">
                          ... and {importPreview.valid.length - 5} more customers
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {importPreview && (
                <span>
                  Ready to import {importPreview.valid.length} valid customers
                  {importPreview.errors.length > 0 && ` (${importPreview.errors.length} errors to fix)`}
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importPreview?.valid.length || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Import {importPreview?.valid.length || 0} Customers
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerImportModal;