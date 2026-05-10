'use client';

import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnalytics } from '@/lib/analytics';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl animate-fade-in-up min-w-[150px]">
                <p className="text-neutral text-xs font-bold uppercase tracking-wider mb-2 border-b border-white/10 pb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 py-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
                            <span className="text-sm text-neutral/80 capitalize font-medium">{entry.name}</span>
                        </div>
                        <span className="text-lg font-bold text-white tabular-nums">
                            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="glass-surface rounded-2xl p-6 h-full flex flex-col">
        <h3 className="text-xl font-bold mb-6 text-white">{title}</h3>
        <div className="flex-1 min-h-[300px]">
            {children}
        </div>
    </div>
);

const AnalyticsDashboard: React.FC = () => {
    const {
        dailySales,
        topDishes,
        peakHours,
        insights,
        isLoading,
        error,
        lastFetched,
        refetch,
        isUsingRealData,
        isUsingMockData,
        isBlended,
        realDataPercentage,
        dataSource,
    } = useAnalytics();

    return (
        <div className="space-y-8 pb-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
                    <p className="text-neutral">Deep dive into your canteen&apos;s performance metrics.</p>
                </div>

                {/* Data Source Indicator */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <Database className="w-4 h-4 text-[#FF512F]" />
                        <span className="text-sm text-white">
                            {dataSource === 'real' ? 'Live Data' :
                                dataSource === 'mock' ? 'Demo Data' :
                                    `${realDataPercentage}% Real`}
                        </span>
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="glass-surface rounded-2xl p-6 border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <h3 className="text-white font-semibold">Data Loading Issue</h3>
                            <p className="text-neutral text-sm">
                                {error.retryable ?
                                    'Unable to load real-time data. Showing demo data instead.' :
                                    'Analytics service temporarily unavailable.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && !dailySales.length && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass-surface rounded-2xl p-6 h-full flex flex-col">
                            <div className="h-6 w-32 bg-white/10 rounded mb-6 animate-pulse"></div>
                            <div className="flex-1 min-h-[300px] bg-white/5 rounded-lg animate-pulse"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Analytics Charts */}
            {!isLoading && dailySales.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartWrapper title="Daily Sales Trend">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF512F" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#FF512F" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                    dx={-10}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#FF512F', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#FF512F"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2, fill: '#FF512F' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    <ChartWrapper title="Top 5 Dishes (Orders)">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topDishes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F09819" />
                                        <stop offset="100%" stopColor="#FF512F" />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }} />
                                <Bar
                                    dataKey="orders"
                                    fill="url(#colorOrders)"
                                    barSize={40}
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    <ChartWrapper title="Peak Hours Analysis">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={peakHours} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis
                                    dataKey="hour"
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#525252"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F09819', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ color: '#9ca3af', paddingTop: '20px' }} iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#F09819"
                                    strokeWidth={3}
                                    dot={{ r: 4, stroke: '#F09819', fill: '#050505', strokeWidth: 2 }}
                                    activeDot={{ r: 8, stroke: 'white', fill: '#F09819', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartWrapper>

                    <div className="glass-surface rounded-2xl p-6 h-full flex flex-col justify-center">
                        <h3 className="text-xl font-bold mb-6 text-white">Quick Insights</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-secondary/30 transition-colors">
                                <span className="text-neutral font-medium">Student Favorites</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                    <span className="font-bold text-white">{insights?.studentFavorites || 'Loading...'}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-alert/30 transition-colors">
                                <span className="text-neutral font-medium">Cancellation Ratio</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-alert"></span>
                                    <span className="font-bold text-white">{insights?.cancellationRatio || 'Loading...'}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-pending/30 transition-colors">
                                <span className="text-neutral font-medium">Busiest Time</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-pending"></span>
                                    <span className="font-bold text-white">{insights?.busiestTime || 'Loading...'}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-success/30 transition-colors">
                                <span className="text-neutral font-medium">Avg Order Value</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success"></span>
                                    <span className="font-bold text-white">{insights?.avgOrderValue || 'Loading...'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Info Footer */}
            {lastFetched && (
                <div className="text-center text-neutral text-xs">
                    Last updated: {lastFetched.toLocaleString()}
                    {isBlended && ` • ${realDataPercentage}% real data blended with mock data`}
                    {isUsingMockData && ' • Showing demo data'}
                    {isUsingRealData && ' • Live data'}
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
