import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RootState } from '../store';
import { updateUser } from '../features/authSlice';
import api from '../services/api';
import { User, Mail, Phone, Lock, Upload, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setErrors({});

    try {
      const payload: any = { name, email, phone };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }

      const res = await api.put('/profile', payload);
      dispatch(updateUser(res.data.user));
      setPassword('');
      setPasswordConfirmation('');
      toast.success('Profile details updated successfully!');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        toast.error('Could not update profile details.');
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto) return;
    setUpdatingPhoto(true);

    const formData = new FormData();
    formData.append('photo', profilePhoto);

    try {
      const res = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateUser(res.data.user));
      setProfilePhoto(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile photo updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not upload photo.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">My Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Photo Upload Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-4xl text-blue-400 overflow-hidden shadow-xl">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : user?.profile_photo ? (
                <img src={`http://localhost:8000/storage/${user.profile_photo}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0).toUpperCase()
              )}
            </div>
            
            <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full cursor-pointer transition-colors shadow-lg">
              <Upload className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </label>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
          </div>

          {photoPreview && (
            <button
              onClick={handlePhotoUpload}
              disabled={updatingPhoto}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              {updatingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Save Photo Change
                </>
              )}
            </button>
          )}

          <div className="text-xs text-slate-500 w-full pt-4 border-t border-slate-800">
            Allowed formats: JPG, PNG, WEBP. Max size: 2MB.
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Profile Details</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 focus:border-blue-500 focus:outline-none sm:text-sm transition-all"
                  />
                </div>
                {errors.name && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.name[0]}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 focus:border-blue-500 focus:outline-none sm:text-sm transition-all"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.email[0]}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 focus:border-blue-500 focus:outline-none sm:text-sm transition-all"
                    placeholder="N/A"
                  />
                </div>
                {errors.phone && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.phone[0]}</span>
                )}
              </div>

            </div>

            <div className="border-t border-slate-800 pt-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Change Password</h3>
                <p className="text-xs text-slate-400 mt-1">Leave these fields blank if you don't want to change your password</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 focus:border-blue-500 focus:outline-none sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <span className="text-xs text-rose-500 mt-1 block">{errors.password[0]}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 focus:border-blue-500 focus:outline-none sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={updatingProfile}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {updatingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
