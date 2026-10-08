import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import { Transaction } from "@/lib/models";

const STAFF_ROLES = new Set(["admin", "canteen_staff", "staff"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = String(session?.user?.role || "").toLowerCase();
  if (!session?.user?.id || !STAFF_ROLES.has(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectToDatabase();
    const transactions = await Transaction.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json(transactions.map((txn: any) => ({
      id: String(txn._id), transactionId: txn.transactionId, orderId: txn.orderId,
      customer: txn.customer, amount: txn.amount, method: txn.method, status: txn.status, date: txn.createdAt,
    })));
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Direct transaction creation is disabled. Transactions are derived from verified payments.", code: "TRANSACTION_LEDGER_LOCKED" }, { status: 410 });
}