'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BarChart, Clock, Package, Users, DollarSign, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { useAdminNavigation, useAdminActions } from '@/lib/adminUtils';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Link from 'next/link';

export default function AdminHome() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard
    router.push('/admin/dashboard');
  }, [router]);

  const { 
    analytics, 
    orders, 
    formatCurrency, 
    formatDate, 
    getStatusColor,
    navigateTo 
  } = useAdminNavigation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState(orders.slice(0, 5));
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1900, 1500, 2500, 2200, 3000, 2800],
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleViewOrder = (orderId: string) => {
    navigateTo(`/admin/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">
                {formatCurrency(analytics.revenue)}
              </div>
              <div className="flex items-center text-xs text-amber-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+20.1% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                Active Orders
              </CardTitle>
              <Package className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">
                {orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length}
              </div>
              <p className="text-xs text-amber-600">
                {Math.floor(Math.random() * 5) + 1} new today
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">
                {analytics.activeUsers}
              </div>
              <p className="text-xs text-amber-600">
                {Math.floor(Math.random() * 20) + 5} active now
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">
                Avg. Order Time
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">
                {Math.floor(Math.random() * 5) + 8} min
              </div>
              <p className="text-xs text-amber-600">
                -{Math.floor(Math.random() * 5) + 1}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 bg-white/80 backdrop-blur-sm border-amber-200 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-amber-900">Revenue Overview</CardTitle>
                <select 
                  className="text-xs border border-amber-200 rounded px-2 py-1 bg-white/50 text-amber-800"
                  defaultValue="week"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <Bar 
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          callback: (value) => `$${value}`
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 bg-white/80 backdrop-blur-sm border-amber-200 shadow-sm">
            <div className="flex justify-between items-center p-6 pb-2">
              <CardTitle className="text-amber-900">Recent Orders</CardTitle>
              <Link 
                href="/admin/orders" 
                className="text-xs text-amber-600 hover:text-amber-800 flex items-center"
              >
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-amber-900">
                        {order.id}
                      </p>
                      <p className="text-xs text-amber-600">
                        {formatDate(order.time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-amber-600 hover:bg-amber-50 w-full"
                onClick={() => navigateTo('/admin/orders')}
              >
                View All Orders
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}