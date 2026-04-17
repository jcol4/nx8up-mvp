'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({
  campaignTitle,
  budgetDisplay,
  returnUrl,
  largeBudget,
  preferredPaymentMethod,
}: {
  campaignTitle: string
  budgetDisplay: string
  returnUrl: string
  largeBudget: boolean
  preferredPaymentMethod: string | null
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      setProcessing(false)
      return
    }

    // Card payments complete synchronously
    if (paymentIntent?.status === 'succeeded') {
      window.location.href = `${returnUrl}?payment_intent=${paymentIntent.id}&redirect_status=succeeded`
      return
    }

    // ACH / bank transfers enter processing state — campaign stays pending until it settles
    if (paymentIntent?.status === 'processing') {
      window.location.href = '/sponsor/campaigns?payment=processing'
      return
    }

    // Redirect-based methods (some ACH flows) are handled by Stripe automatically above
    setError('Payment did not complete. Please try again.')
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="dash-panel p-5">
        <h2 className="text-sm font-semibold dash-text-muted uppercase tracking-wide mb-4">
          Payment Summary
        </h2>
        <div className="flex justify-between items-center">
          <span className="dash-text">{campaignTitle}</span>
          <span className="font-bold dash-text-bright">{budgetDisplay}</span>
        </div>
        <p className="text-xs dash-text-muted mt-2">
          Funds are held in escrow and released to creators only after you approve their
          deliverables.
        </p>
      </div>

      <div className="dash-panel p-5">
        <h2 className="text-sm font-semibold dash-text-muted uppercase tracking-wide mb-4">
          Payment Details
        </h2>
        {largeBudget ? (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg border border-[#00c8ff]/30 bg-[#00c8ff]/5">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#00c8ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#00c8ff] leading-relaxed">
              <span className="font-semibold">ACH bank transfer required for budgets over $999,999.</span> Bank transfers take 3–5 business days to settle. Your campaign will go live automatically once payment clears.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-red-400 leading-relaxed">
              <span className="font-semibold">Heads up:</span> If you pay by ACH bank transfer, it takes 3–5 business days to settle. Your campaign will not launch until payment clears.
            </p>
          </div>
        )}
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder:
              preferredPaymentMethod === 'ach'
                ? ['us_bank_account', 'card']
                : ['card', 'us_bank_account'],
          }}
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 rounded-lg bg-[#a855f7] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {processing ? 'Processing…' : `Pay ${budgetDisplay} & Launch Campaign`}
      </button>

      <p className="text-xs dash-text-muted text-center">
        Secured by Stripe. Your payment is held in escrow until deliverables are approved.
      </p>
    </form>
  )
}

export default function PaymentForm({
  clientSecret,
  campaignTitle,
  budgetDisplay,
  returnUrl,
  largeBudget,
  preferredPaymentMethod,
}: {
  clientSecret: string
  campaignTitle: string
  budgetDisplay: string
  returnUrl: string
  largeBudget: boolean
  preferredPaymentMethod: string | null
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#a855f7',
            colorBackground: '#0d1f2d',
            colorText: '#c8dff0',
            colorDanger: '#f87171',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm
        campaignTitle={campaignTitle}
        budgetDisplay={budgetDisplay}
        returnUrl={returnUrl}
        largeBudget={largeBudget}
        preferredPaymentMethod={preferredPaymentMethod}
      />
    </Elements>
  )
}
