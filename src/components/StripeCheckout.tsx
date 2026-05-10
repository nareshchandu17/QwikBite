"use client"

import React, { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE || '')

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href }
      })
      if (error) {
        toast.error(error.message || 'Payment failed')
      } else {
        toast.success('Payment succeeded (redirecting)')
      }
    } catch (err) {
      console.error(err)
      toast.error('Payment failed')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-end">
        <button disabled={!stripe || loading} className="px-4 py-2 bg-primary-600 text-white rounded">
          {loading ? 'Processing...' : 'Pay now'}
        </button>
      </div>
    </form>
  )
}

export default function StripeCheckout({ orderId }: { orderId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const resp = await fetch('/api/payments/create-intent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId }), credentials: 'include' })
        const json = await resp.json()
        if (json?.status === 'success' && json.data?.clientSecret) {
          if (mounted) setClientSecret(json.data.clientSecret)
        } else if (json?.status === 'success' && json.data?.clientSecret == null && json.data?.clientSecret === undefined && json.data.clientSecret === null) {
          // no-op
        } else if (json?.status === 'success' && json.data?.clientSecret == null && json.data.clientSecret === undefined) {
          // no-op
        } else if (json?.status === 'success' && json.data?.clientSecret === undefined) {
          // fallback
        } else if (json?.status === 'success' && json.data?.clientSecret == null) {
          // fallback
        } else if (json?.status === 'success' && json.data?.clientSecret) {
          if (mounted) setClientSecret(json.data.clientSecret)
        } else if (json?.clientSecret) {
          if (mounted) setClientSecret(json.clientSecret)
        } else if (json?.data?.clientSecret) {
          if (mounted) setClientSecret(json.data.clientSecret)
        } else {
          console.error('unexpected create-intent response', json)
        }
      } catch (err) { console.error('create-intent failed', err) }
    }
    init()
    return () => { mounted = false }
  }, [orderId])

  if (!clientSecret) return <div>Initializing payment...</div>

  const options = { clientSecret }
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}
