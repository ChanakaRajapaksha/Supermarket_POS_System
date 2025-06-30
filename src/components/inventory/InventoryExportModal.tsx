import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Edit3,
  CheckCircle,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import Button from '../ui/Button';
import { useInventoryStore } from '../../store/inventoryStore';
import { useDataStore } from '../../store/dataStore';
import toast from 'react-hot-toast';

interface InventoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryExportModal: React.FC<InventoryExportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, suppliers } = useInventoryStore();
  const { products } = useDataStore();
  
  const [exportType, setExportType] = useState<'inventory' | 'transactions' | 'suppliers'>('inventory');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    includeInactive: false,
    transactionType: 'all' as 'all' | 'in' | 'out' | 'adjustment',
    lowStockOnly: false,
    categoryFilter: 'all',
    supplierFilter: 'all'
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
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
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    let data: any[] = [];
    let filename = '';

    const dateStr = new Date().toISOString().split('T')[0];

    switch (exportType) {
      case 'inventory':
        data = products
          .filter(p => filters.includeInactive || p.isActive)
          .filter(p => filters.lowStockOnly ? p.stock <= p.minStock : true)
          .filter(p => filters.categoryFilter === 'all' || p.category === filters.categoryFilter)
          .map(p => ({
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            category: p.category,
            brand: p.brand,
            currentStock: p.stock,
            minimumStock: p.minStock,
            costPrice: p.costPrice,
            sellingPrice: p.price,
            stockValue: (p.stock * p.costPrice).toFixed(2),
            status: p.isActive ? 'Active' : 'Inactive',
            lastUpdated: p.updatedAt.toLocaleDateString()
          }));
        filename = `inventory_report_${dateStr}.${exportFormat}`;
        break;

      case 'transactions':
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);

        data = transactions
          .filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate >= startDate && transactionDate <= endDate;
          })
          .filter(t => filters.transactionType === 'all' || t.type === filters.transactionType)
          .map(t => ({
            date: t.createdAt.toLocaleDateString(),
            time: t.createdAt.toLocaleTimeString(),
            productName: t.productName,
            transactionType: t.type.toUpperCase(),
            quantity: t.type === 'out' ? -t.quantity : t.quantity,
            previousStock: t.previousStock,
            newStock: t.newStock,
            reason: t.reason,
            reference: t.reference || '',
            performedBy: t.userName
          }));
        filename = `transactions_${dateRange.startDate}_to_${dateRange.endDate}.${exportFormat}`;
        break;

      case 'suppliers':
        data = suppliers
          .filter(s => filters.includeInactive || s.isActive)
          .filter(s => filters.supplierFilter === 'all' || s.id === filters.supplierFilter)
          .map(s => ({
            name: s.name,
            contactPerson: s.contactPerson || '',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            status: s.isActive ? 'Active' : 'Inactive',
            joinedDate: s.createdAt.toLocaleDateString()
          }));
        filename = `suppliers_${dateStr}.${exportFormat}`;
        break;
    }

    if (data.length === 0) {
      toast.error('No data to export with current filters');
      return;
    }

    try {
      if (exportFormat === 'csv') {
        generateCSV(data, filename);
      } else if (exportFormat === 'json') {
        generateJSON(data, filename);
      }
      
      toast.success(`Successfully exported ${data.length} records`);
      onClose();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getExportPreview = () => {
    switch (exportType) {
      case 'inventory':
        const inventoryCount = products
          .filter(p => filters.includeInactive || p.isActive)
          .filter(p => filters.lowStockOnly ? p.stock <= p.minStock : true)
          .filter(p => filters.categoryFilter === 'all' || p.category === filters.categoryFilter).length;
        return {
          count: inventoryCount,
          description: 'products with current stock levels and values'
        };

      case 'transactions':
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        const transactionCount = transactions
          .filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate >= startDate && transactionDate <= endDate;
          })
          .filter(t => filters.transactionType === 'all' || t.type === filters.transactionType).length;
        return {
          count: transactionCount,
          description: 'inventory transactions in selected date range'
        };

      case 'suppliers':
        const supplierCount = suppliers
          .filter(s => filters.includeInactive || s.isActive)
          .filter(s => filters.supplierFilter === 'all' || s.id === filters.supplierFilter).length;
        return {
          count: supplierCount,
          description: 'suppliers with contact information'
        };

      default:
        return { count: 0, description: '' };
    }
  };

  if (!isOpen) return null;

  const preview = getExportPreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Inventory Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export inventory, transactions, or supplier data in various formats
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
          {/* Export Type Selection */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Export Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'inventory', label: 'Inventory Report', icon: Package, desc: 'Current stock levels and product details' },
                { id: 'transactions', label: 'Transaction History', icon: FileText, desc: 'Stock movements and adjustments' },
                { id: 'suppliers', label: 'Supplier List', icon: Database, desc: 'Supplier contact information' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setExportType(type.id as any)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    exportType === type.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <type.icon className={`w-5 h-5 mr-2 ${
                      exportType === type.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      exportType === type.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      {type.label}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    exportType === type.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Export Format</h3>
            <div className="flex space-x-3">
              {[
                { id: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'Excel compatible' },
                { id: 'json', label: 'JSON', icon: FileText, desc: 'Structured data' }
              ].map((format) => (
                <button
                  key={format.id}
                  onClick={() => setExportFormat(format.id as any)}
                  className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
                    exportFormat === format.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <format.icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="font-medium">{format.label}</div>
                  <div className="text-xs opacity-75">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range (for transactions) */}
          {exportType === 'transactions' && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h3>
            <div className="space-y-4">
              {/* Common Filters */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeInactive}
                    onChange={(e) => setFilters({ ...filters, includeInactive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include inactive items</span>
                </label>

                {exportType === 'inventory' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.lowStockOnly}
                      onChange={(e) => setFilters({ ...filters, lowStockOnly: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Low stock only</span>
                  </label>
                )}
              </div>

              {/* Specific Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportType === 'inventory' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.categoryFilter}
                      onChange={(e) => setFilters({ ...filters, categoryFilter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                )}

                {exportType === 'transactions' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={filters.transactionType}
                      onChange={(e) => setFilters({ ...filters, transactionType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="in">Stock In</option>
                      <option value="out">Stock Out</option>
                      <option value="adjustment">Adjustments</option>
                    </select>
                  </div>
                )}

                {exportType === 'suppliers' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supplier
                    </label>
                    <select
                      value={filters.supplierFilter}
                      onChange={(e) => setFilters({ ...filters, supplierFilter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Suppliers</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Export Preview
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p>• Will export <strong>{preview.count}</strong> {preview.description}</p>
              <p>• Format: <strong>{exportFormat.toUpperCase()}</strong></p>
              {exportType === 'transactions' && (
                <p>• Date range: <strong>{dateRange.startDate}</strong> to <strong>{dateRange.endDate}</strong></p>
              )}
              <p>• File will be downloaded automatically</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={preview.count === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export {preview.count} Records
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryExportModal;