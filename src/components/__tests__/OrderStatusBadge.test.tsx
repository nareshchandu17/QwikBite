// @vitest-environment jsdom
import React from 'react'
import { render } from '@testing-library/react'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'

describe('OrderStatusBadge', () => {
  it('renders status text', () => {
    const { getByText } = render(<OrderStatusBadge status="Delivered" />)
    expect(getByText('Delivered')).toBeTruthy()
  })
})
