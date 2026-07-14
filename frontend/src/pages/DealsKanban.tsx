import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { 
  Plus, 
  Search, 
  Loader2, 
  DollarSign, 
  Calendar,
  User,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STAGES = ['Prospecting', 'Qualification', 'Negotiation', 'Won', 'Lost'];

// Droppable Column Component
interface ColumnProps {
  id: string;
  title: string;
  count: number;
  totalAmount: number;
  children: React.ReactNode;
}

const KanbanColumn: React.FC<ColumnProps> = ({ id, title, count, totalAmount, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col w-full min-w-[270px] bg-slate-900 border rounded-2xl p-4 transition-all duration-200 min-h-[500px]
        ${isOver ? 'border-blue-500 bg-slate-900/50 scale-[1.01]' : 'border-slate-800'}
      `}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-200">{title}</h3>
          <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 block">
            ₹{totalAmount.toLocaleString('en-IN')} &bull; {count} {count === 1 ? 'deal' : 'deals'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
        {children}
      </div>
    </div>
  );
};

// Draggable Card Component
interface CardProps {
  deal: any;
}

const KanbanCard: React.FC<CardProps> = ({ deal }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(deal.id),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-all select-none relative overflow-hidden group
        ${isDragging ? 'opacity-40 border-blue-500 border-2' : ''}
      `}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />

      <h4 className="font-bold text-xs text-slate-200 line-clamp-1 group-hover:text-blue-400 transition-colors">
        {deal.title}
      </h4>
      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
        {deal.customer ? deal.customer.name : 'N/A'}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-900 text-[10px] text-slate-500">
        <span className="font-bold text-slate-300">
          ₹{Number(deal.amount).toLocaleString('en-IN')}
        </span>
        
        {deal.closing_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {deal.closing_date}
          </span>
        )}
      </div>

      {deal.assigned_to && (
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-900/60 text-[9px] text-slate-500">
          <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[8px] text-blue-400 overflow-hidden">
            {deal.assigned_to?.profile_photo ? (
              <img src={`http://localhost:8000/storage/${deal.assigned_to.profile_photo}`} alt="" className="w-full h-full object-cover" />
            ) : (
              deal.assigned_to?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <span className="truncate">{deal.assigned_to?.name}</span>
        </div>
      )}
    </div>
  );
};

// Main Kanban View
const DealsKanban = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch all deals
  const { data: deals = [], isLoading, error } = useQuery({
    queryKey: ['deals', search],
    queryFn: async () => {
      const res = await api.get('/deals', {
        params: { search }
      });
      return res.data;
    }
  });

  // Patch stage Mutation (Drag & Drop stage change)
  const patchStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: number; stage: string }) => {
      return await api.patch(`/deals/${id}/stage`, { stage });
    },
    // Optimistic UI updates
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['deals', search] });
      
      const previousDeals = queryClient.getQueryData(['deals', search]);
      
      queryClient.setQueryData(['deals', search], (old: any) => {
        if (!old) return [];
        return old.map((d: any) => d.id === id ? { ...d, stage } : d);
      });
      
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', search], context.previousDeals);
      }
      toast.error('Could not update deal stage');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Deal stage updated successfully');
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const dealId = Number(active.id);
    const targetStage = String(over.id);

    const deal = deals.find((d: any) => d.id === dealId);
    if (!deal) return;

    // Do nothing if dropped in same column
    if (deal.stage === targetStage) return;

    patchStageMutation.mutate({ id: dealId, stage: targetStage });
  };

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
        Error loading deals. Check backend connection.
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-auto min-h-screen">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-500" />
            Deals Board
          </h1>
          <p className="text-slate-400 mt-1">Drag and drop deals between stage columns to update pipeline status</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search deals by title or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Kanban Columns context wrapper */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 pb-8 overflow-x-auto select-none">
          {STAGES.map((stage) => {
            const columnDeals = deals.filter((d: any) => d.stage === stage);
            const totalAmount = columnDeals.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
            
            return (
              <KanbanColumn 
                key={stage} 
                id={stage} 
                title={stage} 
                count={columnDeals.length} 
                totalAmount={totalAmount}
              >
                {columnDeals.map((deal: any) => (
                  <KanbanCard key={deal.id} deal={deal} />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
      </DndContext>

    </div>
  );
};

export default DealsKanban;
