import React, { useState } from 'react';
import { 
  X, 
  User, 
  Save, 
  RotateCcw, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Building,
  Hash,
  Eye,
  EyeOff,
  UserCheck,
  Key,
  Camera,
  Upload,
  Briefcase,
  GraduationCap,
  Award
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useStaffStore } from '../../store/staffStore';
import { StaffMember } from '../../types';
import toast from 'react-hot-toast';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaff?: StaffMember | null;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ 
  isOpen, 
  onClose, 
  editingStaff 
}) => {
  const { addStaff, updateStaff } = useStaffStore();
  
  const [formData, setFormData] = useState({
    name: editingStaff?.name || '',
    email: editingStaff?.email || '',
    phone: editingStaff?.phone || '',
    address: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    role: editingStaff?.role || 'cashier' as 'admin' | 'cashier' | 'manager',
    department: '',
    position: '',
    employeeId: '',
    hireDate: editingStaff?.hireDate.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    salary: editingStaff?.salary || 0,
    hourlyRate: 0,
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'intern',
    workSchedule: {
      monday: { start: '09:00', end: '17:00', isWorkingDay: true },
      tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
      wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
      thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
      friday: { start: '09:00', end: '17:00', isWorkingDay: true },
      saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
      sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
    },
    permissions: editingStaff?.permissions || [] as string[],
    bankDetails: {
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      accountType: 'checking' as 'checking' | 'savings'
    },
    taxInformation: {
      ssn: '',
      taxId: '',
      w4Status: 'single' as 'single' | 'married' | 'head-of-household'
    },
    education: {
      degree: '',
      institution: '',
      graduationYear: '',
      certifications: [] as string[]
    },
    experience: {
      previousEmployer: '',
      yearsOfExperience: 0,
      skills: [] as string[]
    },
    documents: {
      resume: null as File | null,
      idCopy: null as File | null,
      references: [] as string[]
    },
    isActive: editingStaff?.isActive ?? true,
    notes: '',
    profileImage: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newReference, setNewReference] = useState('');

  const roles = [
    { value: 'cashier', label: 'Cashier', permissions: ['sales', 'customers'] },
    { value: 'manager', label: 'Manager', permissions: ['sales', 'products', 'inventory', 'customers', 'reports'] },
    { value: 'admin', label: 'Administrator', permissions: ['all'] }
  ];

  const departments = [
    'Sales', 'Customer Service', 'Inventory', 'Management', 'IT', 'HR', 'Finance', 'Marketing'
  ];

  const allPermissions = [
    'sales', 'products', 'inventory', 'customers', 'orders', 'staff', 'reports', 'settings'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Staff name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    if (formData.salary < 0) newErrors.salary = 'Salary cannot be negative';
    if (formData.hourlyRate < 0) newErrors.hourlyRate = 'Hourly rate cannot be negative';

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
      const staffData = {
        ...formData,
        hireDate: new Date(formData.hireDate),
        lastLogin: editingStaff?.lastLogin
      };

      if (editingStaff) {
        updateStaff(editingStaff.id, staffData);
        toast.success('Staff member updated successfully');
      } else {
        addStaff(staffData);
        toast.success('Staff member added successfully');
      }
      handleClose();
    } catch (error) {
      toast.error('Failed to save staff member');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      role: 'cashier',
      department: '',
      position: '',
      employeeId: '',
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
      hourlyRate: 0,
      employmentType: 'full-time',
      workSchedule: {
        monday: { start: '09:00', end: '17:00', isWorkingDay: true },
        tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
        wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
        thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
        friday: { start: '09:00', end: '17:00', isWorkingDay: true },
        saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
        sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
      },
      permissions: [],
      bankDetails: {
        accountNumber: '',
        routingNumber: '',
        bankName: '',
        accountType: 'checking'
      },
      taxInformation: {
        ssn: '',
        taxId: '',
        w4Status: 'single'
      },
      education: {
        degree: '',
        institution: '',
        graduationYear: '',
        certifications: []
      },
      experience: {
        previousEmployer: '',
        yearsOfExperience: 0,
        skills: []
      },
      documents: {
        resume: null,
        idCopy: null,
        references: []
      },
      isActive: true,
      notes: '',
      profileImage: null
    });
    setErrors({});
    setNewSkill('');
    setNewCertification('');
    setNewReference('');
    onClose();
  };

  const handleRoleChange = (role: string) => {
    const selectedRole = roles.find(r => r.value === role);
    setFormData({
      ...formData,
      role: role as any,
      permissions: selectedRole?.permissions || []
    });
  };

  const togglePermission = (permission: string) => {
    if (formData.permissions.includes('all')) return; // Admin has all permissions
    
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter(p => p !== permission)
        : [...formData.permissions, permission]
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.experience.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        experience: {
          ...formData.experience,
          skills: [...formData.experience.skills, newSkill.trim()]
        }
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      experience: {
        ...formData.experience,
        skills: formData.experience.skills.filter(s => s !== skill)
      }
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.education.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        education: {
          ...formData.education,
          certifications: [...formData.education.certifications, newCertification.trim()]
        }
      });
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({
      ...formData,
      education: {
        ...formData.education,
        certifications: formData.education.certifications.filter(c => c !== cert)
      }
    });
  };

  const addReference = () => {
    if (newReference.trim() && !formData.documents.references.includes(newReference.trim())) {
      setFormData({
        ...formData,
        documents: {
          ...formData.documents,
          references: [...formData.documents.references, newReference.trim()]
        }
      });
      setNewReference('');
    }
  };

  const removeReference = (ref: string) => {
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        references: formData.documents.references.filter(r => r !== ref)
      }
    });
  };

  const generateEmployeeId = () => {
    const prefix = formData.role.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData({ ...formData, employeeId: `${prefix}-${suffix}` });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingStaff ? 'Update staff member information' : 'Create a comprehensive staff profile with all necessary details'}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Profile & Basic Info */}
            <div className="space-y-6">
              {/* Profile Image */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Profile Photo
                </h3>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <Button size="sm" variant="secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* Staff Status */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Staff Status</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active Employee
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Inactive employees cannot access the system
                </p>
              </div>

              {/* Quick Stats */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Employee Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Role:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300 capitalize">
                      {formData.role}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Type:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300 capitalize">
                      {formData.employmentType.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Salary:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300">
                      ${formData.salary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-400">Permissions:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-300">
                      {formData.permissions.includes('all') ? 'All' : formData.permissions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Columns - Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Full Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={errors.name}
                      placeholder="Enter full name"
                    />
                  </div>

                  <Input
                    label="Email Address *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    placeholder="employee@company.com"
                  />

                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                    placeholder="+1 (555) 123-4567"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Position/Title"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Job title or position"
                  />

                  <div>
                    <div className="flex items-center space-x-2">
                      <Input
                        label="Employee ID"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="Employee ID"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={generateEmployeeId}
                        className="mt-6"
                        title="Generate Employee ID"
                      >
                        <Hash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hire Date *
                    </label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.hireDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.hireDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hireDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Compensation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Annual Salary ($)"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    error={errors.salary}
                    placeholder="50000"
                  />

                  <Input
                    label="Hourly Rate ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    error={errors.hourlyRate}
                    placeholder="25.00"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  System Permissions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allPermissions.map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes('all') || formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        disabled={formData.permissions.includes('all')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.permissions.includes('all') && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Administrator role has access to all system features
                  </p>
                )}
              </div>

              {/* Education & Experience */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Education & Experience
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Degree/Qualification"
                      value={formData.education.degree}
                      onChange={(e) => setFormData({
                        ...formData,
                        education: { ...formData.education, degree: e.target.value }
                      })}
                      placeholder="Bachelor's, Master's, etc."
                    />

                    <Input
                      label="Institution"
                      value={formData.education.institution}
                      onChange={(e) => setFormData({
                        ...formData,
                        education: { ...formData.education, institution: e.target.value }
                      })}
                      placeholder="University/College name"
                    />

                    <Input
                      label="Graduation Year"
                      value={formData.education.graduationYear}
                      onChange={(e) => setFormData({
                        ...formData,
                        education: { ...formData.education, graduationYear: e.target.value }
                      })}
                      placeholder="2020"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Previous Employer"
                      value={formData.experience.previousEmployer}
                      onChange={(e) => setFormData({
                        ...formData,
                        experience: { ...formData.experience, previousEmployer: e.target.value }
                      })}
                      placeholder="Previous company name"
                    />

                    <Input
                      label="Years of Experience"
                      type="number"
                      min="0"
                      value={formData.experience.yearsOfExperience}
                      onChange={(e) => setFormData({
                        ...formData,
                        experience: { ...formData.experience, yearsOfExperience: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="5"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skills
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <Button size="sm" onClick={addSkill} disabled={!newSkill.trim()}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.experience.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Certifications
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                        placeholder="Add a certification..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <Button size="sm" onClick={addCertification} disabled={!newCertification.trim()}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.education.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertification(cert)}
                            className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-6">
              {/* Emergency Contact */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency Contact
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Contact Name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                    placeholder="Emergency contact name"
                  />

                  <Input
                    label="Contact Phone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })}
                    placeholder="Emergency contact phone"
                  />

                  <Input
                    label="Relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>
              </div>

              {/* Work Schedule */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Work Schedule
                </h3>
                <div className="space-y-2">
                  {Object.entries(formData.workSchedule).map(([day, schedule]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={schedule.isWorkingDay}
                        onChange={(e) => setFormData({
                          ...formData,
                          workSchedule: {
                            ...formData.workSchedule,
                            [day]: { ...schedule, isWorkingDay: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {day.substring(0, 3)}
                      </span>
                      {schedule.isWorkingDay && (
                        <>
                          <input
                            type="time"
                            value={schedule.start}
                            onChange={(e) => setFormData({
                              ...formData,
                              workSchedule: {
                                ...formData.workSchedule,
                                [day]: { ...schedule, start: e.target.value }
                              }
                            })}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="time"
                            value={schedule.end}
                            onChange={(e) => setFormData({
                              ...formData,
                              workSchedule: {
                                ...formData.workSchedule,
                                [day]: { ...schedule, end: e.target.value }
                              }
                            })}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensitive Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Sensitive Information
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  >
                    {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {showSensitiveInfo && (
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Confidential Information
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        This information is encrypted and only accessible to authorized personnel.
                      </p>
                    </div>

                    <Input
                      label="Social Security Number"
                      value={formData.taxInformation.ssn}
                      onChange={(e) => setFormData({
                        ...formData,
                        taxInformation: { ...formData.taxInformation, ssn: e.target.value }
                      })}
                      placeholder="XXX-XX-XXXX"
                      type="password"
                    />

                    <Input
                      label="Bank Account Number"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                      })}
                      placeholder="Account number"
                      type="password"
                    />

                    <Input
                      label="Routing Number"
                      value={formData.bankDetails.routingNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, routingNumber: e.target.value }
                      })}
                      placeholder="Routing number"
                    />

                    <Input
                      label="Bank Name"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                      })}
                      placeholder="Bank name"
                    />
                  </div>
                )}
              </div>

              {/* References */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  References
                </h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                      placeholder="Name, Company, Phone"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <Button size="sm" onClick={addReference} disabled={!newReference.trim()}>
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.documents.references.map((ref, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded text-sm"
                      >
                        <span className="text-gray-900 dark:text-white">{ref}</span>
                        <button
                          type="button"
                          onClick={() => removeReference(ref)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Additional Notes
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Additional notes about this staff member..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (editingStaff) {
                    // Reset to original values
                    setFormData({
                      name: editingStaff.name,
                      email: editingStaff.email,
                      phone: editingStaff.phone || '',
                      address: '',
                      dateOfBirth: '',
                      gender: '',
                      emergencyContact: {
                        name: '',
                        phone: '',
                        relationship: ''
                      },
                      role: editingStaff.role,
                      department: '',
                      position: '',
                      employeeId: '',
                      hireDate: editingStaff.hireDate.toISOString().split('T')[0],
                      salary: editingStaff.salary || 0,
                      hourlyRate: 0,
                      employmentType: 'full-time',
                      workSchedule: {
                        monday: { start: '09:00', end: '17:00', isWorkingDay: true },
                        tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
                        wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
                        thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
                        friday: { start: '09:00', end: '17:00', isWorkingDay: true },
                        saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
                        sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
                      },
                      permissions: editingStaff.permissions,
                      bankDetails: {
                        accountNumber: '',
                        routingNumber: '',
                        bankName: '',
                        accountType: 'checking'
                      },
                      taxInformation: {
                        ssn: '',
                        taxId: '',
                        w4Status: 'single'
                      },
                      education: {
                        degree: '',
                        institution: '',
                        graduationYear: '',
                        certifications: []
                      },
                      experience: {
                        previousEmployer: '',
                        yearsOfExperience: 0,
                        skills: []
                      },
                      documents: {
                        resume: null,
                        idCopy: null,
                        references: []
                      },
                      isActive: editingStaff.isActive,
                      notes: '',
                      profileImage: null
                    });
                  } else {
                    handleClose();
                  }
                  setErrors({});
                }}
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
                {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;