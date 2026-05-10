import { CheckCircle2, Clock, Utensils, ShoppingBag, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrderStatus = 'received' | 'preparing' | 'ready' | 'collected';

interface OrderStatusTrackerProps {
  status: OrderStatus;
  className?: string;
}

const statusSteps = [
  {
    id: 'received',
    label: 'Order Received',
    icon: CheckCircle2,
    description: 'We got your order!',
  },
  {
    id: 'preparing',
    label: 'Preparing',
    icon: Utensils,
    description: 'Chef is cooking your meal',
  },
  {
    id: 'ready',
    label: 'Ready for Pickup',
    icon: ShoppingBag,
    description: 'Come get it!',
  },
  {
    id: 'collected',
    label: 'Collected',
    icon: CheckCircle,
    description: 'Enjoy your meal!',
  },
] as const;

export default function OrderStatusTracker({ status, className }: OrderStatusTrackerProps) {
  const currentStepIndex = statusSteps.findIndex((step) => step.id === status);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6', className)}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Order Progress</h2>
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-0.5 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gradient-to-b from-blue-500 to-green-500 transition-all duration-500 ease-in-out"
            style={{
              height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="space-y-8">
          {statusSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div key={step.id} className="relative flex items-start group">
                <div className="flex items-center h-9">
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-8 h-8 rounded-full',
                      isCompleted && 'bg-green-100 dark:bg-green-900/30',
                      isCurrent && 'bg-blue-100 dark:bg-blue-900/30 ring-8 ring-blue-50 dark:ring-blue-900/20',
                      isUpcoming && 'bg-gray-100 dark:bg-gray-700',
                      'transition-all duration-200',
                    )}
                  >
                    <step.icon
                      className={cn(
                        'h-4 w-4',
                        isCompleted && 'text-green-600 dark:text-green-400',
                        isCurrent && 'text-blue-600 dark:text-blue-400',
                        isUpcoming && 'text-gray-400 dark:text-gray-500',
                      )}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <h3
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isCurrent && 'text-blue-600 dark:text-blue-400 font-semibold',
                      isUpcoming && 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    {step.label}
                  </h3>
                  <p
                    className={cn(
                      'text-sm',
                      isCompleted && 'text-green-500 dark:text-green-400/80',
                      isCurrent && 'text-blue-500 dark:text-blue-400/80',
                      isUpcoming && 'text-gray-400 dark:text-gray-500',
                    )}
                  >
                    {isCurrent ? (
                      <span className="flex items-center">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        {step.description}
                      </span>
                    ) : (
                      step.description
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {status === 'collected' && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Order Completed</h3>
              <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                <p>We hope you enjoy your meal! 🍽️</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
