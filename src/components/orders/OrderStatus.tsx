'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, UtensilsCrossed, Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Order } from '@/hooks/useActiveOrder';

interface OrderStatusProps {
  order: Order;
}

const statusStages = [
  { 
    status: 'PENDING', 
    icon: <Clock className="w-5 h-5" />, 
    label: 'Order Received',
    description: 'We\'ve received your order and it\'s being processed.'
  },
  { 
    status: 'PREPARING', 
    icon: <UtensilsCrossed className="w-5 h-5" />, 
    label: 'Preparing',
    description: 'Your delicious food is being prepared with care.'
  },
  { 
    status: 'READY_FOR_PICKUP', 
    icon: <CheckCircle2 className="w-5 h-5" />, 
    label: 'Ready for Pickup',
    description: 'Your order is ready! Please collect it from the canteen.'
  },
  { 
    status: 'COMPLETED', 
    icon: <Check className="w-5 h-5" />, 
    label: 'Completed',
    description: 'Order has been picked up. Enjoy your meal!'
  }
];

export default function OrderStatus({ order }: OrderStatusProps) {
  const [rating, setRating] = useState(0);
  const router = useRouter();
  
  const currentStatusIndex = statusStages.findIndex(s => s.status === order.status);
  const total = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffdf5] to-[#f9f9f9] flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Your Order Status</h1>
        <p className="text-gray-500 mb-6">Order #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      {/* Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl">
        {/* Left Section (Order Status) */}
        <div className="flex-1">
          <Card className="rounded-2xl shadow-sm border border-gray-200 w-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,191,0,0.5)]">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">Order Picked Up!</h2>
              <p className="text-gray-500 mb-6">Enjoy your meal!</p>

              <div className="space-y-6 border-l-2 border-gray-200 pl-6">
                {statusStages.map((stage, index) => {
                  const isCompleted = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  
                  const statusClass = isCompleted 
                    ? 'bg-green-500' 
                    : isCurrent 
                      ? 'bg-yellow-400' 
                      : 'bg-gray-200';
                      
                  return (
                    <div
                      key={stage.status}
                      className="flex items-start gap-5 relative p-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,191,0,0.3)]"
                    >
                      <div className={`absolute -left-[33px] ${statusClass} rounded-full p-2 text-white`}>
                        {stage.icon}
                      </div>
                      <div>
                        <p className="font-medium">{stage.label}</p>
                        <p className="text-sm text-gray-500">{stage.description}</p>
                        {isCurrent && (
                          <p className="text-xs text-amber-600 mt-1">
                            Last updated: {new Date(order.updatedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button 
                  className="bg-[#f79b2e] hover:bg-[#e58a20] text-white font-semibold rounded-xl"
                  onClick={() => router.push('/menu')}
                >
                  + Add another item
                </Button>

                <div className="flex items-center gap-2">
                  <p className="text-gray-600">How was your order?</p>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      className={`cursor-pointer text-2xl ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section (Smart Summary) */}
        <div className="lg:w-1/3 w-full">
          <Card className="rounded-2xl shadow-sm border border-gray-200 w-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,191,0,0.5)]">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-xl font-bold">Smart Summary</h2>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Items</strong> <br />
                  {order.items.map((item, i) => (
                    <span key={item.id}>
                      {item.quantity}x {item.name}
                      {i < order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
                <p>
                  <strong>Amount</strong> <br /> 
                  ${total.toFixed(2)} (Paid with Card)
                </p>
                <p>
                  <strong>Ordered At</strong> <br /> 
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Status</strong> <br />
                  <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full capitalize">
                    {order.status.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </p>
              </div>

              <Button 
                className="bg-[#f79b2e] hover:bg-[#e58a20] w-full font-semibold rounded-xl"
                onClick={() => router.push('/menu?category=drinks')}
              >
                🍹 Add a drink?
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-sm text-gray-500 flex flex-col items-center gap-1">
        <p>© 2024 CanteenApp. All rights reserved.</p>
        <div className="flex gap-3">
          <a href="#" className="hover:text-gray-800">Help</a>·
          <a href="#" className="hover:text-gray-800">FAQs</a>·
          <a href="#" className="hover:text-gray-800">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
