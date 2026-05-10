// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/home/Header';
import { ThemeProvider } from '@/components/theme-provider';
import { SearchProvider } from '@/context/SearchContext';
import { AuthProvider } from '@/context/AuthContext';
import { act } from 'react-dom/test-utils';
import { useCartStore } from '@/stores/cartStore';

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        <SearchProvider>{children}</SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

test('Header shows cart count and updates when items added', () => {
  render(
    <Providers>
      <Header />
    </Providers>
  );

  // Initially no badge
  expect(screen.queryByText('1')).not.toBeInTheDocument();

  act(() => {
    useCartStore.getState().addItem({ id: 'x', name: 'Test', price: 1 });
  });

  // Now badge should show 1
  expect(screen.getByText('1')).toBeInTheDocument();
});
