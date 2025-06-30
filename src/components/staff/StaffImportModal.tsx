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
  Shield,
  DollarSign,
  User,
  Building,
  Calendar,
  Key,
  UserCheck
} from 'lucide-react';
import Button from '../ui/Button';
import { useStaffStore } from '../../store/staffStore';
import { StaffMember } from '../../types';
import toast from 'react-hot-toast';

interface StaffImportModalProps {
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
  valid: Omit<StaffMember, 'id' | 'createdAt'>[];
  errors: ImportError[];
  total: number;
  duplicates: string[];
}

const StaffImportModal: React.FC<StaffImportModalProps> = ({ isOpen, onClose }) => {
  const { staff, addStaff } = useStaffStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateEmails: true,
    validatePhones: true,
    autoGeneratePasswords: true,
    requireRole: true,
    requireHireDate: true,
    defaultRole: 'cashier' as 'admin' | 'manager' | 'cashier',
    defaultPermissions: ['sales'],
    validateSalary: true,
    requireContactInfo: false
  });

  const sampleData = [
    {
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1-555-0101',
      role: 'cashier',
      salary: 35000,
      hireDate: '2024-01-15',
      isActive: true,
      permissions: 'sales,customers',
      department: 'Sales',
      employmentType: 'full-time',
      position: 'Sales Associate'
    },
    {
      name: 'Jane Manager',
      email: 'jane.manager@company.com',
      phone: '+1-555-0102',
      role: 'manager',
      salary: 65000,
      hireDate: '2023-06-01',
      isActive: true,
      permissions: 'sales,products,inventory,customers,reports',
      department: 'Management',
      employmentType: 'full-time',
      position: 'Store Manager'
    },
    {
      name: 'Bob Admin',
      email: 'bob.admin@company.com',
      phone: '+1-555-0103',
      role: 'admin',
      salary: 75000,
      hireDate: '2023-01-01',
      isActive: true,
      permissions: 'all',
      department: 'IT',
      employmentType: 'full-time',
      position: 'System Administrator'
    }
  ];

  const validateImportData = (data: any[]): ImportPreview => {
    const valid: Omit<StaffMember, 'id' | 'createdAt'>[] = [];
    const errors: ImportError[] = [];
    const duplicates: string[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header row and 0-based index
      const rowErrors: ImportError[] = [];
      
      // Required field validation
      if (!row.name?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Staff name is required', value: row.name });
      }
      
      // Email validation
      if (row.email) {
        if (importOptions.validateEmails && !/\S+@\S+\.\S+/.test(row.email)) {
          rowErrors.push({ row: rowNumber, field: 'email', message: 'Invalid email format', value: row.email });
        }
        // Check for duplicate emails
        const existingStaff = staff.find(s => s.email === row.email);
        if (existingStaff) {
          duplicates.push(`Row ${rowNumber}: Email ${row.email} already exists`);
          if (!importOptions.skipDuplicates && !importOptions.updateExisting) {
            rowErrors.push({ row: rowNumber, field: 'email', message: 'Email already exists', value: row.email });
          }
        }
      } else if (importOptions.requireContactInfo) {
        rowErrors.push({ row: rowNumber, field: 'email', message: 'Email is required', value: row.email });
      }
      
      // Phone validation
      if (row.phone) {
        if (importOptions.validatePhones && !/^[\+]?[1-9][\d]{0,15}$/.test(row.phone.replace(/[\s\-\(\)]/g, ''))) {
          rowErrors.push({ row: rowNumber, field: 'phone', message: 'Invalid phone format', value: row.phone });
        }
      } else if (importOptions.requireContactInfo) {
        rowErrors.push({ row: rowNumber, field: 'phone', message: 'Phone number is required', value: row.phone });
      }
      
      // Role validation
      const role = row.role || importOptions.defaultRole;
      if (importOptions.requireRole && !['admin', 'manager', 'cashier'].includes(role)) {
        rowErrors.push({ row: rowNumber, field: 'role', message: 'Role must be admin, manager, or cashier', value: row.role });
      }
      
      // Salary validation
      const salary = parseFloat(row.salary) || 0;
      if (row.salary && importOptions.validateSalary) {
        if (isNaN(salary) || salary < 0) {
          rowErrors.push({ row: rowNumber, field: 'salary', message: 'Salary must be a non-negative number', value: row.salary });
        }
        if (salary > 0 && salary < 15000) {
          rowErrors.push({ row: rowNumber, field: 'salary', message: 'Salary seems unusually low (below $15,000)', value: row.salary });
        }
        if (salary > 200000) {
          rowErrors.push({ row: rowNumber, field: 'salary', message: 'Salary seems unusually high (above $200,000)', value: row.salary });
        }
      }
      
      // Hire date validation
      let hireDate: Date;
      if (row.hireDate) {
        hireDate = new Date(row.hireDate);
        if (isNaN(hireDate.getTime())) {
          rowErrors.push({ row: rowNumber, field: 'hireDate', message: 'Invalid hire date format', value: row.hireDate });
          hireDate = new Date(); // Default to today
        }
        if (hireDate > new Date()) {
          rowErrors.push({ row: rowNumber, field: 'hireDate', message: 'Hire date cannot be in the future', value: row.hireDate });
        }
      } else if (importOptions.requireHireDate) {
        rowErrors.push({ row: rowNumber, field: 'hireDate', message: 'Hire date is required', value: row.hireDate });
        hireDate = new Date(); // Default to today
      } else {
        hireDate = new Date(); // Default to today
      }
      
      // Permissions validation
      let permissions: string[] = importOptions.defaultPermissions;
      if (row.permissions) {
        if (typeof row.permissions === 'string') {
          permissions = row.permissions.split(',').map(p => p.trim()).filter(p => p);
        } else if (Array.isArray(row.permissions)) {
          permissions = row.permissions;
        }
        
        // Validate permissions based on role
        const validPermissions = ['sales', 'products', 'inventory', 'customers', 'orders', 'staff', 'reports', 'settings', 'all'];
        const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
        if (invalidPermissions.length > 0) {
          rowErrors.push({ row: rowNumber, field: 'permissions', message: `Invalid permissions: ${invalidPermissions.join(', ')}`, value: row.permissions });
        }
      }
      
      // Role-based permission validation
      if (role === 'admin' && !permissions.includes('all')) {
        permissions = ['all']; // Admin should have all permissions
      } else if (role === 'cashier' && permissions.includes('all')) {
        rowErrors.push({ row: rowNumber, field: 'permissions', message: 'Cashier role cannot have all permissions', value: row.permissions });
      }
      
      if (rowErrors.length === 0) {
        valid.push({
          name: row.name.trim(),
          email: row.email?.trim() || '',
          phone: row.phone?.trim() || undefined,
          role: role as 'admin' | 'manager' | 'cashier',
          isActive: row.isActive !== false && row.isActive !== 'false',
          lastLogin: undefined,
          permissions,
          salary: salary || undefined,
          hireDate
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
      
      importPreview.valid.forEach(staffData => {
        const existingStaff = staff.find(s => s.email === staffData.email);
        
        if (existingStaff) {
          if (importOptions.updateExisting) {
            // Update existing staff logic would go here
            updatedCount++;
          } else if (importOptions.skipDuplicates) {
            skippedCount++;
          }
        } else {
          addStaff(staffData);
          importedCount++;
        }
      });
      
      let message = `Import completed: ${importedCount} new staff members added`;
      if (skippedCount > 0) message += `, ${skippedCount} duplicates skipped`;
      if (updatedCount > 0) message += `, ${updatedCount} staff updated`;
      
      toast.success(message);
      onClose();
    } catch (error) {
      toast.error('Failed to import staff members');
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
    a.download = 'staff_import_template.csv';
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
                Import Staff Members
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a CSV or JSON file to import staff members in bulk
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
              <li>• Optional fields: email, phone, role, salary, hireDate, permissions, isActive</li>
              <li>• Valid roles: admin, manager, cashier</li>
              <li>• Permissions: comma-separated list (sales,products,inventory,customers,orders,staff,reports,settings,all)</li>
              <li>• Dates should be in YYYY-MM-DD format</li>
              <li>• Email addresses must be unique</li>
              <li>• Salary should be annual amount without currency symbols</li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Download Template</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get a sample CSV file with the correct format and example staff data
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">Skip duplicate staff members</span>
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">Update existing staff members</span>
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

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.validateSalary}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      validateSalary: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Validate salary ranges</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.requireRole}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      requireRole: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require role assignment</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.requireHireDate}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      requireHireDate: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require hire date</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.requireContactInfo}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      requireContactInfo: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Require contact information</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.autoGeneratePasswords}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      autoGeneratePasswords: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-generate passwords</span>
                </label>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Default role:</span>
                  <select
                    value={importOptions.defaultRole}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      defaultRole: e.target.value as any
                    })}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
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
                    Duplicate Staff Members Found ({importPreview.duplicates.length})
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
                      {importPreview.valid.slice(0, 5).map((staff, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300">{staff.name}</p>
                              <div className="flex items-center space-x-4 text-xs text-green-600 dark:text-green-400">
                                {staff.email && (
                                  <span className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {staff.email}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Shield className="w-3 h-3 mr-1" />
                                  {staff.role}
                                </span>
                                {staff.salary && (
                                  <span className="flex items-center">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    ${staff.salary.toLocaleString()}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {staff.hireDate.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              staff.role === 'admin' ? 'bg-red-100 text-red-800' :
                              staff.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {staff.role}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {staff.permissions.includes('all') ? 'All Access' : `${staff.permissions.length} perms`}
                            </span>
                          </div>
                        </div>
                      ))}
                      {importPreview.valid.length > 5 && (
                        <p className="text-green-600 dark:text-green-400 text-center py-2">
                          ... and {importPreview.valid.length - 5} more staff members
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          {importPreview && importPreview.valid.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                <div>
                  <h3 className="font-medium text-yellow-900 dark:text-yellow-300">Security Notice</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    New staff members will be created with system access. 
                    {importOptions.autoGeneratePasswords && ' Temporary passwords will be generated and should be changed on first login.'}
                    Ensure all imported staff members are authorized to access the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {importPreview && (
                <span>
                  Ready to import {importPreview.valid.length} valid staff members
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
                    Import {importPreview?.valid.length || 0} Staff Members
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

export default StaffImportModal;