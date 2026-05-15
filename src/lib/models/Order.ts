// Redirect to the unified order model
export * from '../../models/order.model';
import { Order as UnifiedOrder } from '../../models/order.model';
export const Order = UnifiedOrder;