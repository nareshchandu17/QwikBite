// @ts-nocheck
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Header } from "@/components/home/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { SearchProvider } from "@/context/SearchContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { act } from "react-dom/test-utils";
import { useCartStore } from "@/stores/cartStore";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        <AuthModalProvider>
          <SearchProvider>{children}</SearchProvider>
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

test("Header renders logo and action buttons", () => {
  render(
    <Providers>
      <Header />
    </Providers>,
  );

  // Logo should be present
  expect(screen.getByText("qwik")).toBeInTheDocument();
  
  // Sign In / Get Started buttons should be present when unauthenticated
  expect(screen.getByText("Sign In")).toBeInTheDocument();
  expect(screen.getByText("Get Started")).toBeInTheDocument();
});
