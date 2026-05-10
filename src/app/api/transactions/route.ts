import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { socketManager } from "@/lib/websocket/server";
import { Transaction } from "@/lib/models";

interface ITransaction {
  _id: { toString: () => string };
  transactionId: string;
  orderId: string;
  customer: string;
  amount: number;
  method: 'UPI' | 'Card' | 'Cash';
  status: 'Success' | 'Pending' | 'Failed';
  createdAt: Date;
}

/* ===== GET TRANSACTIONS ===== */
export async function GET() {
  try {
    await connectToDatabase();
    console.log('[Transactions GET] Fetching all transactions');

    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log('[Transactions GET] ✅ Found', transactions.length, 'transactions');
    
    // Format transactions to match expected structure with id, transactionId, and date
    const formattedTransactions = (transactions as unknown as ITransaction[]).map((txn) => ({
      id: txn._id.toString(),
      transactionId: txn.transactionId,
      orderId: txn.orderId,
      customer: txn.customer,
      amount: txn.amount,
      method: txn.method,
      status: txn.status,
      date: txn.createdAt,
    }));
    
    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('[Transactions GET] ❌ Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/* ===== CREATE TRANSACTION ===== */
export async function POST(req: Request) {
  console.log('[Transactions POST] 🚀 Starting POST request handler');
  
  let transactionRes: Response | undefined;
  
  try {
    // ✅ NOTE: We don't require authentication here because payment success page
    // is public and needs to create transactions without session
    
    console.log('[Transactions POST] Step 1: Connecting to database...');
    await connectToDatabase();
    console.log('[Transactions POST] Step 1: ✅ Database connected');
    
    console.log('[Transactions POST] Step 2: Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('[Transactions POST] Step 2: ✅ Body parsed:', body);
    } catch (parseErr: unknown) {
      const message = parseErr instanceof Error ? parseErr.message : 'Unknown error';
      console.error('[Transactions POST] ❌ Failed to parse request body:', message);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: message },
        { status: 400 }
      );
    }

    console.log('[Transactions POST] Step 3: Validating required fields...');
    // Validate required fields with detailed error messages
    const missingFields: string[] = [];
    if (!body.orderId) missingFields.push('orderId');
    if (!body.customer) missingFields.push('customer');
    if (body.amount === undefined || body.amount === null || body.amount === '') missingFields.push('amount');
    if (!body.method) missingFields.push('method');
    if (!body.status) missingFields.push('status');

    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('[Transactions POST] Step 3: ❌', errorMsg);
      console.error('[Transactions POST] Full body received:', JSON.stringify(body));
      return NextResponse.json(
        { error: errorMsg, receivedBody: body },
        { status: 400 }
      );
    }
    console.log('[Transactions POST] Step 3: ✅ All required fields present');

    // Validate enum values
    console.log('[Transactions POST] Step 4: Validating enum values...');
    const validMethods = ['UPI', 'Card', 'Cash'];
    if (!validMethods.includes(body.method)) {
      console.error('[Transactions POST] Step 4: ❌ Invalid payment method:', body.method, 'Expected one of:', validMethods);
      return NextResponse.json(
        { error: `Invalid payment method: ${body.method}. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    const validStatuses = ['Success', 'Pending', 'Failed'];
    if (!validStatuses.includes(body.status)) {
      console.error('[Transactions POST] Step 4: ❌ Invalid status:', body.status, 'Expected one of:', validStatuses);
      return NextResponse.json(
        { error: `Invalid status: ${body.status}. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    console.log('[Transactions POST] Step 4: ✅ Enum validation passed');

    // Generate transactionId before creating document
    console.log('[Transactions POST] Step 5: Generating transactionId...');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    const transactionId = `TXN-${timestamp}-${random}`;
    console.log('[Transactions POST] Step 5: ✅ TransactionId generated:', transactionId);

    // Create transaction
    console.log('[Transactions POST] Step 6: Creating transaction document...');
    console.log('[Transactions POST] Step 6: Creating with data:', {
      transactionId,
      orderId: body.orderId,
      customer: body.customer,
      amount: body.amount,
      method: body.method,
      status: body.status,
    });
    
    let txn;
    try {
      txn = await Transaction.create({
        transactionId,
        orderId: body.orderId,
        customer: body.customer,
        amount: body.amount,
        method: body.method,
        status: body.status,
      });
    } catch (createError: unknown) {
      const err = createError as { message?: string, name?: string, errors?: Record<string, { message: string }> };
      console.error('[Transactions POST] ❌ Failed to create transaction document');
      console.error('[Transactions POST] Create error type:', typeof createError);
      console.error('[Transactions POST] Create error message:', err?.message);
      console.error('[Transactions POST] Create error name:', err?.name);
      
      // Handle Mongoose validation errors
      if (err?.errors) {
        const validationErrors: Record<string, string> = {};
        for (const [field, error] of Object.entries(err.errors)) {
          validationErrors[field] = error?.message || String(error);
        }
        console.error('[Transactions POST] Validation errors:', validationErrors);
        return NextResponse.json(
          { 
            error: 'Transaction validation failed',
            validationErrors,
            details: JSON.stringify(validationErrors)
          },
          { status: 400 }
        );
      }
      
      throw createError;
    }
    
    if (!txn) {
      console.error('[Transactions POST] ❌ Transaction creation returned null');
      return NextResponse.json(
        { error: 'Failed to create transaction: returned null' },
        { status: 500 }
      );
    }
    
    console.log('[Transactions POST] Step 6: ✅ Transaction created successfully');
    console.log('[Transactions POST] Step 6: Transaction details:', {
      _id: txn._id?.toString(),
      transactionId: txn.transactionId,
      orderId: txn.orderId,
      customer: txn.customer,
      amount: txn.amount,
      method: txn.method,
      status: txn.status,
      createdAt: txn.createdAt,
    });

    // Emit WebSocket event to update admin panel in real-time
    console.log('[Transactions POST] Step 7: Emitting WebSocket event...');
    try {
      const transactionData = {
        id: txn._id.toString(),
        transactionId: txn.transactionId,
        orderId: txn.orderId,
        customer: txn.customer,
        amount: txn.amount,
        method: txn.method,
        status: txn.status,
        date: txn.createdAt,
      };
      
      socketManager.emitToAll('new_transaction', transactionData);
      console.log('[Transactions POST] Step 7: ✅ WebSocket event emitted');
    } catch (wsError) {
      console.error('[Transactions POST] Step 7: ⚠️ WebSocket event failed:', wsError);
      // Don't fail the request if WebSocket fails
    }

    console.log('[Transactions POST] Step 8: Returning success response...');
    // Return response with all transaction details
    const successResponse = {
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: txn._id.toString(),
        transactionId: txn.transactionId,
        orderId: txn.orderId,
        customer: txn.customer,
        amount: txn.amount,
        method: txn.method,
        status: txn.status,
        date: txn.createdAt,
      }
    };
    
    console.log('[Transactions POST] ✅ SUCCESS: Returning:', JSON.stringify(successResponse));
    return NextResponse.json(successResponse, { status: 201 });
    
    } catch (error: unknown) {
    const err = error as { message?: string, name?: string, code?: string, stack?: string, errors?: Record<string, any> };
    console.error('[Transactions POST] ❌❌❌ CAUGHT ERROR IN MAIN HANDLER');
    console.error('[Transactions POST] Error type:', typeof error);
    console.error('[Transactions POST] Error instanceof Error:', error instanceof Error);
    console.error('[Transactions POST] Error:', error);
    
    // Extract error details safely
    let errorMessage = 'Unknown error';
    let errorName = 'UnknownError';
    let errorCode = undefined;
    
    try {
      if (err?.message) errorMessage = String(err.message);
      if (err?.name) errorName = String(err.name);
      if (err?.code) errorCode = String(err.code);
    } catch (extractErr) {
      console.error('[Transactions POST] Could not extract error details');
    }
    
    console.error('[Transactions POST] Extracted error details:', {
      message: errorMessage,
      name: errorName,
      code: errorCode,
    });
    console.error('[Transactions POST] Error stack:', err?.stack || 'No stack');
    
    // Log Mongoose validation errors if present
    if (err?.errors) {
      try {
        const validationErrors: Record<string, string> = {};
        for (const [field, e] of Object.entries(err.errors)) {
          validationErrors[field] = e?.message ? String(e.message) : String(e);
        }
        console.error('[Transactions POST] Mongoose validation errors:', validationErrors);
      } catch (validationLogErr) {
        console.error('[Transactions POST] Could not log validation errors:', validationLogErr);
      }
    }
    
    // Build error response - ensure it's always valid JSON
    const errorResponse = {
      success: false,
      error: 'Failed to create transaction',
      message: errorMessage,
      name: errorName,
      code: errorCode || null,
    };
    
    try {
      console.error('[Transactions POST] ❌ RETURNING ERROR:', JSON.stringify(errorResponse));
    } catch (stringifyErr) {
      console.error('[Transactions POST] Could not stringify error response');
    }
    
    // Return error response with try-catch for safety
    try {
      return NextResponse.json(errorResponse, { status: 500 });
    } catch (responseErr) {
      console.error('[Transactions POST] ❌❌ Failed to create error response:', responseErr);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
}
