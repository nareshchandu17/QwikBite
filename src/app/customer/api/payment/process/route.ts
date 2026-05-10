import { NextResponse } from "next/server";

// This is a mock payment processor endpoint
// In a real application, this would integrate with a payment gateway like Stripe, PayPal, etc.

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract payment data from form
    const orderId = formData.get('orderId') as string;
    const amount = formData.get('amount') as string;
    const paymentMethod = formData.get('paymentMethod') as string;
    const returnUrl = formData.get('returnUrl') as string;
    const cancelUrl = formData.get('cancelUrl') as string;
    
    console.log("Processing payment:", { orderId, amount, paymentMethod, returnUrl, cancelUrl });
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // In a real implementation, you would:
    // 1. Validate the payment details
    // 2. Communicate with the payment gateway
    // 3. Process the payment
    // 4. Update the order status in your database
    // 5. Redirect to the appropriate URL based on success/failure
    
    // For this demo, we'll simulate a successful payment
    const isSuccess = Math.random() > 0.2; // 80% success rate for demo purposes
    
    if (isSuccess) {
      // Update order status to "Preparing" for successful payment
      // In a real app, you would call your orders API to update the status
      
      // Redirect to success page
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Payment Successful</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #f3f4f6; 
              }
              .container { 
                text-align: center; 
                padding: 2rem; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              }
              .success { color: #10b981; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">Payment Successful!</h1>
              <p>Your payment has been processed successfully.</p>
              <p>Order ID: ${orderId}</p>
              <p>Redirecting to order status...</p>
              <script>
                setTimeout(() => {
                  window.location.href = "${returnUrl}";
                }, 3000);
              </script>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } else {
      // Redirect to failure page
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Payment Failed</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #f3f4f6; 
              }
              .container { 
                text-align: center; 
                padding: 2rem; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              }
              .error { color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Payment Failed</h1>
              <p>Sorry, your payment could not be processed.</p>
              <p>Order ID: ${orderId}</p>
              <p>Redirecting back to payment page...</p>
              <script>
                setTimeout(() => {
                  window.location.href = "${cancelUrl}";
                }, 3000);
              </script>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}