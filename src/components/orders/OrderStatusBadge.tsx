"use client";

import React from "react";

type Props = { status: string };

const colorFor = (s: string) => {
  switch (s) {
    case "Pending":
    case "Preparing":
      return "bg-amber-500 text-amber-900";
    case "Ready":
    case "Out for Delivery":
      return "bg-emerald-400 text-emerald-900";
    case "Delivered":
      return "bg-slate-200 text-slate-900";
    case "Cancelled":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-200 text-gray-900";
  }
};

export default function OrderStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${colorFor(status)}`}>
      {status}
    </span>
  );
}
