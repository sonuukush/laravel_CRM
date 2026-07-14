import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/authSlice';
import api, { getCsrfCookie } from '../services/api';
import { User, Lock, Mail, Phone, Loader2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await getCsrfCookie();

      const res = await api.post('/register', {
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation,
      });

      const { user, token } = res.data;

      // Assign the credentials. Registered users get default roles which Spatie outputs.
      // Roles: ['Sales Executive']
      dispatch(setCredentials({ 
        user, 
        token, 
        roles: ['Sales Executive'], 
        permissions: ['customers.view', 'customers.create', 'customers.edit', 'leads.view', 'leads.create', 'leads.edit', 'deals.view', 'deals.create', 'deals.edit', 'activities.view', 'activities.create', 'activities.edit', 'documents.upload']
      }));

      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response && err.response.data) {
        if (err.response.status === 422) {
          setErrors(err.response.data.errors || {});
        } else {
          toast.error(err.response.data.message || 'Registration failed');
        }
      } else {
        toast.error('Something went wrong. Check connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Decorative Gradients */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Join the Mini CRM team as Sales Executive
          </p>
        </div>

        <form className="mt-8 space-y-4 relative" onSubmit={handleRegister}>
          
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full rounded-xl bg-slate-950 border ${errors.name ? 'border-rose-500' : 'border-slate-800'} py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all`}
                  placeholder="Rohit Sharma"
                />
              </div>
              {errors.name && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.name[0]}</span>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-xl bg-slate-950 border ${errors.email ? 'border-rose-500' : 'border-slate-800'} py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.email[0]}</span>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all"
                  placeholder="9876543210"
                />
              </div>
              {errors.phone && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.phone[0]}</span>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full rounded-xl bg-slate-950 border ${errors.password ? 'border-rose-500' : 'border-slate-800'} py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.password[0]}</span>
              )}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password_confirmation"
                  type="password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-slate-400">Already registered? </span>
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Sign in here
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;
