import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Mail, 
  TrendingUp, 
  Users, 
  Target, 
  Briefcase 
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Reports = () => {

  // Fetch Sales Performance report
  const { data: reportData = [], isLoading, error } = useQuery({
    queryKey: ['sales-performance-report'],
    queryFn: async () => {
      const res = await api.get('/reports/sales-performance');
      return res.data;
    }
  });

  const handleExportExcel = async () => {
    const toastId = toast.loading('Generating Excel report...');
    try {
      const res = await api.get('/reports/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel report downloaded!', { id: toastId });
    } catch (e) {
      toast.error('Could not export Excel report.', { id: toastId });
    }
  };

  const handleExportPdf = async () => {
    const toastId = toast.loading('Generating PDF report...');
    try {
      const res = await api.get('/reports/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'deals_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF report downloaded!', { id: toastId });
    } catch (e) {
      toast.error('Could not export PDF report.', { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            Reports & Analytics
          </h1>
          <p className="text-slate-400 mt-1">Export database logs and track team performance metrics</p>
        </div>

        {/* Export triggers */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs px-4 py-3 shadow-md transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export Customers (Excel)
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs px-4 py-3 shadow-md transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            Export Deals (PDF)
          </button>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-6">Sales Executives Performance</h3>
        
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl">
            Unauthorized access or error loading performance logs.
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No Sales Representative records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 px-6">Representative</th>
                  <th className="py-4 px-6">Customers</th>
                  <th className="py-4 px-6">Leads</th>
                  <th className="py-4 px-6">Deals Logged</th>
                  <th className="py-4 px-6">Won Deals</th>
                  <th className="py-4 px-6">Conversion Rate</th>
                  <th className="py-4 px-6 text-right">Revenue Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reportData.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-950/20 transition-colors">
                    
                    {/* User */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-sm">{row.name}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{row.email}</span>
                      </div>
                    </td>

                    {/* Total Customers */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                        <Users className="w-4 h-4 text-slate-500" />
                        {row.total_customers}
                      </div>
                    </td>

                    {/* Total Leads */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                        <Target className="w-4 h-4 text-slate-500" />
                        {row.total_leads}
                      </div>
                    </td>

                    {/* Total Deals */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        {row.total_deals}
                      </div>
                    </td>

                    {/* Won Deals */}
                    <td className="py-4 px-6 text-emerald-400 font-semibold text-sm">
                      {row.deals_won}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-300">{row.conversion_rate}%</span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(row.conversion_rate, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-4 px-6 text-right font-bold text-emerald-400 text-sm">
                      ₹{row.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
