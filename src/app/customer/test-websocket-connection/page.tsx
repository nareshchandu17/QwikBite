'use client';

import React, { useState, useEffect } from 'react';
import { websocketClient } from '@/lib/websocket';
import { Button } from '@/components/ui/button';

export default function TestWebSocketConnection() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [orderId, setOrderId] = useState('test-order-123');

  useEffect(() => {
    // Handle WebSocket events
    const handleConnect = () => {
      setConnectionStatus('connected');
      addMessage('Connected to WebSocket server');
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
      addMessage('Disconnected from WebSocket server');
    };

    const handleError = (error: unknown) => {
      setConnectionStatus('error');
      addMessage(`WebSocket error: ${error.message || error}`);
    };

    const handleOrderUpdate = (data: unknown) => {
      addMessage(`Order update received: ${JSON.stringify(data)}`);
    };

    const handleRoomJoined = (data: unknown) => {
      addMessage(`Room joined: ${data.message}`);
    };

    const handleRoomLeft = (data: unknown) => {
      addMessage(`Room left: ${data.message}`);
    };

    const handleTestResponse = (data: unknown) => {
      addMessage(`Test response: ${data.message} - ${JSON.stringify(data.data)}`);
    };

    // Register event listeners
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('error', handleError);
    websocketClient.on('order_update', handleOrderUpdate);
    websocketClient.on('room_joined', handleRoomJoined);
    websocketClient.on('room_left', handleRoomLeft);
    websocketClient.on('test_response', handleTestResponse);

    // Cleanup
    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('error', handleError);
      websocketClient.off('order_update', handleOrderUpdate);
      websocketClient.off('room_joined', handleRoomJoined);
      websocketClient.off('room_left', handleRoomLeft);
      websocketClient.off('test_response', handleTestResponse);
      websocketClient.disconnect();
    };
  }, []);

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const connect = () => {
    addMessage('Attempting to connect...');
    setConnectionStatus('connecting');
    websocketClient.connect(orderId);
  };

  const disconnect = () => {
    addMessage('Disconnecting...');
    websocketClient.disconnect();
  };

  const sendTestMessage = () => {
    if (websocketClient.isConnected) {
      websocketClient.getSocket()?.emit('test_message', { orderId, message: 'Hello from client' });
      addMessage('Sent test message');
    } else {
      addMessage('Not connected to WebSocket server');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">WebSocket Connection Test</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Connection Status</h2>
          
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-gray-700 dark:text-gray-300 capitalize">
              Status: {connectionStatus}
            </span>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={connect}
              disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
              className="bg-green-500 hover:bg-green-600"
            >
              Connect
            </Button>
            
            <Button 
              onClick={disconnect}
              disabled={connectionStatus === 'disconnected'}
              className="bg-red-500 hover:bg-red-600"
            >
              Disconnect
            </Button>
            
            <Button 
              onClick={sendTestMessage}
              disabled={!websocketClient.isConnected}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Send Test Message
            </Button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-md h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
            ) : (
              <ul className="space-y-2">
                {messages.map((message, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
