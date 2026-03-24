'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Zap, Crown, Sparkles } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/create-checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId, billing: billingCycle }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: <Zap className="w-6 h-6" />,
      description: 'Get started with basic market insights',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { name: 'Public blog posts', included: true },
        { name: 'Basic backtest results', included: true },
        { name: 'Weekly newsletter', included: true },
        { name: 'Community access', included: true },
        { name: 'Premium blog content', included: false },
        { name: 'Real-time financial models', included: false },
        { name: 'Advanced backtest strategies', included: false },
        { name: 'Priority support', included: false },
      ],
      ctaText: 'Sign Up Free',
      ctaAction: 'link',
      ctaLink: '/register',
      highlighted: false,
      iconColor: 'text-muted-foreground',
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: <Crown className="w-6 h-6" />,
      description: 'Full access to everything we offer',
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      features: [
        { name: 'Everything in Standard', included: true },
        { name: 'All real-time financial models', included: true },
        { name: 'Advanced backtest strategies', included: true },
        { name: 'Custom backtest requests', included: true },
        { name: 'API access (coming soon)', included: true },
        { name: 'Early access to new features', included: true },
        { name: 'Priority support', included: true },
        { name: '1-on-1 strategy calls (monthly)', included: true },
      ],
      ctaText: 'Get Premium',
      ctaAction: 'checkout',
      ctaLink: '',
      highlighted: true,
      iconColor: 'text-primary',
    },
    {
      id: 'standard',
      name: 'Standard',
      icon: <Sparkles className="w-6 h-6" />,
      description: 'Premium content for serious traders',
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        { name: 'All public blog posts', included: true },
        { name: 'Basic backtest results', included: true },
        { name: 'Weekly newsletter', included: true },
        { name: 'Premium blog content', included: true },
        { name: 'Email alerts for new content', included: true },
        { name: 'Monthly market reports', included: true },
        { name: 'Real-time financial models', included: false },
        { name: 'Advanced backtest strategies', included: false },
      ],
      ctaText: 'Get Standard',
      ctaAction: 'checkout',
      ctaLink: '',
      highlighted: false,
      iconColor: 'text-[#FF8C00]',
    },
  ];

  // Reorder: Free, Standard, Premium (Premium in the middle for visual emphasis)
  const orderedPlans = [plans[0], plans[2], plans[1]];

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Edge</span>
          </h1>
          <p className="text-xl text-grey max-w-2xl mx-auto">
            Unlock quantitative insights, real-time models, and premium research to stay ahead of the markets
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-14">
          <div className="bg-card p-1.5 rounded-xl inline-flex border border-border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-grey hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-grey hover:text-foreground'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                -16%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 items-start">
          {orderedPlans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const perMonth = billingCycle === 'annual' && plan.annualPrice > 0
              ? (plan.annualPrice / 12).toFixed(2)
              : null;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-card p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                  plan.highlighted
                    ? 'ring-2 ring-primary/40 shadow-xl shadow-primary/10 border-primary/30 md:-mt-4 md:mb-4'
                    : 'border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#00ced1] to-[#00FF9D] text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-muted ${plan.iconColor}`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                  </div>
                </div>
                <p className="text-grey text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">
                      ${price === 0 ? '0' : price.toFixed(2)}
                    </span>
                    {price > 0 && (
                      <span className="text-grey text-sm">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  {perMonth && (
                    <p className="text-accent text-sm mt-1">
                      That&apos;s just ${perMonth}/month
                    </p>
                  )}
                  {price === 0 && (
                    <p className="text-grey text-sm mt-1">Free forever</p>
                  )}
                </div>

                {/* CTA Button */}
                {plan.ctaAction === 'link' ? (
                  <Link
                    href={plan.ctaLink}
                    className={`block w-full text-center py-3.5 rounded-xl font-semibold transition-all duration-200 mb-8 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-primary to-[#00b4b7] text-primary-foreground hover:shadow-lg hover:shadow-primary/30'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }`}
                  >
                    {plan.ctaText}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`block w-full text-center py-3.5 rounded-xl font-semibold transition-all duration-200 mb-8 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-primary to-[#00b4b7] text-primary-foreground hover:shadow-lg hover:shadow-primary/30'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    } disabled:opacity-50`}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Processing...
                      </span>
                    ) : plan.ctaText}
                  </button>
                )}

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-grey/40 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-grey/50'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-20 text-grey text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Secured by Stripe
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            All major cards accepted
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel my subscription at any time?', a: "Yes, you can cancel anytime. You'll keep access until the end of your billing period." },
              { q: 'How do I access premium content?', a: 'After subscribing, premium content is unlocked immediately. Just log in and browse.' },
              { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, and Discover via Stripe.' },
              { q: 'Can I switch plans?', a: 'Yes. Upgrades take effect immediately (prorated). Downgrades apply at the next billing cycle.' },
              { q: 'Do you offer refunds?', a: "We don't typically offer refunds, but contact us if you're unsatisfied and we'll work it out." },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-card border border-border rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold hover:bg-muted transition-colors">
                  {q}
                  <svg className="w-5 h-5 text-grey group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <p className="px-5 pb-5 text-grey">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-card rounded-2xl border border-border p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Your Edge?</h2>
          <p className="text-grey mb-8 max-w-xl mx-auto">
            Join traders and analysts who use Quant (h)Edge to make data-driven decisions
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="mailto:lagobrian@outlook.com"
              className="border border-primary text-primary hover:bg-primary/10 transition-colors px-8 py-3 rounded-xl font-semibold"
            >
              Contact Us
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-primary to-[#00b4b7] text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all px-8 py-3 rounded-xl font-semibold">
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
