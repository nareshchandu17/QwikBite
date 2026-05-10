'use client';

import React, { useState, useEffect } from 'react';
import { websocketClient } from '@/lib/websocket';

export default function WebSocketTestPage() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleConnect = () => {
      setConnectionStatus('connected');
      setMessages(prev => [...prev, 'Connected to WebSocket server']);
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      setMessages(prev => [...prev, 'Disconnected from WebSocket server']);
    };

    const handleError = (error: unknown) => {
      setConnectionStatus('error');
      setMessages(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    };

    const handleTestResponse = (data: unknown) => {
      setMessages(prev => [...prev, `Test response: ${JSON.stringify(data)}`]);
    };

    // Register event listeners
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('error', handleError);
    websocketClient.on('test_response', handleTestResponse);

    // Connect to WebSocket
    websocketClient.connect('test-order-id');

    // Send a test message after connection
    const sendTestMessage = () => {
      setTimeout(() => {
        if (websocketClient.isConnected) {
          const socket = websocketClient.getSocket();
          socket?.emit('test_message', { message: 'Hello from client', timestamp: new Date().toISOString() });
          setMessages(prev => [...prev, 'Sent test message to server']);
        }
      }, 1000);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">WebSocket Connection Test</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Connection Status</h2>
          <div className={`px-4 py-2 rounded-full inline-block ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </div>
        </div>

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
              websocketClient.connect('test-order-id');
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
