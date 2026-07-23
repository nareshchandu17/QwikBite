export type PaymentStatus = "Pending" | "Success" | "Failed" | "Refunded";
export type PaymentMethod = "UPI" | "Card" | "Cash";

export interface Transaction {
  id: string;
  transactionId: string;
  orderId: string;
  customer: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
}
