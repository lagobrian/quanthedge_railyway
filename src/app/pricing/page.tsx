'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Free',
      description: 'Basic access to public content',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { name: 'Access to all public blog posts', included: true },
        { name: 'Basic backtest results', included: true },
        { name: 'Weekly newsletter', included: true },
        { name: 'Premium blog content', included: false },
        { name: 'Real-time financial models', included: false },
        { name: 'Advanced backtest strategies', included: false },
        { name: 'Email notifications for new content', included: false },
        { name: 'Priority support', included: false },
      ],
      ctaText: 'Sign Up Free',
      ctaLink: '/register',
      highlighted: false,
    },
    {
      name: 'Premium',
      description: 'Full access to all content and features',
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      features: [
        { name: 'Access to all public blog posts', included: true },
        { name: 'Basic backtest results', included: true },
        { name: 'Weekly newsletter', included: true },
        { name: 'Premium blog content', included: true },
        { name: 'Real-time financial models', included: true },
        { name: 'Advanced backtest strategies', included: true },
        { name: 'Email notifications for new content', included: true },
        { name: 'Priority support', included: true },
      ],
      ctaText: 'Get Premium',
      ctaLink: '/register?plan=premium',
      highlighted: true,
    },
    {
      name: 'Standard',
      description: 'Access to premium content',
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        { name: 'Access to all public blog posts', included: true },
        { name: 'Basic backtest results', included: true },
        { name: 'Weekly newsletter', included: true },
        { name: 'Premium blog content', included: true },
        { name: 'Real-time financial models', included: false },
        { name: 'Advanced backtest strategies', included: false },
        { name: 'Email notifications for new content', included: true },
        { name: 'Priority support', included: false },
      ],
      ctaText: 'Get Standard',
      ctaLink: '/register?plan=standard',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
          <p className="text-xl text-grey max-w-3xl mx-auto">
            Choose the plan that best fits your needs and gain your quantitative edge in the markets
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-darkBlue/30 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                billingCycle === 'monthly'
                  ? 'bg-blue text-background'
                  : 'text-grey hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                billingCycle === 'annual'
                  ? 'bg-blue text-background'
                  : 'text-grey hover:text-foreground'
              }`}
            >
              Annual Billing
              <span className="ml-1 text-xs text-green">Save 16%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card relative ${
                plan.highlighted
                  ? 'border-blue ring-2 ring-blue/20'
                  : 'border-blue/20 hover:border-blue/40'
              } transition-all`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue text-background text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-grey">{plan.description}</p>
              </div>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold">
                  $
                  {billingCycle === 'monthly'
                    ? plan.monthlyPrice.toFixed(2)
                    : plan.annualPrice.toFixed(2)}
                </div>
                <div className="text-grey">
                  {billingCycle === 'monthly' ? 'per month' : 'per year'}
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature.name} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {feature.included ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-grey"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className={`ml-3 ${feature.included ? 'text-foreground' : 'text-grey'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <Link
                  href={plan.ctaLink}
                  className={`block w-full text-center py-3 rounded-md font-medium ${
                    plan.highlighted
                      ? 'bg-blue text-background hover:bg-lightBlue'
                      : 'bg-darkBlue/50 text-foreground hover:bg-darkBlue/70'
                  } transition-colors`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">Can I cancel my subscription at any time?</h3>
              <p className="text-grey">
                Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access until the end of your current billing period.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">How do I access premium content?</h3>
              <p className="text-grey">
                After subscribing to a paid plan, you'll have immediate access to all premium content included in your subscription. Simply log in to your account to view premium articles and use real-time models.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-grey">
                We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. Payments are securely processed through Stripe.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">Can I upgrade or downgrade my plan later?</h3>
              <p className="text-grey">
                Yes, you can upgrade or downgrade your subscription at any time. If you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle. If you downgrade, the changes will take effect at the start of your next billing cycle.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-grey">
                We don't typically offer refunds, but if you're unsatisfied with your subscription for any reason, please contact our support team, and we'll do our best to resolve the issue.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 card bg-gradient-to-r from-darkBlue to-background">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-grey mb-6">
              Our team is here to help you choose the right plan for your needs
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="mailto:lagobrian@outlook.com"
                className="bg-transparent border border-blue text-blue hover:bg-blue/10 transition-colors px-6 py-3 rounded-md"
              >
                Contact Us
              </Link>
              <Link href="/register" className="btn-primary px-6 py-3">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 