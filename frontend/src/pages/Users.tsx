import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  UserSquare2, 
  Shield, 
  Mail, 
  Phone,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Users = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Sales Executive',
    status: 'active'
  });

  // Fetch Users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { page }
      });
      return res.data;
    }
  });

  const usersList = usersData?.users?.data || [];
  const rolesList = usersData?.roles || ['Admin', 'Manager', 'Sales Executive'];
  const meta = usersData?.users || {};

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully!');
      setCreateModalOpen(false);
      resetUserForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  });

  // Edit User Mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully!');
      setEditModalOpen(false);
      resetUserForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  });

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'Sales Executive',
      status: 'active'
    });
  };

  const handleCreateOpen = () => {
    resetUserForm();
    setCreateModalOpen(true);
  };

  const handleEditOpen = (user: any) => {
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.roles[0]?.name || 'Sales Executive',
      status: user.status
    });
    setSelectedUserId(user.id);
    setEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModalOpen && selectedUserId) {
      editUserMutation.mutate({ id: selectedUserId, data: userForm });
    } else {
      createUserMutation.mutate(userForm);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserSquare2 className="w-8 h-8 text-blue-500" />
            Users Management
          </h1>
          <p className="text-slate-400 mt-1">Admin Panel: Edit user accounts, status, and system access levels</p>
        </div>
        
        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-3 shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl">
            Unauthorized access or error loading users.
          </div>
        ) : usersList.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">No user accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {usersList.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-950/20 transition-colors">
                    
                    {/* User Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 overflow-hidden">
                          {user.profile_photo ? (
                            <img src={`http://localhost:8000/storage/${user.profile_photo}`} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 text-sm">{user.name}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-6 text-slate-300 text-sm">{user.phone || '-'}</td>

                    {/* Role Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider
                        ${user.roles[0]?.name === 'Admin' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : ''}
                        ${user.roles[0]?.name === 'Manager' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                        ${user.roles[0]?.name === 'Sales Executive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
                      `}>
                        <Shield className="w-3 h-3" />
                        {user.roles[0]?.name || 'No Role'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                        ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}
                      `}>
                        {user.status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {user.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleEditOpen(user)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Create / Edit User Modal */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative p-6">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
              {editModalOpen ? 'Edit User Details' : 'Create New User Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Rohit Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="admin@minicrm.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required={!editModalOpen}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder={editModalOpen ? 'Leave blank to keep current' : '••••••••'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                  >
                    {rolesList.map((r: string) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  {editModalOpen ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
