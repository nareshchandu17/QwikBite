import { notFound } from 'next/navigation';

interface OrderStatusPageProps {
  params: {
    id: string;
  };
}

export default function OrderStatusPage({ params }: OrderStatusPageProps) {
  // Here you would typically fetch the order details using the ID
  // For now, we'll just show a simple page
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Status</h1>
      <p>Order ID: {params.id}</p>
      {/* Add more order status details here */}
    </div>
  );
}
