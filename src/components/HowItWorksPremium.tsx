'use client';

import React from 'react';
import Image from 'next/image';

const HowItWorksPremium = () => {
  return (
    <section className="bg-[#fffaf5] font-['Be_Vietnam_Pro',sans-serif] text-[#121e1f] selection:bg-orange-100 relative overflow-hidden pt-20 pb-32">
      {/* Custom Gradient Background */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{
             background: `
                radial-gradient(circle at 10% 10%, rgba(255, 140, 0, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 20%, rgba(255, 230, 0, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 30% 80%, rgba(255, 140, 0, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 95% 85%, rgba(34, 197, 94, 0.04) 0%, transparent 40%)
             `
           }} 
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left Column: Content */}
          <div className="col-span-12 lg:col-span-4 pt-12 space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm text-[#FF8C00]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wide">Smarter Ordering</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-[#1a1a1a]">
                Skip the Queue.<br />
                <span className="text-[#FF8C00]">Get Your Food Faster.</span>
              </h1>
              <p className="text-xl text-[#586062] max-w-sm leading-relaxed font-medium">
                Order ahead, choose your perfect time slot and pick up instantly. No lines. No waiting.
              </p>
            </div>

            <div className="space-y-10 relative">
              {/* Steps */}
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FF9F2D] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-100/50">1</div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold mb-1 text-[#1a1a1a]">Explore the Menu</h3>
                  <p className="text-[#586062] text-sm font-medium">Browse delicious meals crafted for you.</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FFF1E0] flex items-center justify-center text-[#FF9F2D] font-bold text-lg">2</div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold mb-1 text-[#1a1a1a]">Book Your Slot</h3>
                  <p className="text-[#586062] text-sm font-medium">Choose a time slot that fits your schedule.</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FFF1E0] flex items-center justify-center text-[#FF9F2D] font-bold text-lg">3</div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold mb-1 text-[#1a1a1a]">Pick Up & Enjoy</h3>
                  <p className="text-[#586062] text-sm font-medium">Get notified when It&apos;s ready and pick up without waiting.</p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-4 bg-white px-6 py-4 rounded-full border border-orange-50 shadow-sm">
              <div className="bg-[#FF5C39] w-10 h-10 rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#333]">Smart slots. Real-time updates.</p>
                <p className="text-sm font-bold text-[#FF8C00]">Better food experience.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Mockups */}
          <div className="col-span-12 lg:col-span-8 flex flex-col md:flex-row justify-between gap-6 relative">
            {/* Mockup 1: Explore */}
            <div className="flex-1 flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-full border-2 border-orange-100 flex items-center justify-center mb-6 bg-white font-bold text-[#FF8C00] text-xl">1</div>
              <div className="text-center mb-8">
                <h4 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[#1a1a1a]">Explore the Menu</h4>
                <p className="text-[#586062] text-sm">Discover a wide variety of meals and snacks.</p>
              </div>
              <div className="w-full max-w-[280px] bg-white rounded-[48px] p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-orange-50">
                <div className="bg-white rounded-[40px] h-[540px] overflow-hidden flex flex-col p-4">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                    <span className="text-xs font-bold text-[#1a1a1a]">Good Afternoon 👋</span>
                    <span className="material-symbols-outlined text-gray-400 text-sm">settings</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mb-4 px-2 uppercase tracking-wider">What would you like to eat?</p>
                  <div className="bg-gray-50 rounded-xl px-4 py-2 flex items-center gap-2 mb-4 mx-2">
                    <span className="material-symbols-outlined text-sm text-gray-400">search</span>
                    <span className="text-[10px] text-gray-400">Search for food...</span>
                    <span className="material-symbols-outlined text-sm text-gray-400 ml-auto">tune</span>
                  </div>
                  <div className="flex gap-2 mb-6 px-2 overflow-x-auto scrollbar-hide">
                    <span className="bg-[#FF8C00] text-white px-3 py-1 rounded-full text-[10px] font-bold">All</span>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">Main Course</span>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold">Snacks</span>
                  </div>
                  <div className="px-2">
                    <p className="text-[10px] font-extrabold mb-4 uppercase tracking-wider text-[#1a1a1a]">Popular Now 🔥</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="relative">
                          <Image width={120} height={120} alt="Veg Biryani" className="w-full aspect-square object-cover rounded-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoXFfYsOG1pCzUIz7ore4B6PQugFWRGK6oe7FraxSpCoEo7csre4J-TEEielL7SzeOBoHCDLA8Vly9tPT6gL6qTo-sN-tAUmoeteh3oHdeMmnPCBitHOSNbcKRZvSl4KP8YlATv9bRczFblC-fij74bXL-fgL_ZRJRtvvz25e7jNONP0yq19CC9zC_GrvXaRlvPm4tvLEmDG0W_UQM7hY4JZtdoVOoBNN6L4qoX1rGU16Of77ArhpuLavKK7VxslNN10GlvoJOvpl3" />
                          <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1"><span className="material-symbols-outlined text-xs text-orange-500">favorite</span></div>
                        </div>
                        <p className="text-[11px] font-bold text-[#1a1a1a]">Veg Biryani</p>
                        <p className="text-[10px] text-gray-500">₹85</p>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Image width={120} height={120} alt="Paneer Wrap" className="w-full aspect-square object-cover rounded-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh12_MqpUkm6FUhFLyB3mEWapNGbWNTxuv_NEnETXMOXVvkhrPHii5aS2r-GPPOOjTrrEEYRc1ht-B07RlHPoMmijGsw6EWgLKZzQc93ldo4cvFT38Y-k2AKPKP8sisybo5JuYJMSmyvJ8bdbTNh_jSovOw_sz4uGVFSbSm5uE5Yrq8z5Kadb08nGwJECS4FfGDZmo17ae_fNJrVj1uq0Ml5r4gYShydEVUhY8m2D6pBGIxT-vcORTTj4r4zPhLCBwMDw-_1g5zMgU" />
                          <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1"><span className="material-symbols-outlined text-xs text-orange-500">favorite</span></div>
                        </div>
                        <p className="text-[11px] font-bold text-[#1a1a1a]">Paneer Wrap</p>
                        <p className="text-[10px] text-gray-500">₹60</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 w-16 h-16 rounded-full bg-white border-2 border-orange-50 shadow-md flex items-center justify-center relative z-20">
                <span className="material-symbols-outlined text-[#FF8C00] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
              </div>
            </div>

            {/* Mockup 2: Slots */}
            <div className="flex-1 flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-full border-2 border-orange-100 flex items-center justify-center mb-6 bg-white font-bold text-[#FF8C00] text-xl">2</div>
              <div className="text-center mb-8">
                <h4 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[#1a1a1a]">Book Your Slot</h4>
                <p className="text-[#586062] text-sm">Choose your preferred time slot and place order.</p>
              </div>
              <div className="w-full max-w-[280px] bg-white rounded-[48px] p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-orange-50">
                <div className="bg-white rounded-[40px] h-[540px] overflow-hidden flex flex-col p-6">
                  <div className="flex justify-between items-center mb-8">
                    <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                    <span className="text-xs font-bold text-[#1a1a1a]">Select Time Slot</span>
                    <span className="material-symbols-outlined text-gray-400 text-sm">schedule</span>
                  </div>
                  <div className="flex items-center gap-1 mb-6">
                    <span className="text-xs font-bold text-[#1a1a1a]">Today, 27 Apr</span>
                    <span className="material-symbols-outlined text-xs text-[#1a1a1a]">expand_more</span>
                  </div>
                  <div className="flex justify-between mb-8">
                    <div className="flex flex-col items-center bg-[#FF8C00] rounded-xl px-2 py-3 text-white">
                      <span className="text-[8px] font-bold uppercase mb-1">Sun</span>
                      <span className="text-sm font-bold">27</span>
                    </div>
                    {[28, 29, 30, 1].map((day, i) => (
                      <div key={i} className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-xl px-2 py-3">
                        <span className="text-[8px] font-bold uppercase mb-1 text-gray-400">{['Mon', 'Tue', 'Wed', 'Thu'][i]}</span>
                        <span className="text-sm font-bold text-gray-600">{day.toString().padStart(2, '0')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-auto">
                    {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM'].map(t => (
                      <div key={t} className="p-3 bg-gray-50 text-[10px] font-bold text-center rounded-xl text-gray-500">{t}</div>
                    ))}
                    <div className="p-3 bg-[#FF8C00] text-[10px] font-bold text-center rounded-xl text-white flex items-center justify-center gap-1 shadow-lg shadow-orange-100">
                      11:00 AM <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    {['11:30 AM', '12:00 PM', '12:30 PM'].map(t => (
                      <div key={t} className="p-3 bg-gray-50 text-[10px] font-bold text-center rounded-xl text-gray-500">{t}</div>
                    ))}
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#FF8C00] to-[#FFA500] text-white py-4 rounded-2xl text-[11px] font-extrabold flex items-center justify-center gap-2 mt-6">
                    Continue to Order <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
              <div className="mt-8 w-16 h-16 rounded-full bg-white border-2 border-orange-50 shadow-md flex items-center justify-center relative z-20">
                <span className="material-symbols-outlined text-[#FF8C00] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
              </div>
            </div>

            {/* Mockup 3: Status */}
            <div className="flex-1 flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-full border-2 border-orange-100 flex items-center justify-center mb-6 bg-white font-bold text-[#FF8C00] text-xl">3</div>
              <div className="text-center mb-8">
                <h4 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[#1a1a1a]">Pick Up Instantly</h4>
                <p className="text-[#586062] text-sm">Get real-time updates and pick up when It&apos;s ready.</p>
              </div>
              <div className="w-full max-w-[280px] bg-white rounded-[48px] p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-orange-50">
                <div className="bg-white rounded-[40px] h-[540px] overflow-hidden flex flex-col p-6">
                  <div className="flex justify-between items-center mb-8">
                    <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                    <span className="text-xs font-bold text-[#1a1a1a]">Order Status</span>
                    <span className="material-symbols-outlined text-gray-400 text-sm">headset_mic</span>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Your order is</p>
                    <p className="text-xl font-black text-green-500 mb-1">Preparing</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Order ID: #CB123456</p>
                  </div>
                  <div className="relative flex justify-center mb-8">
                    <Image width={96} height={96} alt="Order" className="w-24 h-24 rounded-full object-cover border-4 border-orange-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm1_fGvAoOen_jvxLdwje55camiHNbE1FUoW6mpdFskC4y8Wb85_DWf5liFrrK6awr_RAlkHCkjLQC2fczBTqL-Wcwv-119udxNIyrg8JA7teEYqt-03aMcqf3Dl3LF_fnLSB6yKYRE0WpymC5Vm3nGES-wju7K34p7jtl9nTnsE78_W9Ih3SRHnEBRKcXOQGKuqGXwPfYXswULxCM4uXXqGR4N9cjoeFHw6vMItsI_ydcAFgDKmquBDV44GDXpavunKjwER2u71Xi" />
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-sm"><span className="material-symbols-outlined text-orange-500 text-sm">restaurant</span></div>
                  </div>
                  {/* Tracking Bar */}
                  <div className="flex items-center justify-between relative mb-10 px-2">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-100 z-0"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-green-500 z-0" style={{ width: '40%' }}></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] mb-2"><span className="material-symbols-outlined text-xs">check</span></div>
                      <span className="text-[8px] font-bold text-gray-400">Received</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] mb-2"><span className="material-symbols-outlined text-xs">shopping_basket</span></div>
                      <span className="text-[8px] font-bold text-green-500">Preparing</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-[10px] mb-2"><span className="material-symbols-outlined text-xs">inventory_2</span></div>
                      <span className="text-[8px] font-bold text-gray-300">Ready</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-[10px] mb-2"><span className="material-symbols-outlined text-xs">person</span></div>
                      <span className="text-[8px] font-bold text-gray-300">Picked Up</span>
                    </div>
                  </div>
                  <div className="mt-auto bg-gray-50 rounded-2xl p-4 text-center">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Estimated Ready Time</p>
                    <p className="text-2xl font-black text-green-500 mb-1">11:00 AM</p>
                    <p className="text-[9px] text-gray-500">We&apos;ll notify you when It&apos;s ready!</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 w-16 h-16 rounded-full bg-white border-2 border-orange-50 shadow-md flex items-center justify-center relative z-20">
                <span className="material-symbols-outlined text-[#22c55e] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
              </div>
            </div>

            {/* Connecting Dashed Arrows (SVG Overlay) - Hidden on mobile */}
            <div className="absolute bottom-4 left-[20%] right-[20%] h-32 pointer-events-none z-10 hidden lg:block">
              <svg className="w-full h-full" fill="none" viewBox="0 0 800 100">
                <defs>
                  <marker id="arrowhead" markerHeight="7" markerWidth="10" orient="auto" refX="9" refY="3.5">
                    <polygon fill="#FF8C00" points="0 0, 10 3.5, 0 7"></polygon>
                  </marker>
                </defs>
                <path d="M100,50 Q200,80 300,50" fill="none" markerEnd="url(#arrowhead)" stroke="#FF8C00" strokeDasharray="8 8" strokeWidth="2"></path>
                <path d="M500,50 Q600,80 700,50" fill="none" markerEnd="url(#arrowhead)" stroke="#FF8C00" strokeDasharray="8 8" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="mt-20 bg-white/80 backdrop-blur-md border border-white/50 rounded-[40px] px-6 md:px-12 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shadow-xl shadow-orange-100/30">
          {[
            { icon: 'check_circle', title: 'No More Waiting', desc: 'Skip the long queues' },
            { icon: 'av_timer', title: 'Real-time Updates', desc: 'Live order status' },
            { icon: 'calendar_month', title: 'Smart Scheduling', desc: 'Choose your perfect time' },
            { icon: 'favorite', title: 'Better Experience', desc: 'Happy you, happy us' }
          ].map((feat, i, arr) => (
            <React.Fragment key={feat.title}>
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF8C00]">
                  <span className="material-symbols-outlined text-3xl">{feat.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-lg text-[#1a1a1a]">{feat.title}</p>
                  <p className="text-sm text-[#586062]">{feat.desc}</p>
                </div>
              </div>
              {i < arr.length - 1 && <div className="hidden lg:block w-px h-12 bg-gray-100 self-center"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksPremium;
