import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, collections } from '@/lib/db/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Find the order
    const order = await db.collection(collections.orders).findOne({ 
      id: orderId 
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate HTML invoice
    const htmlInvoice = generateInvoiceHTML(order);

    // Return as HTML with print-friendly styling
    return new NextResponse(htmlInvoice, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${orderId}.html"`
      }
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(order: any) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const items = Array.isArray(order.items) ? order.items : [];
  
  const subtotal = items.reduce((sum: number, item: any) => {
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0');
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${order.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .invoice-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .invoice-header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .invoice-body {
            padding: 40px;
        }
        
        .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .info-block h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        
        .info-block p {
            margin-bottom: 8px;
            font-size: 1em;
        }
        
        .info-block .order-id {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .items-table th {
            background: #f8f9fa;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #667eea;
            border-bottom: 2px solid #e9ecef;
        }
        
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .item-name {
            font-weight: 500;
            color: #333;
        }
        
        .item-quantity {
            text-align: center;
            color: #666;
        }
        
        .item-price {
            text-align: right;
            font-weight: 500;
        }
        
        .invoice-summary {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin-top: 30px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .summary-row.total {
            font-weight: bold;
            font-size: 1.3em;
            color: #667eea;
            padding-top: 10px;
            border-top: 2px solid #dee2e6;
        }
        
        .invoice-footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .invoice-footer p {
            color: #666;
            margin-bottom: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-preparing {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        
        .status-cancelled {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-received {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
        
        @media (max-width: 768px) {
            .invoice-info {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .items-table {
                font-size: 0.9em;
            }
            
            .items-table th,
            .items-table td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <h1>🍽️ qwikBite</h1>
            <p>Order Invoice</p>
        </div>
        
        <div class="invoice-body">
            <div class="invoice-info">
                <div class="info-block">
                    <h3>Order Information</h3>
                    <p class="order-id">Order ID: ${order.id}</p>
                    <p>Date: ${orderDate}</p>
                    <p>Time Slot: ${order.timeSlot || 'ASAP'}</p>
                    <p>Pickup Date: ${order.pickupDate || 'N/A'}</p>
                    <p>Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.statusText || order.status}</span></p>
                </div>
                
                <div class="info-block">
                    <h3>Customer Information</h3>
                    <p>Name: ${order.username || 'Customer'}</p>
                    <p>Payment Method: ${order.paymentMethod || 'Online'}</p>
                    <p>Payment Status: ${order.paymentStatus || 'Completed'}</p>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center; width: 100px;">Quantity</th>
                        <th style="text-align: right; width: 120px;">Price</th>
                        <th style="text-align: right; width: 120px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item: any, index: number) => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        const quantity = typeof item === 'string' ? 1 : (item.quantity || 1);
                        const price = typeof item === 'string' ? 0 : (typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0'));
                        const itemTotal = price * quantity;
                        
                        return `
                        <tr>
                            <td class="item-name">${itemName}</td>
                            <td class="item-quantity">${quantity}</td>
                            <td class="item-price">₹${price.toFixed(2)}</td>
                            <td class="item-price">₹${itemTotal.toFixed(2)}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="invoice-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>GST (5%):</span>
                    <span>₹${tax.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="invoice-footer">
            <p><strong>Thank you for ordering from qwikBite! 🎉</strong></p>
            <p>For any queries, please contact our support team.</p>
            <p style="margin-top: 20px; font-size: 0.9em; color: #999;">
                This is a computer-generated invoice and does not require a signature.
            </p>
        </div>
    </div>
    
    <script>
        // Auto-print when page loads
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
  `;
}
