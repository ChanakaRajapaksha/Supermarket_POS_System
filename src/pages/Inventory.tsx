import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Edit3,
  Truck,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Download,
  Upload,
  Settings,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal';
import AddSupplierModal from '../components/inventory/AddSupplierModal';
import InventoryExportModal from '../components/inventory/InventoryExportModal';
import { useInventoryStore } from '../store/inventoryStore';
import { useDataStore } from '../store/dataStore';
import { InventoryTransaction, Supplier, Product } from '../types';
import toast from 'react-hot-toast';

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'suppliers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const { transactions, suppliers, addTransaction, addSupplier, deleteSupplier, updateSupplier } = useInventoryStore();
  const { products, updateProduct } = useDataStore();
  
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    return matchesSearch && matchesType;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const handleStockAdjustment = (product?: Product) => {
    setSelectedProduct(product || null);
    setShowStockAdjustment(true);
  };

  const handleQuickRestock = (product: Product) => {
    const newStock = product.stock + 50; // Add 50 units
    const transaction: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      productId: product.id,
      productName: product.name,
      type: 'in',
      quantity: 50,
      previousStock: product.stock,
      newStock,
      reason: 'Quick restock',
      reference: `QR-${Date.now()}`,
      userId: '1',
      userName: 'Admin User',
    };

    addTransaction(transaction);
    updateProduct(product.id, { stock: newStock });
    toast.success(`Added 50 units to ${product.name}`);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(id);
      toast.success('Supplier deleted successfully');
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowAddSupplier(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'out': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment': return <Edit3 className="w-4 h-4 text-blue-600" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'in': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'out': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'adjustment': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="secondary" onClick={() => handleStockAdjustment()}>
            <Edit3 className="w-4 h-4 mr-2" />
            Adjust Stock
          </Button>
          <Button onClick={() => setShowAddSupplier(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Package },
            { id: 'transactions', label: 'Transactions', icon: FileText },
            { id: 'suppliers', label: 'Suppliers', icon: Truck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock In (Today)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {transactions.filter(t => t.type === 'in' && 
                        new Date(t.createdAt).toDateString() === new Date().toDateString()).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Out (Today)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {transactions.filter(t => t.type === 'out' && 
                        new Date(t.createdAt).toDateString() === new Date().toDateString()).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {lowStockProducts.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Low Stock Products
                </span>
                <Button size="sm" onClick={() => handleStockAdjustment()}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Bulk Adjust
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Current: {product.stock} | Minimum: {product.minStock} | SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleQuickRestock(product)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Quick +50
                      </Button>
                      <Button size="sm" onClick={() => handleStockAdjustment(product)}>
                        <Edit3 className="w-4 h-4 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      All Products Well Stocked
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No products are currently below their minimum stock levels
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Value Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Inventory Value Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potential Revenue</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${products.reduce((sum, p) => sum + (p.stock * p.price), 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potential Profit</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ${products.reduce((sum, p) => sum + (p.stock * (p.price - p.costPrice)), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="adjustment">Adjustments</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(transaction.type)}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {transaction.productName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.reason}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {transaction.userName}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {transaction.createdAt.toLocaleDateString()}
                          </span>
                          {transaction.reference && (
                            <span className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {transaction.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'in' ? 'text-green-600 dark:text-green-400' :
                        transaction.type === 'out' ? 'text-red-600 dark:text-red-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {transaction.type === 'in' ? '+' : transaction.type === 'out' ? '-' : '±'}
                        {Math.abs(transaction.quantity)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.previousStock} → {transaction.newStock}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Transactions Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No transactions match your current search and filters
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddSupplier(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {supplier.name}
                        </h3>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          supplier.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {supplier.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {supplier.email}
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {supplier.phone}
                      </p>
                    )}
                    {supplier.contactPerson && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {supplier.contactPerson}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => handleEditSupplier(supplier)}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {suppliers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Suppliers Added
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start by adding your first supplier to manage purchase orders
                </p>
                <Button onClick={() => setShowAddSupplier(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Supplier
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={showStockAdjustment}
        onClose={() => {
          setShowStockAdjustment(false);
          setSelectedProduct(null);
        }}
        selectedProduct={selectedProduct}
      />

      <AddSupplierModal
        isOpen={showAddSupplier}
        onClose={() => {
          setShowAddSupplier(false);
          setEditingSupplier(null);
        }}
        editingSupplier={editingSupplier}
      />

      <InventoryExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export default Inventory;