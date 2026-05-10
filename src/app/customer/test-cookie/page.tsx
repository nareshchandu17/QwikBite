"use client";

import React, { useState } from "react";

export default function TestCookiePage() {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const testCookie = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-cookie');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing cookie:', error);
      setResult({ error: 'Error testing cookie' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Cookie Test Page</h1>
        
        <div className="mb-6">
          <button 
            onClick={testCookie}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Cookie'}
          </button>
        </div>
        
        {result && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Test Result</h2>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap break-words">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
