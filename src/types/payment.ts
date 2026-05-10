export type PaymentStatus = "Success" | "Pending" | "Failed";
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
