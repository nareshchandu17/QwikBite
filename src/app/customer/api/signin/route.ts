import { redirect } from 'next/navigation';

export async function GET() {
  redirect('/signin');
}

export async function POST() {
  // For POST requests, we'll let the frontend handle them
  redirect('/signin');
}