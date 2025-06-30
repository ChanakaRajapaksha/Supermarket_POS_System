import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Save,
  AlertTriangle
} from 'lucide-react';
import Button from '../ui/Button';
import { useDataStore } from '../../store/dataStore';
import { Product } from '../../types';
import toast from 'react-hot-toast';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

interface ImportPreview {
  valid: Product[];
  errors: ImportError[];
  total: number;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, mode }) => {
  const { products, addProduct, updateProduct } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportOptions, setExportOptions] = useState({
    includeInactive: false,
    includeImages: false,
    selectedFields: {
      name: true,
      sku: true,
      barcode: true,
      price: true,
      costPrice: true,
      category: true,
      brand: true,
      stock: true,
      minStock: true,
      taxRate: true,
      description: false,
      isActive: true,
    }
  });

  const sampleData = [
    {
      name: 'Sample Product 1',
      sku: 'SAM-001',
      barcode: '1234567890123',
      price: 9.99,
      costPrice: 6.50,
      category: 'Beverages',
      brand: 'Sample Brand',
      stock: 100,
      minStock: 10,
      taxRate: 10,
      description: 'Sample product description',
      isActive: true
    },
    {
      name: 'Sample Product 2',
      sku: 'SAM-002',
      barcode: '2345678901234',
      price: 15.99,
      costPrice: 10.00,
      category: 'Snacks',
      brand: 'Another Brand',
      stock: 50,
      minStock: 5,
      taxRate: 10,
      description: 'Another sample product',
      isActive: true
    }
  ];

  const validateImportData = (data: any[]): ImportPreview => {
    const valid: Product[] = [];
    const errors: ImportError[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header row and 0-based index
      const rowErrors: ImportError[] = [];
      
      // Required field validation
      if (!row.name?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Product name is required', value: row.name });
      }
      if (!row.sku?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'sku', message: 'SKU is required', value: row.sku });
      }
      if (!row.barcode?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'barcode', message: 'Barcode is required', value: row.barcode });
      }
      if (!row.category?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'category', message: 'Category is required', value: row.category });
      }
      if (!row.brand?.trim()) {
        rowErrors.push({ row: rowNumber, field: 'brand', message: 'Brand is required', value: row.brand });
      }
      
      // Numeric validation
      const price = parseFloat(row.price);
      const costPrice = parseFloat(row.costPrice);
      const stock = parseInt(row.stock);
      const minStock = parseInt(row.minStock);
      const taxRate = parseFloat(row.taxRate);
      
      if (isNaN(price) || price <= 0) {
        rowErrors.push({ row: rowNumber, field: 'price', message: 'Price must be a positive number', value: row.price });
      }
      if (isNaN(costPrice) || costPrice <= 0) {
        rowErrors.push({ row: rowNumber, field: 'costPrice', message: 'Cost price must be a positive number', value: row.costPrice });
      }
      if (!isNaN(price) && !isNaN(costPrice) && price <= costPrice) {
        rowErrors.push({ row: rowNumber, field: 'price', message: 'Price must be higher than cost price', value: row.price });
      }
      if (isNaN(stock) || stock < 0) {
        rowErrors.push({ row: rowNumber, field: 'stock', message: 'Stock must be a non-negative number', value: row.stock });
      }
      if (isNaN(minStock) || minStock < 0) {
        rowErrors.push({ row: rowNumber, field: 'minStock', message: 'Minimum stock must be a non-negative number', value: row.minStock });
      }
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        rowErrors.push({ row: rowNumber, field: 'taxRate', message: 'Tax rate must be between 0-100', value: row.taxRate });
      }
      
      // Check for duplicate SKU/Barcode
      const existingProduct = products.find(p => p.sku === row.sku || p.barcode === row.barcode);
      if (existingProduct) {
        if (existingProduct.sku === row.sku) {
          rowErrors.push({ row: rowNumber, field: 'sku', message: 'SKU already exists', value: row.sku });
        }
        if (existingProduct.barcode === row.barcode) {
          rowErrors.push({ row: rowNumber, field: 'barcode', message: 'Barcode already exists', value: row.barcode });
        }
      }
      
      if (rowErrors.length === 0) {
        valid.push({
          id: '', // Will be generated
          name: row.name.trim(),
          sku: row.sku.trim(),
          barcode: row.barcode.trim(),
          price,
          costPrice,
          category: row.category.trim(),
          brand: row.brand.trim(),
          stock,
          minStock,
          taxRate,
          description: row.description?.trim() || '',
          isActive: row.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        errors.push(...rowErrors);
      }
    });
    
    return { valid, errors, total: data.length };
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
      importPreview.valid.forEach(product => {
        addProduct(product);
      });
      
      toast.success(`Successfully imported ${importPreview.valid.length} products`);
      onClose();
    } catch (error) {
      toast.error('Failed to import products');
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

  const handleExport = () => {
    let exportData = products;
    
    // Filter inactive products if not included
    if (!exportOptions.includeInactive) {
      exportData = exportData.filter(p => p.isActive);
    }
    
    // Select only chosen fields
    const selectedFields = Object.entries(exportOptions.selectedFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field);
    
    const filteredData = exportData.map(product => {
      const filtered: any = {};
      selectedFields.forEach(field => {
        filtered[field] = (product as any)[field];
      });
      return filtered;
    });
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    if (exportFormat === 'csv') {
      content = generateCSV(filteredData);
      filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(filteredData, null, 2);
      filename = `products_export_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredData.length} products`);
    onClose();
  };

  const downloadTemplate = () => {
    const content = generateCSV(sampleData);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              {mode === 'import' ? (
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === 'import' ? 'Import Products' : 'Export Products'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mode === 'import' 
                  ? 'Upload a CSV or JSON file to import products in bulk'
                  : 'Download your product data in CSV or JSON format'
                }
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

        <div className="p-6">
          {mode === 'import' ? (
            <div className="space-y-6">
              {/* Import Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Import Instructions</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Supported formats: CSV, JSON</li>
                  <li>• Required fields: name, sku, barcode, price, costPrice, category, brand, stock, minStock, taxRate</li>
                  <li>• Optional fields: description, isActive (defaults to true)</li>
                  <li>• SKU and barcode must be unique</li>
                  <li>• Price must be higher than cost price</li>
                </ul>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Download Template</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get a sample CSV file with the correct format
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
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
                    <div className="mt-4">
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
                      <div className="max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {importPreview.valid.slice(0, 6).map((product, index) => (
                            <div key={index} className="text-green-800 dark:text-green-300">
                              <span className="font-medium">{product.name}</span> - {product.sku} - ${product.price}
                            </div>
                          ))}
                          {importPreview.valid.length > 6 && (
                            <p className="text-green-600 dark:text-green-400 md:col-span-2">
                              ... and {importPreview.valid.length - 6} more products
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Format */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Export Format</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'csv')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">CSV</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'json')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">JSON</span>
                  </label>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Export Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeInactive}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        includeInactive: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Include inactive products</span>
                  </label>
                </div>
              </div>

              {/* Field Selection */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Select Fields to Export</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(exportOptions.selectedFields).map(([field, selected]) => (
                    <label key={field} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => setExportOptions({
                          ...exportOptions,
                          selectedFields: {
                            ...exportOptions.selectedFields,
                            [field]: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Export Summary</h3>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p>• Total products: {products.length}</p>
                  <p>• Active products: {products.filter(p => p.isActive).length}</p>
                  <p>• Will export: {exportOptions.includeInactive ? products.length : products.filter(p => p.isActive).length} products</p>
                  <p>• Selected fields: {Object.values(exportOptions.selectedFields).filter(Boolean).length}</p>
                  <p>• Format: {exportFormat.toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            
            {mode === 'import' ? (
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
                    Import {importPreview?.valid.length || 0} Products
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Products
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;