import React, { useState, useRef } from 'react';
import { X, Upload, Package, DollarSign, Hash, Barcode, Tag, Building2, AlertTriangle, Save, RotateCcw, Camera } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useDataStore } from '../../store/dataStore';
import { Product } from '../../types';
import toast from 'react-hot-toast';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, editingProduct }) => {
  const { addProduct, updateProduct } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: editingProduct?.name || '',
    sku: editingProduct?.sku || '',
    barcode: editingProduct?.barcode || '',
    price: editingProduct?.price || 0,
    costPrice: editingProduct?.costPrice || 0,
    category: editingProduct?.category || '',
    brand: editingProduct?.brand || '',
    stock: editingProduct?.stock || 0,
    minStock: editingProduct?.minStock || 5,
    taxRate: editingProduct?.taxRate || 10,
    description: editingProduct?.description || '',
    isActive: editingProduct?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    'Beverages', 'Dairy', 'Bakery', 'Meat & Seafood', 'Fruits & Vegetables',
    'Frozen Foods', 'Snacks', 'Personal Care', 'Household', 'Electronics'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.costPrice <= 0) newErrors.costPrice = 'Cost price must be greater than 0';
    if (formData.price <= formData.costPrice) newErrors.price = 'Price must be higher than cost price';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (formData.minStock < 0) newErrors.minStock = 'Minimum stock cannot be negative';
    if (formData.taxRate < 0 || formData.taxRate > 100) newErrors.taxRate = 'Tax rate must be between 0-100%';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      if (editingProduct) {
        updateProduct(editingProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        addProduct(formData);
        toast.success('Product added successfully');
      }
      handleClose();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      price: 0,
      costPrice: 0,
      category: '',
      brand: '',
      stock: 0,
      minStock: 5,
      taxRate: 10,
      description: '',
      isActive: true,
    });
    setErrors({});
    setImagePreview(null);
    onClose();
  };

  const handleReset = () => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        sku: editingProduct.sku,
        barcode: editingProduct.barcode,
        price: editingProduct.price,
        costPrice: editingProduct.costPrice,
        category: editingProduct.category,
        brand: editingProduct.brand,
        stock: editingProduct.stock,
        minStock: editingProduct.minStock,
        taxRate: editingProduct.taxRate,
        description: editingProduct.description || '',
        isActive: editingProduct.isActive,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        price: 0,
        costPrice: 0,
        category: '',
        brand: '',
        stock: 0,
        minStock: 5,
        taxRate: 10,
        description: '',
        isActive: true,
      });
    }
    setErrors({});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const generateSKU = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, sku: `${prefix}-${suffix}` });
  };

  const generateBarcode = () => {
    const barcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData({ ...formData, barcode: barcode.toString() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingProduct ? 'Update product information' : 'Enter product details to add to inventory'}
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Product Image */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Image
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview or Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            No image uploaded
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleImageClick}
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Product Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Product Status</h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Product
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Inactive products won't appear in sales
                  </p>
                </div>
              </div>
            </div>

            {/* Right Columns - Product Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Product Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={errors.name}
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <Input
                        label="SKU *"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        error={errors.sku}
                        placeholder="Product SKU"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={generateSKU}
                        className="mt-6"
                        disabled={!formData.category}
                        title="Generate SKU"
                      >
                        <Hash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <Input
                        label="Barcode *"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        error={errors.barcode}
                        placeholder="Product barcode"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={generateBarcode}
                        className="mt-6"
                        title="Generate Barcode"
                      >
                        <Barcode className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                        errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                    )}
                  </div>

                  <Input
                    label="Brand *"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    error={errors.brand}
                    placeholder="Product brand"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Product description (optional)"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pricing & Tax
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Cost Price *"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    error={errors.costPrice}
                    placeholder="0.00"
                  />
                  
                  <Input
                    label="Selling Price *"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    error={errors.price}
                    placeholder="0.00"
                  />
                  
                  <Input
                    label="Tax Rate (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    error={errors.taxRate}
                    placeholder="10.0"
                  />
                </div>

                {/* Profit Margin Display */}
                {formData.price > 0 && formData.costPrice > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Profit Margin:</span>
                      <span className={`font-medium ${
                        formData.price > formData.costPrice 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${(formData.price - formData.costPrice).toFixed(2)} 
                        ({(((formData.price - formData.costPrice) / formData.costPrice) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Inventory Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Current Stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    error={errors.stock}
                    placeholder="0"
                  />
                  
                  <Input
                    label="Minimum Stock Level"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    error={errors.minStock}
                    placeholder="5"
                  />
                </div>

                {/* Stock Warning */}
                {formData.stock <= formData.minStock && formData.stock > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      Stock level is at or below minimum threshold
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;