import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  ShoppingCart, 
  Truck,
  CheckCircle,
  FileSpreadsheet,
  Database,
  Building,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  User,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Button from '../ui/Button';
import { useOrderStore } from '../../store/orderStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { Order } from '../../types';
import toast from 'react-hot-toast';

interface OrderExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderExportModal: React.FC<OrderExportModalProps> = ({ isOpen, onClose }) => {
  const { orders } = useOrderStore();
  const { suppliers } = useInventoryStore();
  
  const [exportType, setExportType] = useState<'orders' | 'summary' | 'items' | 'suppliers'>('orders');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    orderType: 'all' as 'all' | 'purchase' | 'sale',
    status: 'all' as 'all' | Order['status'],
    supplierId: 'all',
    includeItems: true,
    includeNotes: false,
    minAmount: '',
    maxAmount: '',
    priority: 'all' as 'all' | 'low' | 'normal' | 'high' | 'urgent',
    groupBy: 'none' as 'none' | 'supplier' | 'status' | 'type' | 'date'
  });

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

  const generatePDF = (data: any[], filename: string) => {
    // For PDF generation, we'll create a simple HTML structure and convert it
    const htmlContent = `
      <html>
        <head>
          <title>Orders Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { background-color: #f9f9f9; padding: 10px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orders Export Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${dateRange.startDate} to ${dateRange.endDate}</p>
          </div>
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Records: ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredOrders = () => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    return orders.filter(order => {
      // Date filter
      const orderDate = new Date(order.orderDate);
      if (orderDate < startDate || orderDate > endDate) return false;

      // Type filter
      if (filters.orderType !== 'all' && order.type !== filters.orderType) return false;

      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) return false;

      // Supplier filter
      if (filters.supplierId !== 'all' && order.supplierId !== filters.supplierId) return false;

      // Amount filter
      if (filters.minAmount && order.total < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && order.total > parseFloat(filters.maxAmount)) return false;

      return true;
    });
  };

  const handleExport = () => {
    const filteredOrders = getFilteredOrders();
    let data: any[] = [];
    let filename = '';
    const dateStr = new Date().toISOString().split('T')[0];

    switch (exportType) {
      case 'orders':
        data = filteredOrders.map(order => ({
          orderId: order.id.slice(-8).toUpperCase(),
          type: order.type.toUpperCase(),
          status: order.status.toUpperCase(),
          supplier: order.supplierName || 'N/A',
          orderDate: order.orderDate.toLocaleDateString(),
          expectedDelivery: order.expectedDelivery?.toLocaleDateString() || 'N/A',
          itemCount: order.items.length,
          subtotal: order.subtotal.toFixed(2),
          tax: order.tax.toFixed(2),
          total: order.total.toFixed(2),
          ...(filters.includeNotes && { notes: order.notes || '' }),
          createdAt: order.createdAt.toLocaleDateString()
        }));
        filename = `orders_export_${dateStr}.${exportFormat}`;
        break;

      case 'summary':
        const summary = {
          totalOrders: filteredOrders.length,
          purchaseOrders: filteredOrders.filter(o => o.type === 'purchase').length,
          salesOrders: filteredOrders.filter(o => o.type === 'sale').length,
          pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
          completedOrders: filteredOrders.filter(o => o.status === 'completed').length,
          totalValue: filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2),
          averageOrderValue: (filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length || 0).toFixed(2),
          dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
          generatedAt: new Date().toISOString()
        };
        
        data = [summary];
        filename = `orders_summary_${dateStr}.${exportFormat}`;
        break;

      case 'items':
        data = [];
        filteredOrders.forEach(order => {
          order.items.forEach(item => {
            data.push({
              orderId: order.id.slice(-8).toUpperCase(),
              orderType: order.type.toUpperCase(),
              orderStatus: order.status.toUpperCase(),
              orderDate: order.orderDate.toLocaleDateString(),
              supplier: order.supplierName || 'N/A',
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toFixed(2),
              itemTotal: item.total.toFixed(2)
            });
          });
        });
        filename = `order_items_${dateStr}.${exportFormat}`;
        break;

      case 'suppliers':
        const supplierStats = suppliers.map(supplier => {
          const supplierOrders = filteredOrders.filter(o => o.supplierId === supplier.id);
          return {
            supplierName: supplier.name,
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            totalOrders: supplierOrders.length,
            totalValue: supplierOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2),
            averageOrderValue: (supplierOrders.reduce((sum, o) => sum + o.total, 0) / supplierOrders.length || 0).toFixed(2),
            lastOrderDate: supplierOrders.length > 0 
              ? Math.max(...supplierOrders.map(o => o.orderDate.getTime()))
              : 'N/A',
            status: supplier.isActive ? 'Active' : 'Inactive'
          };
        });
        data = supplierStats;
        filename = `supplier_performance_${dateStr}.${exportFormat}`;
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
      } else if (exportFormat === 'pdf') {
        generatePDF(data, filename);
      }
      
      toast.success(`Successfully exported ${data.length} records`);
      onClose();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getExportPreview = () => {
    const filteredOrders = getFilteredOrders();
    
    switch (exportType) {
      case 'orders':
        return {
          count: filteredOrders.length,
          description: 'orders with details and totals'
        };
      case 'summary':
        return {
          count: 1,
          description: 'summary report with key metrics'
        };
      case 'items':
        const totalItems = filteredOrders.reduce((sum, order) => sum + order.items.length, 0);
        return {
          count: totalItems,
          description: 'individual order items'
        };
      case 'suppliers':
        return {
          count: suppliers.length,
          description: 'suppliers with performance metrics'
        };
      default:
        return { count: 0, description: '' };
    }
  };

  if (!isOpen) return null;

  const preview = getExportPreview();
  const filteredOrders = getFilteredOrders();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Orders Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export order data, summaries, and analytics in various formats
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { 
                  id: 'orders', 
                  label: 'Order Details', 
                  icon: ShoppingCart, 
                  desc: 'Complete order information with totals' 
                },
                { 
                  id: 'summary', 
                  label: 'Summary Report', 
                  icon: BarChart3, 
                  desc: 'Key metrics and statistics' 
                },
                { 
                  id: 'items', 
                  label: 'Order Items', 
                  icon: Package, 
                  desc: 'Individual line items from all orders' 
                },
                { 
                  id: 'suppliers', 
                  label: 'Supplier Performance', 
                  icon: Building, 
                  desc: 'Supplier statistics and performance' 
                }
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
                    <span className={`font-medium text-sm ${
                      exportType === type.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      {type.label}
                    </span>
                  </div>
                  <p className={`text-xs ${
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
                { id: 'json', label: 'JSON', icon: FileText, desc: 'Structured data' },
                { id: 'pdf', label: 'PDF', icon: FileText, desc: 'Printable report' }
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
                  <div className="font-medium text-sm">{format.label}</div>
                  <div className="text-xs opacity-75">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
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

          {/* Advanced Filters */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Type
                </label>
                <select
                  value={filters.orderType}
                  onChange={(e) => setFilters({ ...filters, orderType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="purchase">Purchase Orders</option>
                  <option value="sale">Sales Orders</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier
                </label>
                <select
                  value={filters.supplierId}
                  onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group By
                </label>
                <select
                  value={filters.groupBy}
                  onChange={(e) => setFilters({ ...filters, groupBy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="none">No Grouping</option>
                  <option value="supplier">By Supplier</option>
                  <option value="status">By Status</option>
                  <option value="type">By Type</option>
                  <option value="date">By Date</option>
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-6">
                {exportType === 'orders' && (
                  <>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.includeItems}
                        onChange={(e) => setFilters({ ...filters, includeItems: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Include item details</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.includeNotes}
                        onChange={(e) => setFilters({ ...filters, includeNotes: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Include notes</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Current Filter Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Current Selection Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredOrders.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredOrders.filter(o => o.type === 'purchase').length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Purchase Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {filteredOrders.filter(o => o.type === 'sale').length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Sales Orders</div>
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
              <p>• Date range: <strong>{dateRange.startDate}</strong> to <strong>{dateRange.endDate}</strong></p>
              <p>• Filters applied: <strong>
                {[
                  filters.orderType !== 'all' && `Type: ${filters.orderType}`,
                  filters.status !== 'all' && `Status: ${filters.status}`,
                  filters.supplierId !== 'all' && 'Specific supplier',
                  filters.minAmount && `Min: $${filters.minAmount}`,
                  filters.maxAmount && `Max: $${filters.maxAmount}`
                ].filter(Boolean).join(', ') || 'None'}
              </strong></p>
              <p>• File will be downloaded automatically</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({
                    orderType: 'all',
                    status: 'all',
                    supplierId: 'all',
                    includeItems: true,
                    includeNotes: false,
                    minAmount: '',
                    maxAmount: '',
                    priority: 'all',
                    groupBy: 'none'
                  });
                  setDateRange({
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                Reset Filters
              </Button>
            </div>
            
            <div className="flex space-x-3">
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
    </div>
  );
};

export default OrderExportModal;