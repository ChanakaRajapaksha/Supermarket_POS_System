import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  Users, 
  Building,
  CheckCircle,
  FileSpreadsheet,
  Database,
  Star,
  CreditCard,
  TrendingUp,
  BarChart3,
  Globe,
  Mail,
  Phone
} from 'lucide-react';
import Button from '../ui/Button';
import { useDataStore } from '../../store/dataStore';
import { Customer } from '../../types';
import toast from 'react-hot-toast';

interface CustomerExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerExportModal: React.FC<CustomerExportModalProps> = ({ isOpen, onClose }) => {
  const { customers } = useDataStore();
  
  const [exportType, setExportType] = useState<'customers' | 'summary' | 'analytics' | 'segments'>('customers');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    includeInactive: false,
    customerType: 'all' as 'all' | 'individual' | 'business',
    loyaltyTier: 'all' as 'all' | 'bronze' | 'silver' | 'gold' | 'platinum',
    minSpent: '',
    maxSpent: '',
    hasEmail: false,
    hasPhone: false,
    recentPurchase: 'all' as 'all' | '30days' | '90days' | '1year',
    groupBy: 'none' as 'none' | 'tier' | 'type' | 'location' | 'spending'
  });
  const [selectedFields, setSelectedFields] = useState({
    basicInfo: true,
    contactInfo: true,
    loyaltyInfo: true,
    spendingInfo: true,
    preferences: false,
    socialMedia: false,
    emergencyContact: false,
    notes: false,
    timestamps: true
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
    const htmlContent = `
      <html>
        <head>
          <title>Customer Export Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customer Export Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${dateRange.startDate} to ${dateRange.endDate}</p>
          </div>
          <div class="summary">
            <h3>Export Summary</h3>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${data.length}</div>
                <div class="stat-label">Total Customers</div>
              </div>
              <div class="stat">
                <div class="stat-value">$${data.reduce((sum: number, c: any) => sum + (parseFloat(c.totalSpent) || 0), 0).toFixed(0)}</div>
                <div class="stat-label">Total Revenue</div>
              </div>
              <div class="stat">
                <div class="stat-value">${(data.reduce((sum: number, c: any) => sum + (parseFloat(c.totalSpent) || 0), 0) / data.length).toFixed(2)}</div>
                <div class="stat-label">Avg. Customer Value</div>
              </div>
            </div>
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

  const getFilteredCustomers = () => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    return customers.filter(customer => {
      // Date filter
      const customerDate = new Date(customer.createdAt);
      if (customerDate < startDate || customerDate > endDate) return false;

      // Customer type filter (would work with extended customer data)
      // if (filters.customerType !== 'all' && customer.type !== filters.customerType) return false;

      // Spending filters
      if (filters.minSpent && customer.totalSpent < parseFloat(filters.minSpent)) return false;
      if (filters.maxSpent && customer.totalSpent > parseFloat(filters.maxSpent)) return false;

      // Contact filters
      if (filters.hasEmail && !customer.email) return false;
      if (filters.hasPhone && !customer.phone) return false;

      // Recent purchase filter
      if (filters.recentPurchase !== 'all' && customer.lastPurchase) {
        const daysSinceLastPurchase = (Date.now() - customer.lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.recentPurchase === '30days' && daysSinceLastPurchase > 30) return false;
        if (filters.recentPurchase === '90days' && daysSinceLastPurchase > 90) return false;
        if (filters.recentPurchase === '1year' && daysSinceLastPurchase > 365) return false;
      }

      return true;
    });
  };

  const handleExport = () => {
    const filteredCustomers = getFilteredCustomers();
    let data: any[] = [];
    let filename = '';
    const dateStr = new Date().toISOString().split('T')[0];

    switch (exportType) {
      case 'customers':
        data = filteredCustomers.map(customer => {
          const baseData: any = {};
          
          if (selectedFields.basicInfo) {
            baseData.name = customer.name;
            baseData.customerId = customer.id.slice(-8).toUpperCase();
          }
          
          if (selectedFields.contactInfo) {
            baseData.email = customer.email || '';
            baseData.phone = customer.phone || '';
          }
          
          if (selectedFields.loyaltyInfo) {
            baseData.loyaltyPoints = customer.loyaltyPoints;
            baseData.loyaltyTier = customer.loyaltyPoints >= 1000 ? 'Platinum' : 
                                  customer.loyaltyPoints >= 500 ? 'Gold' :
                                  customer.loyaltyPoints >= 200 ? 'Silver' : 'Bronze';
          }
          
          if (selectedFields.spendingInfo) {
            baseData.totalSpent = customer.totalSpent.toFixed(2);
            baseData.averageOrderValue = (customer.totalSpent / Math.max(1, customer.loyaltyPoints / 10)).toFixed(2);
            baseData.lastPurchase = customer.lastPurchase?.toLocaleDateString() || 'Never';
          }
          
          if (selectedFields.timestamps) {
            baseData.joinedDate = customer.createdAt.toLocaleDateString();
            baseData.daysSinceJoined = Math.floor((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          }
          
          return baseData;
        });
        filename = `customers_export_${dateStr}.${exportFormat}`;
        break;

      case 'summary':
        const summary = {
          totalCustomers: filteredCustomers.length,
          activeCustomers: filteredCustomers.filter(c => c.lastPurchase && 
            (Date.now() - c.lastPurchase.getTime()) < 90 * 24 * 60 * 60 * 1000).length,
          newCustomers: filteredCustomers.filter(c => 
            (Date.now() - c.createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000).length,
          totalRevenue: filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2),
          averageCustomerValue: (filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length || 0).toFixed(2),
          totalLoyaltyPoints: filteredCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
          customersWithEmail: filteredCustomers.filter(c => c.email).length,
          customersWithPhone: filteredCustomers.filter(c => c.phone).length,
          topSpenders: filteredCustomers
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(c => ({ name: c.name, totalSpent: c.totalSpent.toFixed(2) })),
          dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
          generatedAt: new Date().toISOString()
        };
        
        data = [summary];
        filename = `customer_summary_${dateStr}.${exportFormat}`;
        break;

      case 'analytics':
        const analytics = filteredCustomers.map(customer => ({
          customerId: customer.id.slice(-8).toUpperCase(),
          name: customer.name,
          customerLifetimeValue: customer.totalSpent.toFixed(2),
          loyaltyPoints: customer.loyaltyPoints,
          estimatedOrderFrequency: customer.lastPurchase ? 
            Math.round(customer.loyaltyPoints / Math.max(1, (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0,
          daysSinceLastPurchase: customer.lastPurchase ? 
            Math.floor((Date.now() - customer.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)) : 'Never',
          customerTenure: Math.floor((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          riskSegment: customer.lastPurchase && (Date.now() - customer.lastPurchase.getTime()) > 180 * 24 * 60 * 60 * 1000 ? 'At Risk' :
                      customer.totalSpent > 500 ? 'High Value' :
                      customer.totalSpent > 100 ? 'Medium Value' : 'Low Value',
          contactability: (customer.email ? 1 : 0) + (customer.phone ? 1 : 0)
        }));
        data = analytics;
        filename = `customer_analytics_${dateStr}.${exportFormat}`;
        break;

      case 'segments':
        const segments = {
          highValue: filteredCustomers.filter(c => c.totalSpent > 500).length,
          mediumValue: filteredCustomers.filter(c => c.totalSpent > 100 && c.totalSpent <= 500).length,
          lowValue: filteredCustomers.filter(c => c.totalSpent <= 100).length,
          loyaltyTiers: {
            platinum: filteredCustomers.filter(c => c.loyaltyPoints >= 1000).length,
            gold: filteredCustomers.filter(c => c.loyaltyPoints >= 500 && c.loyaltyPoints < 1000).length,
            silver: filteredCustomers.filter(c => c.loyaltyPoints >= 200 && c.loyaltyPoints < 500).length,
            bronze: filteredCustomers.filter(c => c.loyaltyPoints < 200).length
          },
          recentActivity: {
            active30Days: filteredCustomers.filter(c => c.lastPurchase && 
              (Date.now() - c.lastPurchase.getTime()) < 30 * 24 * 60 * 60 * 1000).length,
            active90Days: filteredCustomers.filter(c => c.lastPurchase && 
              (Date.now() - c.lastPurchase.getTime()) < 90 * 24 * 60 * 60 * 1000).length,
            inactive: filteredCustomers.filter(c => !c.lastPurchase || 
              (Date.now() - c.lastPurchase.getTime()) > 90 * 24 * 60 * 60 * 1000).length
          },
          contactInfo: {
            hasEmail: filteredCustomers.filter(c => c.email).length,
            hasPhone: filteredCustomers.filter(c => c.phone).length,
            hasBoth: filteredCustomers.filter(c => c.email && c.phone).length,
            hasNeither: filteredCustomers.filter(c => !c.email && !c.phone).length
          }
        };
        data = [segments];
        filename = `customer_segments_${dateStr}.${exportFormat}`;
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
      
      toast.success(`Successfully exported ${exportType === 'customers' ? data.length : 1} record(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getExportPreview = () => {
    const filteredCustomers = getFilteredCustomers();
    
    switch (exportType) {
      case 'customers':
        return {
          count: filteredCustomers.length,
          description: 'customer records with selected fields'
        };
      case 'summary':
        return {
          count: 1,
          description: 'comprehensive summary report with key metrics'
        };
      case 'analytics':
        return {
          count: filteredCustomers.length,
          description: 'customer analytics with CLV and segmentation'
        };
      case 'segments':
        return {
          count: 1,
          description: 'customer segmentation analysis report'
        };
      default:
        return { count: 0, description: '' };
    }
  };

  if (!isOpen) return null;

  const preview = getExportPreview();
  const filteredCustomers = getFilteredCustomers();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Customer Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export customer data, analytics, and insights in various formats
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
                  id: 'customers', 
                  label: 'Customer Records', 
                  icon: Users, 
                  desc: 'Complete customer profiles and contact information' 
                },
                { 
                  id: 'summary', 
                  label: 'Summary Report', 
                  icon: BarChart3, 
                  desc: 'Key metrics and performance indicators' 
                },
                { 
                  id: 'analytics', 
                  label: 'Customer Analytics', 
                  icon: TrendingUp, 
                  desc: 'CLV, segmentation, and behavioral insights' 
                },
                { 
                  id: 'segments', 
                  label: 'Segmentation Analysis', 
                  icon: Database, 
                  desc: 'Customer segments and demographic breakdown' 
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
              Date Range (Customer Join Date)
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
              Advanced Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Type
                </label>
                <select
                  value={filters.customerType}
                  onChange={(e) => setFilters({ ...filters, customerType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loyalty Tier
                </label>
                <select
                  value={filters.loyaltyTier}
                  onChange={(e) => setFilters({ ...filters, loyaltyTier: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Tiers</option>
                  <option value="platinum">Platinum (1000+ pts)</option>
                  <option value="gold">Gold (500-999 pts)</option>
                  <option value="silver">Silver (200-499 pts)</option>
                  <option value="bronze">Bronze (0-199 pts)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recent Purchase
                </label>
                <select
                  value={filters.recentPurchase}
                  onChange={(e) => setFilters({ ...filters, recentPurchase: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Customers</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Spent ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.minSpent}
                  onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Spent ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.maxSpent}
                  onChange={(e) => setFilters({ ...filters, maxSpent: e.target.value })}
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
                  <option value="tier">By Loyalty Tier</option>
                  <option value="type">By Customer Type</option>
                  <option value="spending">By Spending Level</option>
                  <option value="location">By Location</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasEmail}
                    onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Has email address</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone}
                    onChange={(e) => setFilters({ ...filters, hasPhone: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Has phone number</span>
                </label>
              </div>
            </div>
          </div>

          {/* Field Selection (for customer records export) */}
          {exportType === 'customers' && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Select Fields to Export</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(selectedFields).map(([field, selected]) => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => setSelectedFields({
                        ...selectedFields,
                        [field]: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Current Selection Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Current Selection Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredCustomers.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(0)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Loyalty Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${(filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length || 0).toFixed(2)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Avg. Customer Value</div>
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
                  filters.customerType !== 'all' && `Type: ${filters.customerType}`,
                  filters.loyaltyTier !== 'all' && `Tier: ${filters.loyaltyTier}`,
                  filters.minSpent && `Min: $${filters.minSpent}`,
                  filters.maxSpent && `Max: $${filters.maxSpent}`,
                  filters.hasEmail && 'Has email',
                  filters.hasPhone && 'Has phone',
                  filters.recentPurchase !== 'all' && `Recent: ${filters.recentPurchase}`
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
                    includeInactive: false,
                    customerType: 'all',
                    loyaltyTier: 'all',
                    minSpent: '',
                    maxSpent: '',
                    hasEmail: false,
                    hasPhone: false,
                    recentPurchase: 'all',
                    groupBy: 'none'
                  });
                  setDateRange({
                    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
                Export {preview.count} Record(s)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerExportModal;