'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { STANDARD_SLOTS } from '@/lib/slot-utils';
import EditScheduleModal from './EditScheduleModal';
import SlotLoadViz from './SlotLoadViz';
import { TimeSlot } from '@/types/slot';
import { RefreshCw, Clock, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SlotsTimings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 🔹 FETCH SLOTS FROM DB
  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/admin/timeslots/today', { cache: 'no-store' });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setSlots(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load slots:', error);
      toast.error('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 FORCE RECONCILE (Self-Healing)
  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/slots/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      
      const result = await res.json();
      toast.success(result.message || 'System reconciled successfully!');
      
      // Refresh local data
      await fetchSlots();
    } catch (error) {
      toast.error('Failed to sync slot data');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSlots();

    // 🔹 Real-time updates via WebSockets
    const socket = getSocket();
    socket.on('timeslot:update', (updatedSlots: unknown[]) => {
      fetchSlots(); // Re-fetch to ensure full data sync
    });

    return () => {
      socket.off('timeslot:update');
    };
  }, []);

  const getStatusConfig = (status: string, percentage: number) => {
    const s = status.toLowerCase();
    if (s === 'full' || percentage >= 100) return {
      label: 'FULL - OVERLOADED',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      bar: 'bg-red-500',
      icon: <AlertCircle className="h-3 w-3" />
    };
    if (s === 'busy' || percentage >= 70) return {
      label: 'BUSY - SLIGHT DELAY',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      bar: 'bg-amber-500',
      icon: <Clock className="h-3 w-3" />
    };
    return {
      label: 'OPEN - OPTIMAL',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      bar: 'bg-emerald-500',
      icon: <ShieldCheck className="h-3 w-3" />
    };
  };

  const handleSaveSchedule = async (updatedSlots: TimeSlot[]) => {
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSlots),
      });

      if (!res.ok) throw new Error('Save failed');

      setSlots(updatedSlots);
      toast.success('Manual overrides applied!');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 animate-pulse font-medium">Calculating live kitchen load...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Slot Load Management
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-gray-400 text-sm">
                Real-time monitoring of kitchen capacity and scheduling.
             </p>
             <span className="h-1 w-1 rounded-full bg-gray-600" />
             <p className="text-xs text-gray-500 italic">
                Last updated: {lastRefresh.toLocaleTimeString()}
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                onClick={handleForceSync}
                disabled={isSyncing}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 h-10"
            >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Force Reconcile'}
            </Button>
            
            <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 rounded-lg shadow-lg shadow-amber-900/20"
            >
                Edit Capacity
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - STATS & VIZ */}
        <div className="lg:col-span-1 space-y-6">
          <div className="h-[400px]">
            <SlotLoadViz slots={slots} />
          </div>

          <div className="relative group overflow-hidden glass-surface p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="h-12 w-12 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300">Load Optimization</h3>
            <p className="text-3xl font-black mt-2 text-white">
                {Math.round(slots.reduce((a, b) => a + (b.percentage || 0), 0) / (slots.length || 1))}%
            </p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
                Overall Daily Utilization
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - LIVE FEED */}
        <div className="lg:col-span-2">
          <div className="glass-surface p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Live Load Feed</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  DYNAMIC
                </span>
              </div>
              
              <div className="flex gap-4 text-[10px] font-bold text-gray-500">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> OPTIMAL</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> BUSY</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> FULL</div>
              </div>
            </div>

            {/* TIME SLOTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {slots.map((slot: TimeSlot) => {
                const config = getStatusConfig(slot.status, slot.percentage || 0);
                const isASAP = slot.timeSlot === "ASAP";

                return (
                  <div
                    key={slot.timeSlot}
                    className={`
                      p-5 rounded-2xl border transition-all duration-300
                      ${config.bg} ${config.border}
                      group relative overflow-hidden
                    `}
                  >
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                          {isASAP ? <Zap className="h-4 w-4 text-amber-400" /> : <Clock className="h-4 w-4 text-gray-400" />}
                          {slot.timeSlot}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                            {isASAP ? 'Immediate Pickup' : 'Scheduled Window'}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${config.border} ${config.color} bg-black/40`}>
                        {config.icon}
                        {config.label}
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Prep Load (mins)</span>
                        <div className="text-right">
                          <span className={`text-sm font-black ${config.color}`}>
                            {slot.used || 0}
                          </span>
                          <span className="text-xs text-gray-600 font-bold ml-1">
                            / {slot.capacity || 300}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${config.bar} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                          style={{ width: `${slot.percentage || 0}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                        <span className="text-gray-500">{slot.percentage || 0}% Cap. Utilization</span>
                        {(slot.percentage || 0) >= 100 && (
                          <span className="text-red-400 animate-pulse">Critical Overload</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <EditScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        timeSlots={slots}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};

export default SlotsTimings;
