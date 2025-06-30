import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Search, 
  Package, 
  ShoppingCart, 
  Save, 
  Calculator, 
  Truck, 
  User, 
  Calendar, 
  FileText, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit3,
  Building
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useOrderStore } from '../../store/orderStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useDataStore } from '../../store/dataStore';
import { Order, Product, Supplier } from '../../types';
import toast from 'react-hot-toast';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderType?: 'purchase' | 'sale';
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: Product;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  orderType = 'purchase' 
}) => {
  const { addOrder } = useOrderStore();
  const { suppliers } = useInventoryStore();
  const { products, searchProducts } = useDataStore();
  
  const [currentOrderType, setCurrentOrderType] = useState<'purchase' | 'sale'>(orderType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderDetails, setOrderDetails] = useState({
    expectedDelivery: '',
    notes: '',
    reference: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    paymentTerms: '30',
    shippingMethod: 'standard',
    discount: 0,
    shippingCost: 0,
    additionalCharges: 0
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filteredProducts = searchProducts(searchQuery);

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      const unitPrice = currentOrderType === 'purchase' ? product.costPrice : product.price;
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice,
        total: unitPrice,
        product
      };
      setOrderItems(prev => [...prev, newItem]);
    }
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setOrderItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity, total: quantity * item.unitPrice }
        : item
    ));
  };

  const updateItemPrice = (productId: string, unitPrice: number) => {
    setOrderItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, unitPrice, total: item.quantity * unitPrice }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * orderDetails.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.1; // 10% tax
    const total = afterDiscount + tax + orderDetails.shippingCost + orderDetails.additionalCharges;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  const validateOrder = () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return false;
    }

    if (currentOrderType === 'purchase' && !selectedSupplier) {
      toast.error('Please select a supplier for purchase orders');
      return false;
    }

    if (currentOrderType === 'sale') {
      // Check stock availability for sales orders
      const insufficientStock = orderItems.find(item => 
        item.product && item.product.stock < item.quantity
      );
      
      if (insufficientStock) {
        toast.error(`Insufficient stock for ${insufficientStock.productName}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateOrder()) return;

    const totals = calculateTotals();
    const orderData: Omit<Order, 'id' | 'createdAt'> = {
      type: currentOrderType,
      supplierId: selectedSupplier?.id,
      supplierName: selectedSupplier?.name,
      items: orderItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      status: 'pending',
      orderDate: new Date(),
      expectedDelivery: orderDetails.expectedDelivery ? new Date(orderDetails.expectedDelivery) : undefined,
      notes: orderDetails.notes || undefined,
    };

    try {
      addOrder(orderData);
      toast.success(`${currentOrderType === 'purchase' ? 'Purchase' : 'Sales'} order created successfully`);
      handleClose();
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const handleClose = () => {
    setOrderItems([]);
    setSelectedSupplier(null);
    setSearchQuery('');
    setOrderDetails({
      expectedDelivery: '',
      notes: '',
      reference: '',
      priority: 'normal',
      paymentTerms: '30',
      shippingMethod: 'standard',
      discount: 0,
      shippingCost: 0,
      additionalCharges: 0
    });
    onClose();
  };

  const quickAddQuantity = (productId: string, amount: number) => {
    const item = orderItems.find(i => i.productId === productId);
    if (item) {
      updateItemQuantity(productId, item.quantity + amount);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              {currentOrderType === 'purchase' ? (
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create {currentOrderType === 'purchase' ? 'Purchase' : 'Sales'} Order
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentOrderType === 'purchase' 
                  ? 'Create a new purchase order from suppliers'
                  : 'Create a new sales order for customers'
                }
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

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type Toggle */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setCurrentOrderType('purchase')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentOrderType === 'purchase'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Purchase Order
                </button>
                <button
                  onClick={() => setCurrentOrderType('sale')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentOrderType === 'sale'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sales Order
                </button>
              </div>

              {/* Supplier Selection (for purchase orders) */}
              {currentOrderType === 'purchase' && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Supplier Selection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suppliers.filter(s => s.isActive).map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => setSelectedSupplier(supplier)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedSupplier?.id === supplier.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {supplier.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {supplier.contactPerson}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedSupplier && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Selected: {selectedSupplier.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Product Search and Selection */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Add Products
                </h3>
                
                <div className="flex space-x-3 mb-4">
                  <div className="flex-1">
                    <Input
                      ref={searchInputRef}
                      placeholder="Search products by name, SKU, or barcode..."
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
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                    {filteredProducts.slice(0, 8).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        onClick={() => addProductToOrder(product)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-500 rounded flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              SKU: {product.sku} • Stock: {product.stock} • 
                              ${currentOrderType === 'purchase' ? product.costPrice : product.price}
                            </p>
                          </div>
                        </div>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                    {searchQuery && filteredProducts.length === 0 && (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Order Items ({orderItems.length})
                  </span>
                  {orderItems.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setOrderItems([])}
                    >
                      Clear All
                    </Button>
                  )}
                </h3>

                {orderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No items added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Search and add products above</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="bg-white dark:bg-gray-600 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              SKU: {item.product?.sku}
                              {currentOrderType === 'sale' && item.product && (
                                <span className={`ml-2 ${
                                  item.product.stock < item.quantity 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  • Available: {item.product.stock}
                                </span>
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantity
                            </label>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                                className="w-16 text-center px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Total
                            </label>
                            <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-500 rounded font-medium">
                              ${item.total.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => quickAddQuantity(item.productId, 5)}
                              className="text-xs"
                            >
                              +5
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => quickAddQuantity(item.productId, 10)}
                              className="text-xs"
                            >
                              +10
                            </Button>
                          </div>
                        </div>

                        {/* Stock Warning */}
                        {currentOrderType === 'sale' && item.product && item.product.stock < item.quantity && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded flex items-center">
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-sm text-red-700 dark:text-red-300">
                              Insufficient stock! Available: {item.product.stock}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary and Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Order Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount ({orderDetails.discount}%):</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -${totals.discountAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax (10%):</span>
                    <span className="font-medium">${totals.tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                    <span className="font-medium">${orderDetails.shippingCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Additional Charges:</span>
                    <span className="font-medium">${orderDetails.additionalCharges.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600 dark:text-green-400">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Adjustments */}
                <div className="mt-4 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={orderDetails.discount}
                      onChange={(e) => setOrderDetails({
                        ...orderDetails,
                        discount: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shipping Cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderDetails.shippingCost}
                      onChange={(e) => setOrderDetails({
                        ...orderDetails,
                        shippingCost: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Order Details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected Delivery
                    </label>
                    <input
                      type="date"
                      value={orderDetails.expectedDelivery}
                      onChange={(e) => setOrderDetails({
                        ...orderDetails,
                        expectedDelivery: e.target.value
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={orderDetails.priority}
                      onChange={(e) => setOrderDetails({
                        ...orderDetails,
                        priority: e.target.value as any
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={orderDetails.reference}
                      onChange={(e) => setOrderDetails({
                        ...orderDetails,
                        reference: e.target.value
                      })}
                      placeholder="PO-2024-001"
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={orderDetails.notes}
                      onChange={(e) => setOrderDetails({
                        ...orderDetails,
                        notes: e.target.value
                      })}
                      rows={3}
                      placeholder="Additional notes or special instructions..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Order Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Order Preview</h3>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p>• Type: <strong>{currentOrderType === 'purchase' ? 'Purchase' : 'Sales'} Order</strong></p>
                  {selectedSupplier && (
                    <p>• Supplier: <strong>{selectedSupplier.name}</strong></p>
                  )}
                  <p>• Items: <strong>{orderItems.length} products</strong></p>
                  <p>• Total Value: <strong>${totals.total.toFixed(2)}</strong></p>
                  <p>• Status: <strong>Pending</strong></p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={orderItems.length === 0 || (currentOrderType === 'purchase' && !selectedSupplier)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;