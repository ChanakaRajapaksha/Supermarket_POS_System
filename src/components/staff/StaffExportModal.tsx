import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  Users, 
  Shield,
  CheckCircle,
  FileSpreadsheet,
  Database,
  DollarSign,
  TrendingUp,
  BarChart3,
  Building,
  UserCheck,
  Clock,
  Award,
  Briefcase
} from 'lucide-react';
import Button from '../ui/Button';
import { useStaffStore } from '../../store/staffStore';
import { StaffMember } from '../../types';
import toast from 'react-hot-toast';

interface StaffExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StaffExportModal: React.FC<StaffExportModalProps> = ({ isOpen, onClose }) => {
  const { staff } = useStaffStore();
  
  const [exportType, setExportType] = useState<'staff' | 'summary' | 'payroll' | 'performance'>('staff');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    includeInactive: false,
    role: 'all' as 'all' | 'admin' | 'manager' | 'cashier',
    department: 'all' as 'all' | string,
    employmentType: 'all' as 'all' | 'full-time' | 'part-time' | 'contract' | 'intern',
    minSalary: '',
    maxSalary: '',
    hasPermissions: false,
    recentLogin: 'all' as 'all' | '7days' | '30days' | '90days',
    groupBy: 'none' as 'none' | 'role' | 'department' | 'employment' | 'salary'
  });
  const [selectedFields, setSelectedFields] = useState({
    basicInfo: true,
    contactInfo: true,
    roleInfo: true,
    salaryInfo: false,
    permissionsInfo: true,
    employmentInfo: true,
    performanceInfo: false,
    sensitiveInfo: false,
    timestamps: true
  });

  const departments = ['Sales', 'Customer Service', 'Inventory', 'Management', 'IT', 'HR', 'Finance', 'Marketing'];

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
          <title>Staff Export Report</title>
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
            .confidential { color: red; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="confidential">CONFIDENTIAL - INTERNAL USE ONLY</div>
          <div class="header">
            <h1>Staff Export Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Date Range: ${dateRange.startDate} to ${dateRange.endDate}</p>
          </div>
          <div class="summary">
            <h3>Export Summary</h3>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${data.length}</div>
                <div class="stat-label">Total Staff</div>
              </div>
              <div class="stat">
                <div class="stat-value">$${data.reduce((sum: number, s: any) => sum + (parseFloat(s.salary) || 0), 0).toLocaleString()}</div>
                <div class="stat-label">Total Payroll</div>
              </div>
              <div class="stat">
                <div class="stat-value">${(data.reduce((sum: number, s: any) => sum + (parseFloat(s.salary) || 0), 0) / data.length).toFixed(0)}</div>
                <div class="stat-label">Avg. Salary</div>
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

  const getFilteredStaff = () => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    return staff.filter(member => {
      // Date filter (hire date)
      const hireDate = new Date(member.hireDate);
      if (hireDate < startDate || hireDate > endDate) return false;

      // Include inactive filter
      if (!filters.includeInactive && !member.isActive) return false;

      // Role filter
      if (filters.role !== 'all' && member.role !== filters.role) return false;

      // Employment type filter (would work with extended staff data)
      // if (filters.employmentType !== 'all' && member.employmentType !== filters.employmentType) return false;

      // Salary filters
      if (filters.minSalary && member.salary && member.salary < parseFloat(filters.minSalary)) return false;
      if (filters.maxSalary && member.salary && member.salary > parseFloat(filters.maxSalary)) return false;

      // Permissions filter
      if (filters.hasPermissions && member.permissions.length === 0) return false;

      // Recent login filter
      if (filters.recentLogin !== 'all' && member.lastLogin) {
        const daysSinceLogin = (Date.now() - member.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.recentLogin === '7days' && daysSinceLogin > 7) return false;
        if (filters.recentLogin === '30days' && daysSinceLogin > 30) return false;
        if (filters.recentLogin === '90days' && daysSinceLogin > 90) return false;
      }

      return true;
    });
  };

  const handleExport = () => {
    const filteredStaff = getFilteredStaff();
    let data: any[] = [];
    let filename = '';
    const dateStr = new Date().toISOString().split('T')[0];

    switch (exportType) {
      case 'staff':
        data = filteredStaff.map(member => {
          const baseData: any = {};
          
          if (selectedFields.basicInfo) {
            baseData.name = member.name;
            baseData.employeeId = member.id.slice(-8).toUpperCase();
          }
          
          if (selectedFields.contactInfo) {
            baseData.email = member.email;
            baseData.phone = member.phone || '';
          }
          
          if (selectedFields.roleInfo) {
            baseData.role = member.role;
            baseData.department = 'Sales'; // Would come from extended data
          }
          
          if (selectedFields.salaryInfo) {
            baseData.salary = member.salary || 0;
            baseData.hourlyRate = Math.round((member.salary || 0) / 2080 * 100) / 100; // Assuming 2080 work hours/year
          }
          
          if (selectedFields.permissionsInfo) {
            baseData.permissions = member.permissions.join(', ');
            baseData.permissionCount = member.permissions.length;
          }
          
          if (selectedFields.employmentInfo) {
            baseData.hireDate = member.hireDate.toLocaleDateString();
            baseData.employmentType = 'Full-time'; // Would come from extended data
            baseData.status = member.isActive ? 'Active' : 'Inactive';
          }
          
          if (selectedFields.performanceInfo) {
            baseData.lastLogin = member.lastLogin?.toLocaleDateString() || 'Never';
            baseData.daysSinceLogin = member.lastLogin ? 
              Math.floor((Date.now() - member.lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A';
          }
          
          if (selectedFields.timestamps) {
            baseData.createdDate = member.createdAt.toLocaleDateString();
            baseData.tenure = Math.floor((Date.now() - member.hireDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          
          return baseData;
        });
        filename = `staff_export_${dateStr}.${exportFormat}`;
        break;

      case 'summary':
        const summary = {
          totalStaff: filteredStaff.length,
          activeStaff: filteredStaff.filter(s => s.isActive).length,
          inactiveStaff: filteredStaff.filter(s => !s.isActive).length,
          adminCount: filteredStaff.filter(s => s.role === 'admin').length,
          managerCount: filteredStaff.filter(s => s.role === 'manager').length,
          cashierCount: filteredStaff.filter(s => s.role === 'cashier').length,
          totalPayroll: filteredStaff.reduce((sum, s) => sum + (s.salary || 0), 0),
          averageSalary: (filteredStaff.reduce((sum, s) => sum + (s.salary || 0), 0) / filteredStaff.length || 0).toFixed(2),
          averageTenure: Math.round(filteredStaff.reduce((sum, s) => 
            sum + (Date.now() - s.hireDate.getTime()) / (1000 * 60 * 60 * 24), 0) / filteredStaff.length || 0),
          recentLogins: filteredStaff.filter(s => s.lastLogin && 
            (Date.now() - s.lastLogin.getTime()) < 30 * 24 * 60 * 60 * 1000).length,
          newHires: filteredStaff.filter(s => 
            (Date.now() - s.hireDate.getTime()) < 90 * 24 * 60 * 60 * 1000).length,
          dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
          generatedAt: new Date().toISOString()
        };
        
        data = [summary];
        filename = `staff_summary_${dateStr}.${exportFormat}`;
        break;

      case 'payroll':
        data = filteredStaff.map(member => ({
          employeeId: member.id.slice(-8).toUpperCase(),
          name: member.name,
          role: member.role,
          department: 'Sales', // Would come from extended data
          employmentType: 'Full-time', // Would come from extended data
          annualSalary: member.salary || 0,
          monthlySalary: Math.round((member.salary || 0) / 12 * 100) / 100,
          hourlyRate: Math.round((member.salary || 0) / 2080 * 100) / 100,
          status: member.isActive ? 'Active' : 'Inactive',
          hireDate: member.hireDate.toLocaleDateString(),
          tenure: Math.floor((Date.now() - member.hireDate.getTime()) / (1000 * 60 * 60 * 24)),
          payrollEligible: member.isActive ? 'Yes' : 'No'
        }));
        filename = `staff_payroll_${dateStr}.${exportFormat}`;
        break;

      case 'performance':
        data = filteredStaff.map(member => ({
          employeeId: member.id.slice(-8).toUpperCase(),
          name: member.name,
          role: member.role,
          lastLogin: member.lastLogin?.toLocaleDateString() || 'Never',
          daysSinceLogin: member.lastLogin ? 
            Math.floor((Date.now() - member.lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A',
          permissionLevel: member.permissions.includes('all') ? 'Full Access' : 
                          member.permissions.length > 3 ? 'High' :
                          member.permissions.length > 1 ? 'Medium' : 'Limited',
          permissionCount: member.permissions.length,
          accountStatus: member.isActive ? 'Active' : 'Inactive',
          tenure: Math.floor((Date.now() - member.hireDate.getTime()) / (1000 * 60 * 60 * 24)),
          engagementScore: member.lastLogin ? 
            Math.max(0, 100 - Math.floor((Date.now() - member.lastLogin.getTime()) / (1000 * 60 * 60 * 24))) : 0,
          riskLevel: !member.lastLogin || (Date.now() - member.lastLogin.getTime()) > 30 * 24 * 60 * 60 * 1000 ? 'High' :
                    (Date.now() - member.lastLogin.getTime()) > 7 * 24 * 60 * 60 * 1000 ? 'Medium' : 'Low'
        }));
        filename = `staff_performance_${dateStr}.${exportFormat}`;
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
      
      toast.success(`Successfully exported ${exportType === 'staff' ? data.length : 1} record(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getExportPreview = () => {
    const filteredStaff = getFilteredStaff();
    
    switch (exportType) {
      case 'staff':
        return {
          count: filteredStaff.length,
          description: 'staff records with selected fields'
        };
      case 'summary':
        return {
          count: 1,
          description: 'comprehensive summary report with HR metrics'
        };
      case 'payroll':
        return {
          count: filteredStaff.length,
          description: 'payroll records with salary information'
        };
      case 'performance':
        return {
          count: filteredStaff.length,
          description: 'performance analytics and engagement metrics'
        };
      default:
        return { count: 0, description: '' };
    }
  };

  if (!isOpen) return null;

  const preview = getExportPreview();
  const filteredStaff = getFilteredStaff();

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
                Export Staff Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export staff data, payroll, and performance analytics in various formats
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
                  id: 'staff', 
                  label: 'Staff Records', 
                  icon: Users, 
                  desc: 'Complete employee profiles and information' 
                },
                { 
                  id: 'summary', 
                  label: 'HR Summary', 
                  icon: BarChart3, 
                  desc: 'Key HR metrics and organizational insights' 
                },
                { 
                  id: 'payroll', 
                  label: 'Payroll Report', 
                  icon: DollarSign, 
                  desc: 'Salary information and compensation data' 
                },
                { 
                  id: 'performance', 
                  label: 'Performance Analytics', 
                  icon: TrendingUp, 
                  desc: 'Engagement metrics and performance indicators' 
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
              Date Range (Hire Date)
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
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employment Type
                </label>
                <select
                  value={filters.employmentType}
                  onChange={(e) => setFilters({ ...filters, employmentType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Salary ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={filters.minSalary}
                  onChange={(e) => setFilters({ ...filters, minSalary: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Salary ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={filters.maxSalary}
                  onChange={(e) => setFilters({ ...filters, maxSalary: e.target.value })}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recent Login
                </label>
                <select
                  value={filters.recentLogin}
                  onChange={(e) => setFilters({ ...filters, recentLogin: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Staff</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeInactive}
                    onChange={(e) => setFilters({ ...filters, includeInactive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include inactive staff</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasPermissions}
                    onChange={(e) => setFilters({ ...filters, hasPermissions: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Has system permissions</span>
                </label>
              </div>
            </div>
          </div>

          {/* Field Selection (for staff records export) */}
          {exportType === 'staff' && (
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
              {selectedFields.sensitiveInfo && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-300">
                      Warning: Sensitive information selected
                    </span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    This export will contain confidential salary and personal information. Handle with care.
                  </p>
                </div>
              )}
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
                  {filteredStaff.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Staff</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredStaff.filter(s => s.isActive).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Active Staff</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${filteredStaff.reduce((sum, s) => sum + (s.salary || 0), 0).toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Payroll</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${Math.round(filteredStaff.reduce((sum, s) => sum + (s.salary || 0), 0) / filteredStaff.length || 0).toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Avg. Salary</div>
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
                  filters.role !== 'all' && `Role: ${filters.role}`,
                  filters.department !== 'all' && `Dept: ${filters.department}`,
                  filters.employmentType !== 'all' && `Type: ${filters.employmentType}`,
                  filters.minSalary && `Min: $${filters.minSalary}`,
                  filters.maxSalary && `Max: $${filters.maxSalary}`,
                  filters.includeInactive && 'Include inactive',
                  filters.hasPermissions && 'Has permissions',
                  filters.recentLogin !== 'all' && `Recent: ${filters.recentLogin}`
                ].filter(Boolean).join(', ') || 'None'}
              </strong></p>
              <p>• File will be downloaded automatically</p>
              {(exportType === 'payroll' || selectedFields.sensitiveInfo) && (
                <p className="text-red-600 dark:text-red-400">• <strong>Contains sensitive information - handle securely</strong></p>
              )}
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
                    role: 'all',
                    department: 'all',
                    employmentType: 'all',
                    minSalary: '',
                    maxSalary: '',
                    hasPermissions: false,
                    recentLogin: 'all',
                    groupBy: 'none'
                  });
                  setDateRange({
                    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

export default StaffExportModal;