'use client';

import React, { useState, useEffect } from 'react';
import { websocketClient } from '@/lib/websocket';

export default function WebSocketDebugPage() {
  const [connectionStatus, setConnectionStatus] = useState('not-connected');
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const handleConnect = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      setMessages(prev => [...prev, 'Connected to WebSocket server']);
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      setMessages(prev => [...prev, 'Disconnected from WebSocket server']);
    };

    const handleError = (error: unknown) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      setError(error);
      setMessages(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    };

    const handleTestResponse = (data: unknown) => {
      console.log('Test response:', data);
      setMessages(prev => [...prev, `Test response: ${JSON.stringify(data)}`]);
    };

    // Register event listeners
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('error', handleError);
    websocketClient.on('test_response', handleTestResponse);

    // Connect to WebSocket
    console.log('Attempting to connect to WebSocket');
    setMessages(prev => [...prev, 'Attempting to connect...']);
    websocketClient.connect('debug-order-id');

    // Send a test message after connection
    const sendTestMessage = () => {
      setTimeout(() => {
        if (websocketClient.isConnected) {
          console.log('Sending test message');
          const socket = websocketClient.getSocket();
          socket?.emit('test_message', { message: 'Hello from debug page', timestamp: new Date().toISOString() });
          setMessages(prev => [...prev, 'Sent test message to server']);
        } else {
          console.log('WebSocket not connected, cannot send test message');
          setMessages(prev => [...prev, 'WebSocket not connected, cannot send test message']);
        }
      }, 2000);
    };

    sendTestMessage();

    // Cleanup
    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('error', handleError);
      websocketClient.off('test_response', handleTestResponse);
      websocketClient.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">WebSocket Debug</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Connection Status</h2>
          <div className={`px-4 py-2 rounded-full inline-block ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            connectionStatus === 'disconnected' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Details</h3>
            <pre className="text-sm text-red-700 overflow-x-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Messages</h2>
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {messages.length > 0 ? (
              <ul className="space-y-2">
                {messages.map((msg, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    <span className="font-mono">[{new Date().toLocaleTimeString()}]</span> {msg}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No messages yet...</p>
            )}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => {
              websocketClient.connect('debug-order-id');
              setMessages(prev => [...prev, 'Attempting to connect...']);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Connect
          </button>
          
          <button
            onClick={() => {
              websocketClient.disconnect();
              setMessages(prev => [...prev, 'Disconnected manually']);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
