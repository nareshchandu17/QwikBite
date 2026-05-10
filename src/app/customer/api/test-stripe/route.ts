import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function GET() {
  try {
    // Test the Stripe connection by listing payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      type: 'card',
      limit: 1,
    });

    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      paymentMethods: paymentMethods.data,
    });
  } catch (error) {
    console.error('Stripe connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to Stripe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}