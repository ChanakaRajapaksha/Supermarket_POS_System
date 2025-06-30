import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Scan, 
  Search, 
  Package, 
  Plus, 
  Minus, 
  ShoppingCart,
  Camera,
  Zap,
  AlertCircle,
  CheckCircle,
  History,
  Keyboard
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CameraScanner from './CameraScanner';
import { useDataStore } from '../../store/dataStore';
import { usePOSStore } from '../../store/posStore';
import { Product } from '../../types';
import toast from 'react-hot-toast';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScanResult {
  product: Product;
  quantity: number;
  timestamp: Date;
}

const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose }) => {
  const [scanInput, setScanInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanMode, setScanMode] = useState<'barcode' | 'search' | 'manual'>('barcode');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  
  const scanInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { products, searchProducts } = useDataStore();
  const { addToCart } = usePOSStore();
  
  const filteredProducts = searchProducts(searchQuery);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      if (scanMode === 'barcode') {
        scanInputRef.current?.focus();
      } else if (scanMode === 'search') {
        searchInputRef.current?.focus();
      }
    }
  }, [isOpen, scanMode]);

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    if (!barcode.trim()) return;
    
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const product = products.find(p => 
        p.barcode === barcode || 
        p.sku.toLowerCase() === barcode.toLowerCase()
      );
      
      if (product) {
        handleProductFound(product);
      } else {
        toast.error(`Product not found: ${barcode}`);
      }
      
      setIsScanning(false);
      setScanInput('');
    }, 300);
  };

  // Handle camera scan result
  const handleCameraScan = (barcode: string) => {
    setShowCameraScanner(false);
    handleBarcodeScan(barcode);
    toast.success(`Scanned barcode: ${barcode}`);
  };

  const handleProductFound = (product: Product) => {
    if (!product.isActive) {
      toast.error('Product is inactive');
      return;
    }
    
    if (product.stock < selectedQuantity) {
      toast.error(`Insufficient stock. Available: ${product.stock}`);
      return;
    }
    
    // Add to cart
    addToCart(product, selectedQuantity);
    
    // Add to scan history
    const scanResult: ScanResult = {
      product,
      quantity: selectedQuantity,
      timestamp: new Date()
    };
    setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
    
    setLastScannedProduct(product);
    toast.success(`Added ${product.name} (${selectedQuantity}) to cart`);
    
    // Reset quantity to 1 for next scan
    setSelectedQuantity(1);
    
    // Auto-focus back to scan input
    if (scanMode === 'barcode') {
      scanInputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'scan' | 'search') => {
    if (e.key === 'Enter') {
      if (type === 'scan') {
        handleBarcodeScan(scanInput);
      } else if (type === 'search' && filteredProducts.length === 1) {
        handleProductFound(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  const quickAddProduct = (product: Product) => {
    handleProductFound(product);
    if (scanMode === 'search') {
      setSearchQuery('');
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
    toast.success('Scan history cleared');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Scan className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Product Scanner
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scan barcodes or search products to add to cart
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Scanning Interface */}
              <div className="lg:col-span-2 space-y-6">
                {/* Scan Mode Tabs */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setScanMode('barcode')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'barcode'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Barcode Scan
                  </button>
                  <button
                    onClick={() => setScanMode('search')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'search'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Product Search
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'manual'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Manual Entry
                  </button>
                </div>

                {/* Quantity Selector */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <input
                      type="number"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <div className="flex space-x-2 ml-4">
                      {[1, 5, 10].map(qty => (
                        <button
                          key={qty}
                          onClick={() => setSelectedQuantity(qty)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            selectedQuantity === qty
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Barcode Scan Mode */}
                {scanMode === 'barcode' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          {isScanning ? (
                            <div className="animate-spin">
                              <Scan className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                          ) : (
                            <Scan className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {isScanning ? 'Scanning...' : 'Ready to Scan'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Scan a barcode or enter it manually below
                        </p>
                        
                        <div className="max-w-md mx-auto">
                          <Input
                            ref={scanInputRef}
                            placeholder="Scan or enter barcode/SKU"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'scan')}
                            disabled={isScanning}
                          />
                          <div className="flex space-x-2 mt-3">
                            <Button
                              className="flex-1"
                              onClick={() => handleBarcodeScan(scanInput)}
                              disabled={!scanInput.trim() || isScanning}
                            >
                              {isScanning ? (
                                <>
                                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                                  Scanning...
                                </>
                              ) : (
                                <>
                                  <Scan className="w-4 h-4 mr-2" />
                                  Scan Product
                                </>
                              )}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setShowCameraScanner(true)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Camera
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Scanned Product */}
                    {lastScannedProduct && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900 dark:text-green-300">
                              Last Scanned: {lastScannedProduct.name}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              SKU: {lastScannedProduct.sku} • Price: ${lastScannedProduct.price.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleProductFound(lastScannedProduct)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Mode */}
                {scanMode === 'search' && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        ref={searchInputRef}
                        placeholder="Search products by name, SKU, or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'search')}
                      />
                    </div>

                    {/* Search Results */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {product.sku} • ${product.price.toFixed(2)} • Stock: {product.stock}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {product.stock < selectedQuantity && (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            )}
                            <Button
                              size="sm"
                              onClick={() => quickAddProduct(product)}
                              disabled={!product.isActive || product.stock < selectedQuantity}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {searchQuery && filteredProducts.length === 0 && (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">No products found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Entry Mode */}
                {scanMode === 'manual' && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Manual Product Entry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Product Name"
                        placeholder="Enter product name"
                      />
                      <Input
                        label="Price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <Input
                        label="SKU/Barcode"
                        placeholder="Enter SKU or barcode"
                      />
                      <Input
                        label="Category"
                        placeholder="Product category"
                      />
                    </div>
                    <Button className="w-full mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manual Product
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column - Scan History & Quick Actions */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setShowCameraScanner(true)}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera Scan
                    </Button>
                    <Button variant="secondary" className="w-full justify-start">
                      <Package className="w-4 h-4 mr-2" />
                      View Cart
                    </Button>
                    <Button variant="secondary" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Product Lookup
                    </Button>
                  </div>
                </div>

                {/* Scan History */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <History className="w-4 h-4 mr-2" />
                      Recent Scans
                    </h3>
                    {scanHistory.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scanHistory.map((scan, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {scan.product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {scan.quantity} • {scan.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleProductFound(scan.product)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {scanHistory.length === 0 && (
                      <div className="text-center py-4">
                        <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No recent scans</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scan Statistics */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Session Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">Products Scanned:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-300">
                        {scanHistory.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">Total Quantity:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-300">
                        {scanHistory.reduce((sum, scan) => sum + scan.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">Session Value:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-300">
                        ${scanHistory.reduce((sum, scan) => sum + (scan.product.price * scan.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Press Enter to scan • Use Tab to switch modes • Click Camera for live scanning
              </div>
              <div className="flex space-x-3">
                <Button variant="secondary" onClick={onClose}>
                  Close Scanner
                </Button>
                <Button onClick={onClose}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Continue to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <CameraScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={handleCameraScan}
      />
    </>
  );
};

export default ScanModal;