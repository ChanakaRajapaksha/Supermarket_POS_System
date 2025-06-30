import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Plus, 
  Minus, 
  Save, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Edit3,
  Search,
  Calculator,
  FileText,
  User
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useDataStore } from '../../store/dataStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { Product } from '../../types';
import toast from 'react-hot-toast';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: Product | null;
}

interface AdjustmentItem {
  product: Product;
  currentStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
  type: 'in' | 'out' | 'adjustment';
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedProduct 
}) => {
  const { products, updateProduct, searchProducts } = useDataStore();
  const { addTransaction } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>([]);
  const [bulkReason, setBulkReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'single' | 'bulk'>('single');

  React.useEffect(() => {
    if (selectedProduct && isOpen) {
      setAdjustments([{
        product: selectedProduct,
        currentStock: selectedProduct.stock,
        newStock: selectedProduct.stock,
        adjustment: 0,
        reason: '',
        type: 'adjustment'
      }]);
      setAdjustmentType('single');
    }
  }, [selectedProduct, isOpen]);

  const filteredProducts = searchProducts(searchQuery);

  const addProductToAdjustment = (product: Product) => {
    if (adjustments.find(adj => adj.product.id === product.id)) {
      toast.error('Product already added to adjustment list');
      return;
    }

    const newAdjustment: AdjustmentItem = {
      product,
      currentStock: product.stock,
      newStock: product.stock,
      adjustment: 0,
      reason: '',
      type: 'adjustment'
    };

    setAdjustments(prev => [...prev, newAdjustment]);
    setSearchQuery('');
  };

  const updateAdjustment = (productId: string, field: keyof AdjustmentItem, value: any) => {
    setAdjustments(prev => prev.map(adj => {
      if (adj.product.id === productId) {
        const updated = { ...adj, [field]: value };
        
        if (field === 'newStock') {
          updated.adjustment = value - adj.currentStock;
          updated.type = value > adj.currentStock ? 'in' : 
                        value < adj.currentStock ? 'out' : 'adjustment';
        } else if (field === 'adjustment') {
          updated.newStock = adj.currentStock + value;
          updated.type = value > 0 ? 'in' : value < 0 ? 'out' : 'adjustment';
        }
        
        return updated;
      }
      return adj;
    }));
  };

  const removeAdjustment = (productId: string) => {
    setAdjustments(prev => prev.filter(adj => adj.product.id !== productId));
  };

  const applyBulkReason = () => {
    if (!bulkReason.trim()) {
      toast.error('Please enter a reason for bulk adjustment');
      return;
    }

    setAdjustments(prev => prev.map(adj => ({ ...adj, reason: bulkReason })));
    setBulkReason('');
    toast.success('Bulk reason applied to all adjustments');
  };

  const handleSubmit = () => {
    const validAdjustments = adjustments.filter(adj => 
      adj.adjustment !== 0 && adj.reason.trim() && adj.newStock >= 0
    );

    if (validAdjustments.length === 0) {
      toast.error('No valid adjustments to process');
      return;
    }

    validAdjustments.forEach(adj => {
      // Update product stock
      updateProduct(adj.product.id, { stock: adj.newStock });
      
      // Add inventory transaction
      addTransaction({
        productId: adj.product.id,
        productName: adj.product.name,
        type: adj.type,
        quantity: Math.abs(adj.adjustment),
        previousStock: adj.currentStock,
        newStock: adj.newStock,
        reason: adj.reason,
        reference: `ADJ-${Date.now()}`,
        userId: '1',
        userName: 'Admin User',
      });
    });

    toast.success(`Successfully processed ${validAdjustments.length} stock adjustments`);
    setAdjustments([]);
    onClose();
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'out': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Edit3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 dark:text-green-400';
      case 'out': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Stock Adjustment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adjust inventory levels and track stock movements
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
          {/* Adjustment Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setAdjustmentType('single')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                adjustmentType === 'single'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Single Product
            </button>
            <button
              onClick={() => setAdjustmentType('bulk')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                adjustmentType === 'bulk'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Bulk Adjustment
            </button>
          </div>

          {/* Product Search (for bulk adjustments) */}
          {adjustmentType === 'bulk' && (
            <div className="mb-6">
              <div className="flex space-x-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search products to adjust..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="secondary">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Product Search Results */}
              {searchQuery && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {filteredProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      onClick={() => addProductToAdjustment(product)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Stock: {product.stock} • SKU: {product.sku}
                          </p>
                        </div>
                      </div>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bulk Actions */}
          {adjustmentType === 'bulk' && adjustments.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Bulk Actions</h3>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter reason for all adjustments..."
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                  />
                </div>
                <Button onClick={applyBulkReason} disabled={!bulkReason.trim()}>
                  Apply to All
                </Button>
              </div>
            </div>
          )}

          {/* Adjustments List */}
          <div className="space-y-4">
            {adjustments.map((adjustment) => (
              <div key={adjustment.product.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {adjustment.product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {adjustment.product.sku} • Current Stock: {adjustment.currentStock}
                      </p>
                    </div>
                  </div>
                  
                  {adjustmentType === 'bulk' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeAdjustment(adjustment.product.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Stock Level
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateAdjustment(adjustment.product.id, 'newStock', Math.max(0, adjustment.newStock - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={adjustment.newStock}
                        onChange={(e) => updateAdjustment(adjustment.product.id, 'newStock', parseInt(e.target.value) || 0)}
                        className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateAdjustment(adjustment.product.id, 'newStock', adjustment.newStock + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adjustment
                    </label>
                    <div className={`flex items-center space-x-2 ${getAdjustmentColor(adjustment.type)}`}>
                      {getAdjustmentIcon(adjustment.type)}
                      <span className="font-medium">
                        {adjustment.adjustment > 0 ? '+' : ''}{adjustment.adjustment}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason for Adjustment *
                    </label>
                    <input
                      type="text"
                      value={adjustment.reason}
                      onChange={(e) => updateAdjustment(adjustment.product.id, 'reason', e.target.value)}
                      placeholder="Enter reason for stock adjustment..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quick Adjustment Buttons */}
                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      updateAdjustment(adjustment.product.id, 'newStock', adjustment.currentStock + 10);
                      updateAdjustment(adjustment.product.id, 'reason', 'Stock replenishment');
                    }}
                  >
                    +10 (Restock)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      updateAdjustment(adjustment.product.id, 'newStock', adjustment.product.minStock);
                      updateAdjustment(adjustment.product.id, 'reason', 'Adjust to minimum stock level');
                    }}
                  >
                    Set to Min ({adjustment.product.minStock})
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      updateAdjustment(adjustment.product.id, 'newStock', 0);
                      updateAdjustment(adjustment.product.id, 'reason', 'Stock write-off');
                    }}
                  >
                    Clear Stock
                  </Button>
                </div>

                {/* Warnings */}
                {adjustment.newStock < adjustment.product.minStock && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      New stock level is below minimum threshold ({adjustment.product.minStock})
                    </span>
                  </div>
                )}
              </div>
            ))}

            {adjustments.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Products Selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {adjustmentType === 'single' 
                    ? 'Select a product from the inventory to adjust its stock level'
                    : 'Search and add products to perform bulk stock adjustments'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {adjustments.length > 0 && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Adjustment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Products to Adjust:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {adjustments.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Stock Increases:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                    {adjustments.filter(adj => adj.adjustment > 0).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Stock Decreases:</span>
                  <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                    {adjustments.filter(adj => adj.adjustment < 0).length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={adjustments.length === 0 || adjustments.every(adj => adj.adjustment === 0 || !adj.reason.trim())}
            >
              <Save className="w-4 h-4 mr-2" />
              Apply Adjustments ({adjustments.filter(adj => adj.adjustment !== 0 && adj.reason.trim()).length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;