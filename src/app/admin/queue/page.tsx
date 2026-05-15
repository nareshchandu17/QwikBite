'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RefreshCw, Clock, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TimeSlotData = {
  timeSlot: string;
  capacity: number;
  used: number;
  percentage: number;
  status: string;
};

type OrderData = {
  id: string;
  customerName: string;
  status: string;
  createdAt: string;
  loadValue: number;
  timeSlot: string;
};

export default function QueuePage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [currentOrders, setCurrentOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadQueueData = async () => {
    setIsLoading(true);
    try {
      // Fetch Slots
      const slotsRes = await fetch('/api/admin/timeslots/today');
      const slotsData = await slotsRes.json();
      
      // Fetch Orders (Active only)
      const ordersRes = await fetch('/api/admin/orders');
      const ordersDataRaw = await ordersRes.json();
      
      // Format orders
      const formattedOrders = (ordersDataRaw.data || []).map((o: any) => ({
        id: o.id,
        customerName: o.customerName || 'Guest Student',
        status: o.status,
        createdAt: o.createdAt,
        loadValue: o.loadValue || 5,
        timeSlot: o.timeSlot
      })).filter((o: any) => ['received', 'cooking', 'ready'].includes(o.status));

      setTimeSlots(slotsData);
      setCurrentOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading queue data:', error);
      toast.error('Failed to refresh queue data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/slots/sync', { method: 'POST' });
      await loadQueueData();
      toast.success('Queue synchronized with database truth');
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Overall Kitchen Pressure
  const totalLoad = currentOrders.reduce((acc, o) => acc + o.loadValue, 0);
  const avgLoadPerOrder = 12; // Standard estimation
  const estWaitTime = Math.ceil(totalLoad / 2); // Assuming 2 parallel prep lines

  const getPressureStatus = () => {
    if (totalLoad === 0) return { label: 'Idle', color: 'bg-emerald-500', icon: <CheckCircle2 className="h-4 w-4" /> };
    if (totalLoad < 60) return { label: 'Optimal', color: 'bg-blue-500', icon: <Zap className="h-4 w-4" /> };
    if (totalLoad < 150) return { label: 'Moderate', color: 'bg-amber-500', icon: <Clock className="h-4 w-4" /> };
    return { label: 'Heavy Load', color: 'bg-red-500', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  const pressure = getPressureStatus();

  return (
    <div className="flex-1 space-y-6">
      <AdminHeader 
        title="Live Queue & Load" 
        subtitle="Real-time kitchen pressure and slot occupancy"
      />

      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardContent className="p-5">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Orders</p>
              <p className="text-3xl font-black text-white mt-1">{currentOrders.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardContent className="p-5">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Prep Load</p>
              <p className="text-3xl font-black text-amber-500 mt-1">{totalLoad} <span className="text-sm font-medium text-gray-500">mins</span></p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/5 backdrop-blur-md">
            <CardContent className="p-5">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Est. Wait (Avg)</p>
              <p className="text-3xl font-black text-white mt-1">{estWaitTime} <span className="text-sm font-medium text-gray-500">mins</span></p>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/5 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-5">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Kitchen Status</p>
              <div className="flex items-center gap-2 mt-1">
                 <div className={`h-3 w-3 rounded-full ${pressure.color} animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                 <p className="text-2xl font-black text-white">{pressure.label}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: SLOTS MONITOR */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-gray-200">Slot Occupancy</h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="text-xs text-gray-400 hover:text-white gap-2"
                >
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync
                </Button>
            </div>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {timeSlots.map((slot) => {
                    const isFull = slot.percentage >= 100;
                    const isBusy = slot.percentage >= 70;
                    return (
                        <div key={slot.timeSlot} className="p-4 bg-white/5 border border-white/5 rounded-xl transition-all hover:bg-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-gray-100">{slot.timeSlot}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    isFull ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    isBusy ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {slot.status}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${
                                        isFull ? 'bg-red-500' : isBusy ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} 
                                    style={{ width: `${Math.min(100, slot.percentage)}%` }} 
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-gray-500 font-bold">{slot.percentage}% Filled</span>
                                <span className="text-[10px] text-gray-500">{slot.used} / {slot.capacity}m</span>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          {/* RIGHT: LIVE ORDERS */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-gray-200">Orders in Preparation</h3>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs text-gray-500 font-medium">LIVE REFRESH</span>
                </div>
            </div>

            <Card className="bg-black/40 border-white/5 min-h-[500px]">
                <CardContent className="p-4">
                    {isLoading && currentOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                            <p className="text-gray-500 text-sm">Fetching active orders...</p>
                        </div>
                    ) : currentOrders.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {currentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                            <span className="text-amber-500 font-bold">#{order.id.slice(-2)}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{order.customerName}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                Slot: <span className="text-amber-500/80">{order.timeSlot}</span> • {format(new Date(order.createdAt), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-white">{order.loadValue}m</p>
                                            <p className="text-[9px] text-gray-600 uppercase font-black">Prep Time</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            order.status === 'received' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                            order.status === 'cooking' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}>
                                            {order.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <CheckCircle2 className="h-12 w-12 opacity-10 mb-2" />
                            <p>No active orders in the kitchen.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
