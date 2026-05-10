/**
 * Real-Time Data Flow Example: Order Management System
 * 
 * This example demonstrates the complete end-to-end WebSocket flow:
 * 1. Customer places order
 * 2. Admin receives notification
 * 3. Admin updates order status
 * 4. Customer receives real-time update
 * 5. Events are logged for audit trail
 */

'use client';

import { useState, useCallback } from 'react';
import { useOrderWebSocket } from '@/hooks/useOrderWebSocket';
import { useOrderStatusBroadcast } from '@/hooks/useAdminSocket';
import toast from 'react-hot-toast';

/**
 * CUSTOMER SIDE: Real-Time Order Status Tracker
 * 
 * This component subscribes to WebSocket updates for a specific order.
 * It automatically joins the order room and receives live status changes.
 */
export function CustomerOrderTracker({ orderId }: { orderId: string }) {
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const { orderStatus, isConnected, isLoading } = useOrderWebSocket({
    orderId,
    onStatusChange: (update) => {
      console.log('📱 Customer received order update:', update);

      // Update UI with new information
      setEstimatedTime(update.estimatedTime || null);
      setQueuePosition(update.currentQueue || null);

      // Show notification
      const statusEmojis: Record<string, string> = {
        pending: '⏳',
        preparing: '👨‍🍳',
        ready: '🎉',
        completed: '✅',
      };
      const statusEmoji = statusEmojis[update.status] || '📦';
      toast.success(`${statusEmoji} ${update.message || `Order ${update.status}`}`);
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error);
      toast.error('Lost connection. Attempting to reconnect...');
    },
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Order #{orderId}</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-gray-600">Connecting to live updates...</p>
        ) : (
          <>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-2xl font-bold text-blue-600">
                {orderStatus || 'pending'}
              </p>
            </div>

            {estimatedTime && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {estimatedTime} min
                </p>
              </div>
            )}

            {queuePosition !== null && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Position in Queue</p>
                <p className="text-2xl font-bold text-purple-600">
                  #{queuePosition}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">
        <p>Room: order:{orderId}</p>
        <p>Namespace: /customer</p>
        <p>Status: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}</p>
      </div>
    </div>
  );
}

/**
 * ADMIN SIDE: Order Status Management Dashboard
 * 
 * This component allows admins to broadcast status updates to customers
 * in real-time via the /admin namespace.
 */
export function AdminOrderControl({ orderId }: { orderId: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(5);
  const [queuePosition, setQueuePosition] = useState<number>(1);

  const { broadcastOrderStatus, isConnected } = useOrderStatusBroadcast();

  const handleStatusUpdate = useCallback(
    async (newStatus: string) => {
      try {
        setIsUpdating(true);
        setSelectedStatus(newStatus);

        // Broadcast to customer in real-time
        await broadcastOrderStatus({
          orderId,
          status: newStatus,
          estimatedTime:
            newStatus === 'ready' ? 0 : estimatedTime,
          currentQueue:
            newStatus === 'completed' ? 0 : queuePosition,
          message: `Order is now ${newStatus}`,
        });

        console.log(`✅ Admin broadcast "${newStatus}" to order ${orderId}`);
        toast.success(`Status updated to ${newStatus}`);

        // Reset after update
        setTimeout(() => setSelectedStatus(null), 1000);
      } catch (err) {
        console.error('❌ Failed to update status:', err);
        toast.error('Failed to update status');
      } finally {
        setIsUpdating(false);
      }
    },
    [orderId, estimatedTime, queuePosition, broadcastOrderStatus]
  );

  const statuses = [
    { id: 'pending', label: 'Pending', color: 'gray' },
    { id: 'preparing', label: 'Preparing', color: 'blue' },
    { id: 'ready', label: 'Ready for Pickup', color: 'green' },
    { id: 'completed', label: 'Completed', color: 'purple' },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin: Order #{orderId}</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Order Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((status) => (
              <button
                key={status.id}
                onClick={() => handleStatusUpdate(status.id)}
                disabled={isUpdating || !isConnected}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  selectedStatus === status.id
                    ? `bg-${status.color}-600 text-white`
                    : `bg-${status.color}-100 text-${status.color}-800`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
            disabled={isUpdating}
            className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
          />
        </div>

        {/* Queue Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Queue Position
          </label>
          <input
            type="number"
            min="0"
            value={queuePosition}
            onChange={(e) => setQueuePosition(parseInt(e.target.value) || 0)}
            disabled={isUpdating}
            className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
          />
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">
          <p>Namespace: /admin</p>
          <p>Room: order:{orderId}</p>
          <p>Status: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}</p>
          <p>Updating: {isUpdating ? 'YES' : 'NO'}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * COMBINED DEMO: Full Real-Time Flow
 * 
 * Shows both customer and admin panels updating in real-time.
 */
export function OrderManagementDemo({ orderId = 'ORD-12345' }: { orderId?: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <div>
        <h3 className="text-lg font-bold mb-4 text-center">👥 Customer View</h3>
        <CustomerOrderTracker orderId={orderId} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4 text-center">🛠️ Admin View</h3>
        <AdminOrderControl orderId={orderId} />
      </div>
    </div>
  );
}

/**
 * Data Flow Diagram:
 * 
 * CUSTOMER                    SERVER                    ADMIN
 * --------                    ------                    -----
 *
 * 1. Join room:order:123
 *    └─ socket.emit('join:room', 'order:123')
 *                           │
 * 2. Wait for updates       └─> Server stores in room
 *
 *                           3. Admin broadcasts update
 *                              └─ socket.to('order:123').emit('order:status', {...})
 *
 * 4. Receive update         <─ socket.on('order:status', {...})
 *    └─ UI updates with new status
 *       Toast notification shows "Order ready! 🎉"
 *
 * 5. Events logged
 *    └─> EventLog entry created in MongoDB
 *       (timestamp, userId, orderId, status, ipAddress)
 *
 * BENEFITS:
 * ✅ Real-time updates (< 100ms latency)
 * ✅ Scalable with Redis adapter
 * ✅ Fully authenticated with JWT
 * ✅ Audit trail for compliance
 * ✅ Auto-reconnection with backoff
 * ✅ Type-safe with TypeScript
 * ✅ Error handling & recovery
 * ✅ Memory efficient (no polling)
 */
