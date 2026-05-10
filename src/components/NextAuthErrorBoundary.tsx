'use client';

import React, { Component, ReactNode } from 'react';

interface NextAuthErrorBoundaryProps {
  children: ReactNode;
}

interface NextAuthErrorBoundaryState {
  hasError: boolean;
}

export class NextAuthErrorBoundary extends Component<NextAuthErrorBoundaryProps, NextAuthErrorBoundaryState> {
  constructor(props: NextAuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): NextAuthErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('NextAuth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">There was an issue with the authentication system.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
