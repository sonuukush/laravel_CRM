import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Briefcase, 
  BarChart3, 
  UserSquare2, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Check, 
  CheckCheck,
  Building,
  Palette
} from 'lucide-react';
import type { RootState } from '../store';
import { logout } from '../features/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, roles } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('crm_theme') || 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  const isAdmin = roles.includes('Admin');
  const isManager = roles.includes('Manager');

  // Fetch Notifications
  const { data: notificationData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    refetchInterval: 15000, // Poll every 15s for new notifications
  });

  // Mark single read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Sales Executive'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['Admin', 'Manager', 'Sales Executive'] },
    { name: 'Leads', path: '/leads', icon: Target, roles: ['Admin', 'Manager', 'Sales Executive'] },
    { name: 'Deals', path: '/deals', icon: Briefcase, roles: ['Admin', 'Manager', 'Sales Executive'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
    { name: 'Users', path: '/users', icon: UserSquare2, roles: ['Admin'] },
    { name: 'Profile', path: '/profile', icon: User, roles: ['Admin', 'Manager', 'Sales Executive'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.some(role => roles.includes(role))
  );

  const notifications = notificationData?.notifications?.data || [];
  const unreadCount = notificationData?.unread_count || 0;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Mini CRM
            </span>
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-slate-200" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge Info */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 overflow-hidden">
              {user?.profile_photo ? (
                <img src={`http://localhost:8000/storage/${user.profile_photo}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate">{user?.name}</h4>
              <span className={`inline-block text-[10px] px-2 py-0.5 mt-1 rounded font-medium 
                ${isAdmin ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : ''}
                ${isManager ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                ${!isAdmin && !isManager ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
              `}>
                {roles[0] || 'Sales Executive'}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 pl-3' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Navbar */}
        <header className="flex items-center justify-between lg:justify-end px-6 py-4 bg-slate-900 border-b border-slate-800 z-30">
          
          {/* Hamburger Menu Mobile */}
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            
            {/* Theme Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setThemeOpen(!themeOpen)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors relative"
                title="Change Theme"
              >
                <Palette className="w-5 h-5" />
              </button>

              {themeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-2 divide-y divide-slate-850">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Select Theme
                    </div>
                    <div className="py-1">
                      {[
                        { id: 'dark', name: 'Dark Theme', dotColor: 'bg-blue-500' },
                        { id: 'light', name: 'Light Theme', dotColor: 'bg-slate-400' },
                        { id: 'cyan', name: 'Cyan Theme', dotColor: 'bg-sky-400' },
                        { id: 'emerald', name: 'Emerald Theme', dotColor: 'bg-emerald-400' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setThemeOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left transition-colors
                            ${theme === t.id ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-850 hover:text-slate-100'}
                          `}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${t.dotColor}`} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-2">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            markAllReadMutation.mutate();
                            setNotificationOpen(false);
                          }}
                          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n: any) => (
                          <div 
                            key={n.id} 
                            className={`px-4 py-3 text-xs transition-colors flex items-start gap-2.5 ${!n.read_at ? 'bg-slate-800/40' : ''}`}
                          >
                            <div className="flex-1">
                              <p className="text-slate-200">{n.data?.message || 'New update received'}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.read_at && (
                              <button 
                                onClick={() => markReadMutation.mutate(n.id)}
                                className="p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Quick Circle */}
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700 overflow-hidden">
                {user?.profile_photo ? (
                  <img src={`http://localhost:8000/storage/${user.profile_photo}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default Layout;
