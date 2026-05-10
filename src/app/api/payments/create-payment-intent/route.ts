import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Initialize Stripe with your secret key
let stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });
  }
  return stripe;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { amount, currency = 'usd' } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate currency
    if (typeof currency !== 'string' || currency.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid currency. Currency must be a 3-letter code (e.g., usd).' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate amount is not too large (prevent overflow)
    if (amount > 100000000) { // $1,000,000.00 in cents
      return NextResponse.json(
        { error: 'Amount is too large. Maximum amount is $1,000,000.00' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Stripe instance
    let stripeInstance;
    try {
      stripeInstance = getStripeInstance();
    } catch (stripeError: unknown) {
      console.error('Stripe initialization error:', stripeError);
      return NextResponse.json(
        { error: 'Payment service is not configured. Please contact support.' },
        { status: 503, headers: corsHeaders }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    let paymentIntent;
    try {
      paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.floor(amount), // Ensure it's an integer
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (stripeError: unknown) {
      console.error('Stripe API error:', stripeError);
      return NextResponse.json(
        { 
          error: 'Failed to create payment intent',
          message: stripeError?.message || 'Unknown error'
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: 'Payment intent created but no client secret returned' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        message: error?.message || 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

