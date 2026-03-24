'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Bot, ShoppingBag, Lock, TrendingUp, Shield } from 'lucide-react';

type Tab = 'bots' | 'merch';

const bots = [
  {
    id: 'breadth-bot',
    name: 'Crypto Breadth Bot',
    description: 'Trades Bitcoin based on crypto breadth indicator signals. Goes long when breadth crosses above threshold, short on cross-under.',
    instrument: 'BTCUSDT',
    strategy: 'Mean Reversion',
    minInvestment: 100,
    lockPeriod: '30 days',
    backtestedReturn: '+18,904%',
    sharpe: '1.87',
    status: 'coming_soon',
    color: '#00ced1',
  },
  {
    id: 'altcoin-momentum',
    name: 'Altcoin Momentum Bot',
    description: 'Rotates into top-performing altcoins based on market-cap weighted momentum signals from the Altcoin 100 Index.',
    instrument: 'ALT100',
    strategy: 'Momentum',
    minInvestment: 250,
    lockPeriod: '30 days',
    backtestedReturn: '+517,730%',
    sharpe: '2.52',
    status: 'coming_soon',
    color: '#00FF9D',
  },
  {
    id: 'macro-hedge',
    name: 'Macro Hedge Bot',
    description: 'Uses FRED macro indicators (yield curve, VIX, unemployment) to hedge portfolio risk by adjusting equity/bond allocation.',
    instrument: 'SPY/TLT',
    strategy: 'Risk Parity',
    minInvestment: 500,
    lockPeriod: '90 days',
    backtestedReturn: '+142%',
    sharpe: '1.45',
    status: 'coming_soon',
    color: '#FF8C00',
  },
];

const merch = [
  {
    id: 'tshirt-quant',
    name: '"Your Quantitative Edge" Tee',
    description: 'Premium cotton t-shirt with the Quant (h)Edge logo',
    price: 29.99,
    image: null,
    status: 'coming_soon',
  },
  {
    id: 'mug-breadth',
    name: 'Crypto Breadth Mug',
    description: 'Ceramic mug featuring the crypto breadth chart',
    price: 19.99,
    image: null,
    status: 'coming_soon',
  },
  {
    id: 'hoodie-edge',
    name: '"I Have an Edge" Hoodie',
    description: 'Pullover hoodie for those cold trading sessions',
    price: 49.99,
    image: null,
    status: 'coming_soon',
  },
  {
    id: 'sticker-pack',
    name: 'Trader Sticker Pack',
    description: '10 vinyl stickers with financial memes and Quant (h)Edge designs',
    price: 9.99,
    image: null,
    status: 'coming_soon',
  },
];

export default function StorePage() {
  const [tab, setTab] = useState<Tab>('bots');

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            The <span className="text-primary">Edge</span> Store
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Funded trading bots powered by our quantitative models, plus exclusive merch for the quant-minded
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <button
              onClick={() => setTab('bots')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                tab === 'bots' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-4 h-4" /> Funded Bots
            </button>
            <button
              onClick={() => setTab('merch')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                tab === 'merch' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Merch
            </button>
          </div>
        </div>

        {/* Bots */}
        {tab === 'bots' && (
          <>
            <div className="card bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 mb-10 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold">Important Notice</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Funded bots are currently in development. All backtested returns are historical and not indicative of future performance.
                Past performance does not guarantee future results. Investing involves risk of loss.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {bots.map((bot) => (
                <div key={bot.id} className="card relative overflow-hidden group hover:shadow-xl transition-all">
                  {/* Accent top bar */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: bot.color }} />

                  <div className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bot.color + '20' }}>
                        <Zap className="w-5 h-5" style={{ color: bot.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold">{bot.name}</h3>
                        <span className="text-xs text-muted-foreground">{bot.instrument} · {bot.strategy}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">{bot.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-400">{bot.backtestedReturn}</div>
                        <div className="text-xs text-muted-foreground">Backtested Return</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-lg font-bold">{bot.sharpe}</div>
                        <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground mb-6">
                      <span>Min: <strong className="text-foreground">${bot.minInvestment}</strong></span>
                      <span>Lock: <strong className="text-foreground">{bot.lockPeriod}</strong></span>
                    </div>

                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-semibold bg-muted text-muted-foreground cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" /> Coming Soon
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Merch */}
        {tab === 'merch' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {merch.map((item) => (
              <div key={item.id} className="card group hover:shadow-xl transition-all">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <h3 className="font-bold mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
                  <button
                    disabled
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notify CTA */}
        <div className="mt-16 text-center card py-10">
          <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Get Notified When We Launch</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Be the first to know when funded bots go live and new merch drops.
          </p>
          <Link href="/blog" className="btn-primary px-8 py-3 inline-block">
            Subscribe to Newsletter
          </Link>
        </div>
      </div>
    </div>
  );
}
