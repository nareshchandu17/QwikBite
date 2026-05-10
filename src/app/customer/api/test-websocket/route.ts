import { NextResponse } from 'next/server';

export async function GET() {
  // Return the WebSocket server information
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
  
  return NextResponse.json({ 
    success: true,
    message: 'WebSocket server information',
    backendUrl,
    envVars: {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      PORT: process.env.PORT
    }
  });
}