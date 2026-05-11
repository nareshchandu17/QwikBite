// @vitest-environment jsdom
import React from 'react'
import { render } from '@testing-library/react'
import OrderCard from '@/components/orders/OrderCard'

const mockOrder = {
  id: 'ORD-TEST',
  createdAt: new Date().toISOString(),
  items: [{ id: 'm1', name: 'Test Item', qty: 1, price: 5 }],
  total: 5,
  payment: 'Card',
  status: 'Pending'
}

describe('OrderCard', () => {
  it('renders basic order info', () => {
    const { getByText } = render(<OrderCard order={mockOrder as any} />)
    expect(getByText('Order #ORD-TEST')).toBeTruthy()
  })
})
