import { ObjectId } from 'mongodb';
import connectDB from './mongodb';

export async function getDb() {
  const client = await connectDB();
  return client.db(process.env.MONGODB_DB);
}


export async function getCollection(collectionName: string) {
  const db = await getDb();
  return db.collection(collectionName);
}

// Example function to get an order by ID
export async function getOrderById(orderId: string) {
  const orders = await getCollection('orders');
  return orders.findOne({ _id: new ObjectId(orderId) });
}

// Example function to update order status
export async function updateOrderStatus(orderId: string, status: string) {
  const orders = await getCollection('orders');
  return orders.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { status, updatedAt: new Date() } }
  );
}
