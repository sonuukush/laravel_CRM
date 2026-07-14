import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Target, 
  ArrowRightLeft, 
  Sparkles, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock
} from 'lucide-react';
import type { RootState } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';

const Leads = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [page, setPage] = useState(1);

  // Fetch Leads (status = lead)
  const { data: leadsData, isLoading, error } = useQuery({
    queryKey: ['leads', search, stage, page],
    queryFn: async () => {
      const res = await api.get('/leads', {
        params: {
          search,
          stage,
          page,
        }
      });
      return res.data;
    }
  });

  // Convert to Customer Mutation
  const convertMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.put(`/leads/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Lead converted to Customer successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Conversion failed');
    }
  });

  const leadsList = leadsData?.data || [];
  const meta = leadsData || {};

  const handleConvert = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to convert lead ${name} to customer?`)) {
      convertMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Leads Pipeline</h1>
        <p className="text-slate-400 mt-1">Nurture and convert leads through pipeline stages</p>
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
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Pipeline Stage Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pipeline Stage:</span>
          <select
            value={stage}
            onChange={(e) => { setStage(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 text-sm text-slate-300 rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">All Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400">Failed to load leads data.</div>
        ) : leadsList.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">No leads found in this stage.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 px-6">Lead Name</th>
                  <th className="py-4 px-6">Company</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Stage</th>
                  <th className="py-4 px-6">Created By</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {leadsList.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-950/20 transition-colors">
                    
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-sm">{lead.name}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{lead.email}</span>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-4 px-6 text-slate-300 text-sm">{lead.company || '-'}</td>

                    {/* Phone */}
                    <td className="py-4 px-6 text-slate-300 text-sm">{lead.phone}</td>

                    {/* Stage Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider
                        ${lead.pipeline_stage === 'New' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                        ${lead.pipeline_stage === 'Contacted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                        ${lead.pipeline_stage === 'Qualified' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : ''}
                        ${lead.pipeline_stage === 'Converted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                        ${lead.pipeline_stage === 'Lost' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : ''}
                      `}>
                        {lead.pipeline_stage}
                      </span>
                    </td>

                    {/* Created By */}
                    <td className="py-4 px-6 text-slate-300 text-sm">{lead.created_by?.name || 'System'}</td>

                    {/* Convert Button */}
                    <td className="py-4 px-6 text-right">
                      {lead.pipeline_stage !== 'Converted' ? (
                        <button
                          onClick={() => handleConvert(lead.id, lead.name)}
                          disabled={convertMutation.isPending}
                          className="inline-flex items-center gap-1.5 text-xs bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 px-3.5 py-2 rounded-xl font-semibold transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Convert
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold italic">Converted</span>
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

    </div>
  );
};

export default Leads;
