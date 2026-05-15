'use client';

import React, { useState, useEffect, useCallback } from 'react';
import KpiCard from './KpiCard';
import LiveOrdersQueue from './LiveOrdersQueue';
import { Order, OrderStatus } from '@/types/order';
import SlotLoadViz from './SlotLoadViz';
import { Clock, Utensils, Clock3, TrendingUp, ChefHat, Zap } from 'lucide-react';
import { getSocket } from '@/lib/socket';

// Mock data for slot load
const slotLoadData = [
    { hour: '8 AM', load: 20 },
    { hour: '9 AM', load: 45 },
    { hour: '10 AM', load: 65 },
    { hour: '11 AM', load: 80 },
    { hour: '12 PM', load: 90, current: true },
    { hour: '1 PM', load: 85 },
    { hour: '2 PM', load: 70 },
    { hour: '3 PM', load: 50 },
    { hour: '4 PM', load: 30 },
];

interface DashboardOverviewProps {
    orders: Order[];
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ orders, onUpdateStatus }) => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [slots, setSlots] = useState<any[]>([]);
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => {
        return sum + (order.items?.reduce((orderSum, item) => orderSum + (item.price * item.quantity), 0) || 0);
    }, 0);

    const [currentTime, setCurrentTime] = useState(new Date());

    // Fetch slots data
    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const response = await fetch('/api/admin/timeslots/today');
                if (response.ok) {
                    const slotsData = await response.json();
                    setSlots(slotsData);
                }
            } catch (error) {
                console.error('Error fetching slots:', error);
            }
        };

        fetchSlots();
        // Refresh slots every 30 seconds
        const interval = setInterval(fetchSlots, 30000);

        // Set up WebSocket for real-time updates
        const socket = getSocket();
        socket.on('timeslot:update', (updatedSlots: any[]) => {
            console.log('Dashboard: Received timeslot update via socket');
            setSlots(updatedSlots);
        });

        return () => {
            clearInterval(interval);
            socket.off('timeslot:update');
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
        onUpdateStatus(orderId, newStatus);
    }, [onUpdateStatus]);

    // Calculate peak hour and top dish from real data
    const peakHour = slots.length > 0
        ? slots.reduce((max: any, slot: any) => slot.percentage > max.percentage ? slot : max).timeSlot
        : '1-2 PM';

    const topDish = orders.length > 0
        ? (orders as any[]).reduce((most: any, order: any) => {
            const topItem = (order.items || []).reduce((popular: any, item: any) =>
                (item.quantity || 0) > (popular.quantity || 0) ? item : popular
                , order.items?.[0] || {});
            return topItem;
        }, { name: 'Veggie Burger' }).name || 'Veggie Burger'
        : 'Veggie Burger';

    const avgPrepTime = orders.length > 0
        ? Math.round(orders.reduce((sum, order) => sum + (order.estimatedTime || 15), 0) / orders.length)
        : 12;

    // Calculate active orders by status
    const activeOrders = orders.filter(order => {
        const status = order.status?.toLowerCase();
        return status === 'received' || 
               status === 'preparing' || 
               status === 'ready' || 
               status === 'pending' || 
               status === 'confirmed' ||
               status === 'almost_ready';
    });

    console.log('DashboardOverview: Total orders received from API:', orders.length);
    console.log('DashboardOverview: Active orders after filtering:', activeOrders.length);
    if (activeOrders.length === 0 && orders.length > 0) {
        console.log('DashboardOverview: Sample order status:', orders[0].status);
    }

    return (
        <div className="space-y-8">
            {/* Header with greeting and time */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-amber-400">Good Morning, Admin!</h1>
                    <p className="text-gray-400">Here&apos;s what&apos;s happening with your canteen today</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg">
                    <Clock3 className="h-5 w-5 text-amber-500" />
                    <span className="text-white font-medium">{formatTime(currentTime)}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <KpiCard
                    title="Total Orders Today"
                    value={totalOrders.toString()}
                    change="+5%"
                    icon={<Utensils className="h-5 w-5" />}
                    onClick={() => setActiveTab('Orders')}
                />
                <KpiCard
                    title="Revenue Today"
                    value={`₹${revenue.toLocaleString()}`}
                    change="+8%"
                    isCurrency={true}
                    icon={<TrendingUp className="h-5 w-5" />}
                    onClick={() => setActiveTab('Payments')}
                />
                <KpiCard
                    title="Live Queue Load"
                    value={`${activeOrders.length} / 50`}
                    change="Medium"
                    icon={<Clock className="h-5 w-5" />}
                    onClick={() => setActiveTab('Orders')}
                />
                <KpiCard
                    title="Avg. Prep Time"
                    value={`${avgPrepTime}m ${avgPrepTime % 60 !== 0 ? avgPrepTime % 60 + 's' : ''}`}
                    change="-2%"
                    icon={<Clock3 className="h-5 w-5" />}
                    onClick={() => setActiveTab('Analytics & Insights')}
                />
                <KpiCard
                    title="Top Dish"
                    value={topDish.length > 15 ? topDish.substring(0, 15) + '...' : topDish}
                    change="Popular"
                    icon={<ChefHat className="h-5 w-5" />}
                    onClick={() => setActiveTab('Menu Management')}
                />
                <KpiCard
                    title="Peak Hour"
                    value={peakHour}
                    change="Now"
                    icon={<Zap className="h-5 w-5" />}
                    onClick={() => setActiveTab('Analytics & Insights')}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Orders Queue */}
                <div className="lg:col-span-2">
                    <LiveOrdersQueue orders={activeOrders} onUpdateStatus={updateOrderStatus} />

                </div>

                <div>
                    <SlotLoadViz slots={slots} />
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
