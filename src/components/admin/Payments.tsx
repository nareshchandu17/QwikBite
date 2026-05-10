'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, PaymentStatus, PaymentMethod } from '@/types/payment';
import { X } from 'lucide-react';
import { useWebSocket } from '@/context/WebSocketContext';


const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const styles = {
    'Success': 'bg-[#4CAF50]/20 text-[#4CAF50]',
    'Pending': 'bg-[#FF9800]/20 text-[#FF9800]',
    'Failed': 'bg-[#FF3D00]/20 text-[#FF3D00]',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
};

const MethodIcon: React.FC<{ method: PaymentMethod }> = ({ method }) => {
  const styles = {
    'UPI': 'bg-purple-500/20 text-purple-400',
    'Card': 'bg-blue-500/20 text-blue-400',
    'Cash': 'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[method]}`}>
      {method}
    </span>
  );
};

interface TransactionDetailsModalProps {
  txn: Transaction;
  onClose: () => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ txn, onClose }) => {
  const downloadReceipt = () => {
    // Create receipt content
    const receiptContent = `
╔══════════════════════════════════════════════════════════════╗
║                      PAYMENT RECEIPT                         ║
╠══════════════════════════════════════════════════════════════╣
║ Transaction ID: ${txn.transactionId.padEnd(44)} ║
║ Order ID:       ${txn.orderId.padEnd(44)} ║
║ Customer:       ${txn.customer.padEnd(44)} ║
║ Amount:         ₹${txn.amount.toFixed(2).padEnd(43)} ║
║ Method:         ${txn.method.padEnd(44)} ║
║ Status:         ${txn.status.padEnd(44)} ║
║ Date:           ${txn.date.padEnd(44)} ║
╠══════════════════════════════════════════════════════════════╣
║                     qwikBite                              ║
║                Campus Food Ordering System                    ║
╚══════════════════════════════════════════════════════════════╝
    `.trim();

    // Create a blob with the receipt content
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${txn.transactionId}_${new Date().toISOString().split('T')[0]}.txt`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-md rounded-3xl overflow-hidden relative animate-scale-in border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white">Transaction Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-8 flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            txn.status === 'Success' ? 'bg-[#FF512F]/20 text-[#4CAF50]' :
            txn.status === 'Pending' ? 'bg-[#FF9800]/20 text-[#FF9800]' : 'bg-[#FF3D00]/20 text-[#FF3D00]'
          }`}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {txn.status === 'Success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
              {txn.status === 'Pending' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              {txn.status === 'Failed' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-1">₹{txn.amount.toFixed(2)}</h2>
          <p className="text-[#9ca3af] text-sm mb-6">{txn.status} Transaction</p>

          <div className="w-full space-y-4">
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[#9ca3af] text-sm">Transaction ID</span>
              <span className="text-white font-mono text-sm">{txn.transactionId}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[#9ca3af] text-sm">Order ID</span>
              <span className="text-primary font-bold text-sm">{txn.orderId}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[#9ca3af] text-sm">Customer Name</span>
              <span className="text-white font-semibold text-sm">{txn.customer}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[#9ca3af] text-sm">Amount</span>
              <span className="text-white font-bold text-sm">₹{txn.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[#9ca3af] text-sm">Payment Method</span>
              <span className="text-white text-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  txn.method === 'UPI' ? 'bg-purple-500' : 
                  txn.method === 'Card' ? 'bg-blue-500' : 'bg-green-500'
                }`}></span>
                {txn.method}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/5">
              <span className="text-[#9ca3af] text-sm">Status</span>
              <span className={`font-bold text-sm ${
                txn.status === 'Success' ? 'text-[#4CAF50]' :
                txn.status === 'Pending' ? 'text-[#FF9800]' : 'text-[#FF3D00]'
              }`}>{txn.status}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-[#9ca3af] text-sm">Date & Time</span>
              <span className="text-white text-sm">{txn.date}</span>
            </div>
          </div>

          <div className="mt-8 w-full flex gap-3">
            <button 
              onClick={downloadReceipt}
              className="flex-1 py-3 rounded-xl bg-[#FF512F] hover:bg-[#FF512F]/80 text-white text-sm font-bold border border-[#FF512F]/50 transition-colors cursor-pointer"
            >
              Download Receipt
            </button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#FF512F]/20 hover:bg-[#FF512F]/90 text-white text-sm font-bold shadow-[0 0 25px rgba(255, 81, 47, 0.4)] transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Payments: React.FC = () => {
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const { transactions } = useWebSocket();
  
  // Format transactions with proper date formatting
  const formattedTransactions = transactions.map(txn => ({
    ...txn,
    date: txn.date ? new Date(txn.date).toLocaleString() : 'N/A'
  }));

  return (
    <div>
      {selectedTxn && (
        <TransactionDetailsModal 
          txn={selectedTxn} 
          onClose={() => setSelectedTxn(null)} 
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Payments & Transactions</h1>
        <button className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-2xl hover:bg-gradient-to-br from-[#FF512F]/20 to-transparent border border-[#FF512F]/20">
          <p className="text-[#9ca3af] text-sm font-medium">Total Revenue Today</p>
          <p className="text-3xl font-bold mt-2 text-white">₹12,540</p>
          <p className="text-[#4CAF50] text-xs mt-1 font-bold">+8% vs yesterday</p>
        </div>
        <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-2xl hover:bg-gradient-to-br from-[#FF512F]/20 to-transparent border border-[#FF512F]/20">
          <p className="text-[#9ca3af] text-sm font-medium">Pending Settlements</p>
          <p className="text-3xl font-bold mt-2 text-white">₹1,200</p>
          <p className="text-[#FF9800] text-xs mt-1 font-bold">4 transactions processing</p>
        </div>
        <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-2xl hover:bg-gradient-to-br from-[#FF512F]/20 to-transparent border border-[#FF512F]/20">
          <p className="text-[#9ca3af] text-sm font-medium">Failed Transactions</p>
          <p className="text-3xl font-bold mt-2 text-white">3</p>
          <p className="text-[#FF3D00] text-xs mt-1 font-bold">Requires attention</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[#9ca3af] text-xs uppercase tracking-wider">
                <th className="p-6 font-semibold">Transaction ID</th>
                <th className="p-6 font-semibold">Order Ref</th>
                <th className="p-6 font-semibold">Customer</th>
                <th className="p-6 font-semibold">Method</th>
                <th className="p-6 font-semibold">Amount</th>
                <th className="p-6 font-semibold">Status</th>
                <th className="p-6 font-semibold">Time</th>
                <th className="p-6 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {formattedTransactions.map((txn, index) => (
                <tr key={txn.id || txn.transactionId || `txn-${index}`} className="hover:bg-white/5 transition-colors group">
                  <td className="p-6 font-mono text-sm text-white font-semibold">{txn.transactionId}</td>
                  <td className="p-6 font-medium text-[#FF521F]">{txn.orderId}</td>
                  <td className="p-6 text-white font-semibold">{txn.customer}</td>
                  <td className="p-6"><MethodIcon method={txn.method} /></td>
                  <td className="p-6 font-bold text-white">₹{txn.amount.toFixed(2)}</td>
                  <td className="p-6"><PaymentStatusBadge status={txn.status} /></td>
                  <td className="p-6 text-sm text-[#9ca3af]">{txn.date}</td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => setSelectedTxn(txn)}
                      className="text-xs bg-white/5 hover:bg-[#FF521F] hover:text-white px-4 py-2 rounded-lg transition-all shadow-sm border border-white/5 hover:border-[#FF521F]/50 cursor-pointer"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
