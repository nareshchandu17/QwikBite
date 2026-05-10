'use client';

import { WebSocketProvider } from '@/context/WebSocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <WebSocketProvider>{children}</WebSocketProvider>;
}
