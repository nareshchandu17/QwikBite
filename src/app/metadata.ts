import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'qwikBite - Smart Campus Dining',
  description: 'Order from your canteen in seconds. Skip the queues. Enjoy your break.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#18181b',
};

// This file is used to define metadata that should be available to server components
// and can be imported by the root layout.tsx file
