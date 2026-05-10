import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const { status } = await request.json();
    const { orderId } = params;

    // Validate status
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // In a real implementation, this would communicate with the WebSocket server
    // For now, we'll just return a success response
    // The frontend WebSocket client will handle the actual communication

    return NextResponse.json({ 
      success: true, 
      message: `Order ${orderId} status update requested to ${status}` 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

const getOrderStatusMessage = (status: string, orderId: string) => {
  switch (status) {
    case 'Preparing':
      return `Your order ${orderId} is now being prepared 🍳`;
    case 'Ready':
      return `Your order ${orderId} is ready! Please collect before ${new Date(Date.now() + 20 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ⏰`;
    case 'Out for Delivery':
      return `Your order ${orderId} is on its way! 🚚`;
    case 'Delivered':
      return `Your order ${orderId} has been delivered! Enjoy your meal! 🎉`;
    default:
      return `Order ${orderId} status updated to: ${status}`;
  }
};