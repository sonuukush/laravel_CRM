import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Phone, 
  Mail, 
  Calendar, 
  FileText,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    }
  });

  // Mark activity as done mutation
  const completeActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/activities/${id}`, { status: 'done' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Activity marked as completed!');
    },
    onError: () => {
      toast.error('Could not complete activity.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400">
        Error loading dashboard statistics. Check backend connection.
      </div>
    );
  }

  const { stats, recent_activities, monthly_revenue, lead_status } = data;

  const statCards = [
    { name: 'Total Customers', value: stats.total_customers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { name: 'Active Leads', value: stats.total_leads, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { name: 'Total Revenue', value: `₹${stats.total_revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Deals Won', value: stats.deals_won, icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    { name: 'Deals Lost', value: stats.deals_lost, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    { name: 'Open Deals', value: stats.deals_open, icon: AlertCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  ];

  // Pie chart colors
  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      default: return FileText;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-500/20 text-blue-400';
      case 'email': return 'bg-emerald-500/20 text-emerald-400';
      case 'meeting': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Real-time summaries and conversion metrics</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className={`bg-slate-900 border p-5 rounded-2xl flex flex-col justify-between ${card.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-base font-bold text-white">Monthly Revenue Trend</h3>
            <p className="text-xs text-slate-400 mt-1">Revenue closed in the current calendar year</p>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_revenue} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Leads Pipeline Stage</h3>
            <p className="text-xs text-slate-400 mt-1">Leads split by status stage</p>
          </div>
          <div className="h-56 mt-4 relative flex items-center justify-center">
            {lead_status.length === 0 ? (
              <div className="text-slate-500 text-xs">No lead status data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lead_status}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {lead_status.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(value) => [value, 'Leads']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={10} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[11px] text-slate-400 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Recent Activities Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-white">Recent Activities & Follow-ups</h3>
            <p className="text-xs text-slate-400 mt-1">Last 5 logged follow-ups and meetings</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700 font-medium">
            Active List
          </span>
        </div>

        <div className="space-y-4">
          {recent_activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No recent follow-ups logged.
            </div>
          ) : (
            recent_activities.map((activity: any) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              const isPending = activity.status === 'pending';
              
              return (
                <div key={activity.id} className="flex items-start justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-colors">
                  <div className="flex gap-4">
                    <div className={`p-2.5 rounded-lg ${colorClass} self-start`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">{activity.description}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Customer: <span className="text-blue-400 font-medium">{activity.customer?.name || 'N/A'}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Logged by {activity.user?.name || 'System'}
                        </span>
                        {activity.due_date && (
                          <span className="flex items-center gap-1 text-amber-500/80">
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {activity.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <button
                        onClick={() => completeActivityMutation.mutate(activity.id)}
                        disabled={completeActivityMutation.isPending}
                        className="text-xs bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        Mark as Done
                      </button>
                    ) : (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-semibold block">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
