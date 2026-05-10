"use client";

import React from "react";
import { Trophy, Gift } from "lucide-react";

type RewardProgressProps = {
  userOrderCount: number;
  targetOrderCount: number;
};

export default function RewardProgress({ userOrderCount, targetOrderCount }: RewardProgressProps) {
  const progressPercentage = Math.min(100, (userOrderCount / targetOrderCount) * 100);
  const ordersUntilReward = Math.max(0, targetOrderCount - userOrderCount);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Trophy className="w-5 h-5 text-amber-400 mr-2" />
          <span className="text-sm font-medium text-amber-300">Reward Progress</span>
        </div>
        <span className="text-xs text-slate-400">{ordersUntilReward} orders left for Free Tea!</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="mt-3 flex items-center text-xs text-slate-400">
        <Gift className="w-4 h-4 mr-1" />
        <span>Complete {targetOrderCount} orders to unlock your free reward</span>
      </div>
    </div>
  );
}