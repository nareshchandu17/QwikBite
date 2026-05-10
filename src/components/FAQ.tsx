"use client";

import React from 'react';
import Accordion from './Accordion';

const faqItems = [
  {
    id: 'q1',
    title: 'How do I place an order?',
    content: 'Browse the menu, add items to your cart, select a pickup time, and complete checkout on the Order Summary page.',
  },
  {
    id: 'q2',
    title: 'Can I change my pickup time?',
    content: 'Yes — if your order hasn\'t been prepared yet, go to Orders and modify the pickup time or contact support.',
  },
  {
    id: 'q3',
    title: 'What payment methods are accepted?',
    content: 'We accept major credit/debit cards and campus payment options where available.',
  },
  {
    id: 'q4',
    title: 'How do I cancel an order?',
    content: 'Open the order in My Orders and choose Cancel if it is still eligible; contact support for help after preparation.',
  },
  {
    id: 'q5',
    title: 'Do you offer refunds?',
    content: 'Refunds are handled on a case-by-case basis. Please contact support with your order details.',
  },
];

export default function FAQ() {
  return (
    <section className="w-full px-0 py-0">
      <div className="bg-white dark:bg-gray-900 rounded-none p-6 md:p-8 shadow-sm border-0 border-t border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100 pl-4 md:pl-8">Frequently Asked Questions</h3>
        <div className="px-4 md:px-8">
          <Accordion items={faqItems} />
        </div>
      </div>
    </section>
  );
}