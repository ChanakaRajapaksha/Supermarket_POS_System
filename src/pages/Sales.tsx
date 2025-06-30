import React, { useState } from 'react';
import { Search, ShoppingCart, Scan, User, CreditCard, Banknote, Smartphone, Trash2, Plus, Minus, Bold as Hold, Play, ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ScanModal from '../components/sales/ScanModal';
import { usePOSStore } from '../store/posStore';
import { useDataStore } from '../store/dataStore';
import toast from 'react-hot-toast';

const Sales: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [showScanModal, setShowScanModal] = useState(false);
  
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    holdBill, 
    heldBills,
    resumeBill,
    getCartTotal 
  } = usePOSStore();
  
  const { products, searchProducts } = useDataStore();
  
  const filteredProducts = searchProducts(searchQuery);
  const { subtotal, tax, total } = getCartTotal();

  const handleBarcodeSearch = () => {
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error('Product not found');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    toast.success('Sale completed successfully!');
    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Side - Product Search and Cart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search and Barcode */}
        <Card>
          <CardHeader>
            <CardTitle>Product Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Scan or enter barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                />
              </div>
              <Button onClick={handleBarcodeSearch}>
                <Scan className="w-4 h-4 mr-2" />
                Scan
              </Button>
              <Button 
                onClick={() => setShowScanModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Scanner
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <div className="w-full h-24 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Stock: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Held Bills */}
        {heldBills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Held Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {heldBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Bill #{bill.id.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ${bill.total.toFixed(2)} • {bill.items.length} items
                      </p>
                    </div>
                    <Button size="sm" onClick={() => resumeBill(bill.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Side - Cart and Checkout */}
      <div className="space-y-6">
        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Shopping Cart</span>
              <span className="text-sm font-normal text-gray-500">
                {cart.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Cart is empty
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ${item.product.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'wallet', label: 'Wallet', icon: Smartphone },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id as any)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <method.icon className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Complete Sale - ${total.toFixed(2)}
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={holdBill}
              disabled={cart.length === 0}
            >
              <Hold className="w-4 h-4 mr-2" />
              Hold
            </Button>
            <Button 
              variant="danger" 
              className="w-full"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Scan Modal */}
      <ScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
      />
    </div>
  );
};

export default Sales;