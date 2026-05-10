'use client';

import React, { useEffect, useState } from 'react';

const slotData = [
    { name: '12-1 PM', load: 65 },
    { name: '1-2 PM', load: 85 },
    { name: '2-3 PM', load: 40 },
    { name: '3-4 PM', load: 25 },
];

const CircularProgress = ({ value }: { value: number }) => {
    const radius = 85;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-full h-64 py-4">
            {/* SVG Container */}
            <svg
                viewBox="0 0 240 240"
                className="w-full h-full drop-shadow-2xl overflow-visible"
                style={{ filter: 'drop-shadow(0px 0px 10px rgba(255, 81, 47, 0.2))' }}
            >
                <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F09819" />
                        <stop offset="50%" stopColor="#FF512F" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Decorative Outer Ring (Dashed) */}
                <circle
                    cx="120"
                    cy="120"
                    r="105"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="4 4"
                    className="animate-[spin_60s_linear_infinite]"
                />

                {/* Decorative Inner Ring */}
                <circle
                    cx="120"
                    cy="120"
                    r="65"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    fill="none"
                />

                {/* Background Track */}
                <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Progress Bar */}
                <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="url(#progress-gradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-custom-ease transform -rotate-90 origin-center"
                    style={{ filter: 'url(#glow)' }}
                />

                {/* End Cap Marker (Optional visual flare) */}
                <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke="none"
                >
                    {/* This logic would rotate a dot to the tip of the progress, skipping for simplicity to keep it clean */}
                </circle>
            </svg>

            {/* Center Text Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative flex flex-col items-center z-10">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#9ca3af] tracking-tighter drop-shadow-sm">
                        {value}%
                    </span>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent my-1"></div>
                    <span className="text-[10px] font-bold text-[#F09819] uppercase tracking-[0.25em] opacity-90">
                        Capacity
                    </span>
                </div>
                {/* Subtle Radial Gradient Behind Text */}
                <div className="absolute w-32 h-32 bg-[#FF512F] rounded-full blur-2xl -z-10"></div>
            </div>
        </div>
    );
};

const ModernProgressBar: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    const isHigh = value > 80;

    return (
        <div className="group relative p-3 rounded-xl hover:bg-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end mb-2 relative z-10">
                <span className="text-sm font-medium text-[#9ca3af] group-hover:text-white transition-colors duration-300">{label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isHigh ? 'bg-[#FF512F] text-[#FF512F] border-[#FF512F]' : 'bg-white/5 text-[#9ca3af] border-white/10'}`}>
                    {value}%
                </span>
            </div>

            <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"></div>

                <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#F09819] to-[#FF512F] transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{ width: `${value}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white blur-[2px] rounded-full"></div>
                </div>
            </div>
        </div>
    )
};

const SlotLoadViz: React.FC<{ slots?: unknown[] }> = ({ slots = [] }) => {
    const [currentLoad, setCurrentLoad] = useState(0);

    // Calculate overall capacity load
    const totalUsed = slots.reduce((acc, s) => acc + (s.used || 0), 0);
    const totalCapacity = slots.reduce((acc, s) => acc + (s.capacity || 20), 0);
    const overallPercentage = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

    // Get top busy slots
    const topSlots = [...slots]
        .filter(s => s.timeSlot !== 'ASAP')
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 4);

    useEffect(() => {
        setCurrentLoad(overallPercentage);
    }, [overallPercentage]);

    return (
        <div className="rounded-2xl p-6 h-full flex flex-col relative overflow-hidden
      bg-[rgba(20,20,20,0.6)]
      backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
      border border-[rgba(255,255,255,0.08)]
      shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
    ">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full filter blur-[80px] pointer-events-none"></div>

            <div className="flex justify-between items-center mb-2 relative z-10">
                <h2 className="text-xl font-bold text-white">Live Capacity</h2>
                <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-full border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse"></span>
                    <span className="text-[10px] text-[#4ade80] font-bold uppercase tracking-wide drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">Real-time</span>
                </div>
            </div>

            {/* Circular Loader Area */}
            <div className="flex-shrink-0 mb-2">
                <CircularProgress value={currentLoad} />
            </div>

            {/* Progress Bars List */}
            <div className="flex-1 space-y-1 relative z-10 overflow-y-auto custom-scrollbar pr-1">
                {topSlots.length > 0 ? (
                    topSlots.map(slot => (
                        <ModernProgressBar key={slot.timeSlot} label={slot.timeSlot} value={slot.percentage} />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full opacity-30 text-xs">
                        No slot data available
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlotLoadViz;
