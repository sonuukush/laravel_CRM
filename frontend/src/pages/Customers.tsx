import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  MapPin, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  Upload,
  Briefcase,
  AlertCircle,
  FileIcon,
  Download,
  Trash,
  X,
  Clock
} from 'lucide-react';
import type { RootState } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const { user, roles } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();

  const isAdmin = roles.includes('Admin');
  const isManager = roles.includes('Manager');
  const canDelete = isAdmin;

  // State filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [assignedTo, setAssignedTo] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modal control states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Form states for Create/Edit Customer
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'lead',
    pipeline_stage: 'New',
    assigned_to: '',
  });

  // Query: Users list (only for Admins/Managers to reassign)
  const { data: usersData } = useQuery({
    queryKey: ['sales-executives'],
    queryFn: async () => {
      const res = await api.get('/users?per_page=100');
      return res.data;
    },
    enabled: isAdmin || isManager,
  });
  const salesReps = usersData?.users?.data || [];

  // Query: Customers list
  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ['customers', search, status, assignedTo, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: {
          search,
          status,
          assigned_to: assignedTo,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
        }
      });
      return res.data;
    }
  });

  // Query: Single customer details for detail modal
  const { data: customerDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: async () => {
      const res = await api.get(`/customers/${selectedCustomerId}`);
      return res.data;
    },
    enabled: selectedCustomerId !== null && detailModalOpen,
  });

  // Mutation: Create Customer
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully!');
      setCreateModalOpen(false);
      resetCustomerForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    }
  });

  // Mutation: Edit Customer
  const editCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await api.put(`/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer details updated!');
      setEditModalOpen(false);
      resetCustomerForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    }
  });

  // Mutation: Delete Customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not delete customer');
    }
  });

  // Form states for nested timelines / deals / documents inside detail modal
  const [activityForm, setActivityForm] = useState({
    type: 'call',
    description: '',
    due_date: '',
    status: 'pending'
  });
  const [dealForm, setDealForm] = useState({
    title: '',
    amount: '',
    stage: 'Prospecting',
    closing_date: ''
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Tab state inside detail modal
  const [detailTab, setDetailTab] = useState<'activities' | 'deals' | 'documents'>('activities');

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      status: 'lead',
      pipeline_stage: 'New',
      assigned_to: '',
    });
  };

  const handleCreateOpen = () => {
    resetCustomerForm();
    setCreateModalOpen(true);
  };

  const handleEditOpen = (customer: any) => {
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || '',
      address: customer.address || '',
      status: customer.status,
      pipeline_stage: customer.pipeline_stage || 'New',
      assigned_to: customer.assigned_to || '',
    });
    setSelectedCustomerId(customer.id);
    setEditModalOpen(true);
  };

  const handleDetailOpen = (id: number) => {
    setSelectedCustomerId(id);
    setDetailTab('activities');
    setDetailModalOpen(true);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModalOpen && selectedCustomerId) {
      editCustomerMutation.mutate({ id: selectedCustomerId, data: customerForm });
    } else {
      createCustomerMutation.mutate(customerForm);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer ${name}?`)) {
      deleteCustomerMutation.mutate(id);
    }
  };

  // Nest Actions inside Detail Modal
  const logActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/activities', { ...data, customer_id: selectedCustomerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      toast.success('Activity logged successfully');
      setActivityForm({ type: 'call', description: '', due_date: '', status: 'pending' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not log activity');
    }
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/deals', { ...data, customer_id: selectedCustomerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      toast.success('Deal created successfully');
      setDealForm({ title: '', amount: '', stage: 'Prospecting', closing_date: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not create deal');
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      toast.success('Document uploaded successfully');
      setDocumentFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      toast.success('Document deleted');
    }
  });

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentFile || !selectedCustomerId) return;
    const fd = new FormData();
    fd.append('customer_id', String(selectedCustomerId));
    fd.append('file', documentFile);
    uploadDocMutation.mutate(fd);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const customersList = customersData?.data || [];
  const meta = customersData || {};

  return (
    <div className="space-y-6">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Customers</h1>
          <p className="text-slate-400 mt-1">Manage accounts, leads status, and contact info</p>
        </div>
        
        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-3 shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 text-sm text-slate-300 rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">All</option>
              <option value="lead">Leads Only</option>
              <option value="customer">Customers Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Assigned Rep Filter (Admin/Manager only) */}
          {(isAdmin || isManager) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assigned to:</span>
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
                className="bg-slate-950 border border-slate-800 text-sm text-slate-300 rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="all">All Sales</option>
                {salesReps.map((rep: any) => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400">Failed to load customers data.</div>
        ) : customersList.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">No customers or leads found matching the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-200" onClick={() => handleSort('name')}>Name</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-200" onClick={() => handleSort('company')}>Company</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-200" onClick={() => handleSort('status')}>Status</th>
                  <th className="py-4 px-6">Assigned To</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {customersList.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-slate-950/20 transition-colors">
                    
                    {/* Name & Email */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-sm">{customer.name}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{customer.email}</span>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-4 px-6 text-slate-300 text-sm">
                      {customer.company || <span className="text-slate-600">-</span>}
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-6 text-slate-300 text-sm">{customer.phone}</td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide
                        ${customer.status === 'customer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                        ${customer.status === 'lead' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                        ${customer.status === 'inactive' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : ''}
                      `}>
                        {customer.status}
                      </span>
                    </td>

                    {/* Assigned Sales Exec */}
                    <td className="py-4 px-6 text-slate-300 text-sm">
                      {customer.assigned_to ? (
                        <span className="font-medium text-slate-300">{customer.assigned_to_name || customer.assigned_to?.name}</span>
                      ) : (
                        <span className="text-slate-600">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleDetailOpen(customer.id)}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
                        title="View Details & Timeline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => handleEditOpen(customer)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !error && meta.total > 0 && (
          <div className="bg-slate-950/40 border-t border-slate-800 px-6 py-4 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{meta.from}</span> to <span className="font-semibold text-slate-200">{meta.to}</span> of <span className="font-semibold text-slate-200">{meta.total}</span> entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Customer Modal */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
              {editModalOpen ? 'Edit Customer Details' : 'Create New Customer'}
            </h2>

            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Vikas Gupta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="vikas@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="9911223344"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Vikas Traders Pvt Ltd"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {customerForm.status === 'lead' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Lead Stage</label>
                    <select
                      value={customerForm.pipeline_stage}
                      onChange={(e) => setCustomerForm({ ...customerForm, pipeline_stage: e.target.value })}
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                )}

                {(isAdmin || isManager) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Assigned Sales Executive</label>
                    <select
                      value={customerForm.assigned_to}
                      onChange={(e) => setCustomerForm({ ...customerForm, assigned_to: e.target.value })}
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select Representative</option>
                      {salesReps.map((rep: any) => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Address Details</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  rows={2}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Street details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }}
                  className="rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-sm font-semibold"
                >
                  {editModalOpen ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detailed Modal (Task 16, 17, 18) */}
      {detailModalOpen && selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl relative flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/20">
              {loadingDetail ? (
                <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-white">{customerDetail?.name}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>Company: <strong className="text-slate-200">{customerDetail?.company || 'N/A'}</strong></span>
                    <span>Status: <strong className="text-blue-400 capitalize">{customerDetail?.status}</strong></span>
                    <span>Assigned Rep: <strong className="text-slate-200">{customerDetail?.assigned_to?.name || 'Unassigned'}</strong></span>
                  </p>
                </div>
              )}
              <button 
                onClick={() => { setDetailModalOpen(false); setSelectedCustomerId(null); }}
                className="text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-800 bg-slate-950/10">
              <button
                onClick={() => setDetailTab('activities')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
                  ${detailTab === 'activities' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}
                `}
              >
                <Calendar className="w-4 h-4" />
                Follow-ups & Timeline
              </button>
              <button
                onClick={() => setDetailTab('deals')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
                  ${detailTab === 'deals' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}
                `}
              >
                <Briefcase className="w-4 h-4" />
                Deals
              </button>
              <button
                onClick={() => setDetailTab('documents')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2
                  ${detailTab === 'documents' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}
                `}
              >
                <FileText className="w-4 h-4" />
                Documents
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {loadingDetail ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
              ) : (
                <>
                  
                  {/* TAB 1: FOLLOW UPS TIMELINE */}
                  {detailTab === 'activities' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Logging Form */}
                      <div className="md:col-span-1 bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-4">
                        <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Log New Activity</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                            <select
                              value={activityForm.type}
                              onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                            >
                              <option value="call">Call</option>
                              <option value="meeting">Meeting</option>
                              <option value="email">Email</option>
                              <option value="note">Note</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                            <input
                              type="date"
                              value={activityForm.due_date}
                              onChange={(e) => setActivityForm({ ...activityForm, due_date: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                            <textarea
                              rows={3}
                              value={activityForm.description}
                              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                              placeholder="Follow up for contract renewal..."
                            />
                          </div>

                          <button
                            onClick={() => logActivityMutation.mutate(activityForm)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Log Activity
                          </button>
                        </div>
                      </div>

                      {/* Timeline logs */}
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="font-bold text-sm text-slate-200">Activity History</h4>
                        {customerDetail?.activities?.length === 0 ? (
                          <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl">
                            No logged follow-ups.
                          </div>
                        ) : (
                          <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-4">
                            {customerDetail.activities.map((a: any) => (
                              <div key={a.id} className="relative">
                                {/* Dot indicator */}
                                <div className="absolute -left-[21px] mt-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-blue-500" />
                                
                                <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-850">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-semibold text-blue-400 capitalize px-2 py-0.5 rounded bg-blue-500/10">{a.type}</span>
                                    <span className="text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-slate-300 text-xs mt-2 font-medium">{a.description}</p>
                                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-850 text-[10px] text-slate-500">
                                    <span>Logged by: {a.user?.name}</span>
                                    {a.due_date && <span>Due: <strong className="text-amber-500">{a.due_date}</strong></span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 2: DEALS */}
                  {detailTab === 'deals' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Deal Form */}
                      <div className="md:col-span-1 bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-4">
                        <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Create New Deal</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Deal Title</label>
                            <input
                              type="text"
                              value={dealForm.title}
                              onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                              placeholder="AMC Contract Renewal"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                            <input
                              type="number"
                              value={dealForm.amount}
                              onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                              placeholder="150000"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Stage</label>
                            <select
                              value={dealForm.stage}
                              onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                            >
                              <option value="Prospecting">Prospecting</option>
                              <option value="Qualification">Qualification</option>
                              <option value="Negotiation">Negotiation</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Closing Date</label>
                            <input
                              type="date"
                              value={dealForm.closing_date}
                              onChange={(e) => setDealForm({ ...dealForm, closing_date: e.target.value })}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none"
                            />
                          </div>

                          <button
                            onClick={() => createDealMutation.mutate(dealForm)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Create Deal
                          </button>
                        </div>
                      </div>

                      {/* Deals List */}
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="font-bold text-sm text-slate-200">Opportunities & Deals</h4>
                        {customerDetail?.deals?.length === 0 ? (
                          <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl">
                            No deals linked to this customer.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {customerDetail.deals.map((d: any) => (
                              <div key={d.id} className="bg-slate-950/30 p-4 border border-slate-850 rounded-xl space-y-3">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-bold text-xs text-slate-200 truncate pr-2">{d.title}</h5>
                                  <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-semibold uppercase
                                    ${d.stage === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
                                    ${d.stage === 'Lost' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : ''}
                                    ${d.stage !== 'Won' && d.stage !== 'Lost' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                                  `}>
                                    {d.stage}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-slate-850/60 pt-2.5">
                                  <span className="text-slate-400 font-semibold">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                                  {d.closing_date && (
                                    <span className="text-slate-500 text-[10px] flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {d.closing_date}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 3: DOCUMENTS */}
                  {detailTab === 'documents' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Document Form */}
                      <form onSubmit={handleUploadDoc} className="md:col-span-1 bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-4">
                        <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Upload Document</h4>
                        
                        <div className="space-y-4">
                          <div className="border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 transition-colors relative">
                            <Upload className="w-8 h-8 text-slate-500 mb-2" />
                            <span className="text-[11px] text-slate-400">Choose file or drag here</span>
                            <span className="text-[9px] text-slate-500 mt-1">PDF, JPG, PNG, DOCX (Max 5MB)</span>
                            <input 
                              type="file" 
                              required 
                              onChange={(e) => { if (e.target.files) setDocumentFile(e.target.files[0]); }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                          </div>

                          {documentFile && (
                            <div className="flex items-center justify-between bg-slate-900 p-2.5 border border-slate-800 rounded-lg text-xs">
                              <span className="text-slate-300 font-medium truncate pr-2">{documentFile.name}</span>
                              <button type="button" onClick={() => setDocumentFile(null)} className="text-rose-400 hover:text-rose-300">Remove</button>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={!documentFile || uploadDocMutation.isPending}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {uploadDocMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upload File'}
                          </button>
                        </div>
                      </form>

                      {/* Documents List */}
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="font-bold text-sm text-slate-200">Customer Files</h4>
                        {customerDetail?.documents?.length === 0 ? (
                          <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/20 border border-slate-850 rounded-xl">
                            No documents uploaded yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {customerDetail.documents.map((d: any) => (
                              <div key={d.id} className="flex items-center justify-between bg-slate-950/30 p-3.5 border border-slate-850 rounded-xl hover:border-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                  <FileIcon className="w-5 h-5 text-blue-400" />
                                  <div>
                                    <h5 className="font-bold text-xs text-slate-300">{d.file_name}</h5>
                                    <span className="text-[10px] text-slate-500 font-medium">Uploaded by {d.uploaded_by?.name || 'User'}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <a 
                                    href={`http://localhost:8000/storage/${d.file_path}`} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                                    title="Download File"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={() => { if (window.confirm('Delete this document?')) deleteDocMutation.mutate(d.id); }}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                    title="Delete File"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
