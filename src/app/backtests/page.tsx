'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data for demonstration
const mockBacktests = [
  {
    id: 1,
    title: 'Moving Average Crossover Strategy',
    description: 'A trend-following strategy using 50-day and 200-day moving averages to identify entry and exit points.',
    category: 'stocks',
    assetClass: 'Equities',
    annualReturn: 12.4,
    maxDrawdown: -18.2,
    sharpeRatio: 0.87,
    winRate: 62,
    timeframe: '2010-2023',
    image: '/images/placeholder.jpg',
  },
  {
    id: 2,
    title: 'Bitcoin Momentum Strategy',
    description: 'A momentum-based strategy for Bitcoin trading using RSI and volume indicators.',
    category: 'crypto',
    assetClass: 'Cryptocurrencies',
    annualReturn: 28.6,
    maxDrawdown: -42.5,
    sharpeRatio: 0.92,
    winRate: 58,
    timeframe: '2017-2023',
    image: '/images/placeholder.jpg',
  },
  {
    id: 3,
    title: 'Mean Reversion Pairs Trading',
    description: 'A statistical arbitrage strategy that identifies pairs of correlated stocks and trades their spread.',
    category: 'stocks',
    assetClass: 'Equities',
    annualReturn: 9.8,
    maxDrawdown: -12.3,
    sharpeRatio: 1.05,
    winRate: 71,
    timeframe: '2015-2023',
    image: '/images/placeholder.jpg',
  },
  {
    id: 4,
    title: 'Forex Trend Following System',
    description: 'A multi-currency trend following system using ADX and Parabolic SAR indicators.',
    category: 'forex',
    assetClass: 'Currencies',
    annualReturn: 15.2,
    maxDrawdown: -22.7,
    sharpeRatio: 0.78,
    winRate: 54,
    timeframe: '2012-2023',
    image: '/images/placeholder.jpg',
  },
  {
    id: 5,
    title: 'Ethereum Volatility Breakout',
    description: 'A volatility-based breakout strategy for Ethereum trading using Bollinger Bands.',
    category: 'crypto',
    assetClass: 'Cryptocurrencies',
    annualReturn: 32.1,
    maxDrawdown: -48.6,
    sharpeRatio: 0.84,
    winRate: 52,
    timeframe: '2018-2023',
    image: '/images/placeholder.jpg',
  },
  {
    id: 6,
    title: 'Value Factor Portfolio',
    description: 'A systematic portfolio strategy selecting stocks based on value factors like P/E, P/B, and dividend yield.',
    category: 'stocks',
    assetClass: 'Equities',
    annualReturn: 11.3,
    maxDrawdown: -20.5,
    sharpeRatio: 0.92,
    winRate: 65,
    timeframe: '2008-2023',
    image: '/images/placeholder.jpg',
  },
];

export default function Backtests() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('annualReturn');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter backtests based on category and search query
  const filteredBacktests = mockBacktests.filter((backtest) => {
    const matchesCategory = activeCategory === 'all' || backtest.category === activeCategory;
    const matchesSearch = backtest.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          backtest.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort backtests based on selected criteria
  const sortedBacktests = [...filteredBacktests].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const handleSort = (criteria: string) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Backtest Results</h1>
          <p className="text-xl text-grey max-w-3xl mx-auto">
            Explore our collection of backtested trading strategies across different asset classes
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'all'
                  ? 'bg-blue text-background'
                  : 'bg-darkBlue/30 text-grey hover:bg-darkBlue/50 hover:text-foreground'
              } transition-colors`}
            >
              All Strategies
            </button>
            <button
              onClick={() => setActiveCategory('stocks')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'stocks'
                  ? 'bg-blue text-background'
                  : 'bg-darkBlue/30 text-grey hover:bg-darkBlue/50 hover:text-foreground'
              } transition-colors`}
            >
              Stocks
            </button>
            <button
              onClick={() => setActiveCategory('crypto')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'crypto'
                  ? 'bg-blue text-background'
                  : 'bg-darkBlue/30 text-grey hover:bg-darkBlue/50 hover:text-foreground'
              } transition-colors`}
            >
              Crypto
            </button>
            <button
              onClick={() => setActiveCategory('forex')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'forex'
                  ? 'bg-blue text-background'
                  : 'bg-darkBlue/30 text-grey hover:bg-darkBlue/50 hover:text-foreground'
              } transition-colors`}
            >
              Forex
            </button>
          </div>
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strategies..."
                className="input pl-10 w-full md:w-64"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-grey"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-grey">Sort by:</span>
          <button
            onClick={() => handleSort('annualReturn')}
            className={`text-sm px-3 py-1 rounded-md ${
              sortBy === 'annualReturn'
                ? 'bg-blue/20 text-blue'
                : 'text-grey hover:text-foreground'
            }`}
          >
            Annual Return
            {sortBy === 'annualReturn' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('sharpeRatio')}
            className={`text-sm px-3 py-1 rounded-md ${
              sortBy === 'sharpeRatio'
                ? 'bg-blue/20 text-blue'
                : 'text-grey hover:text-foreground'
            }`}
          >
            Sharpe Ratio
            {sortBy === 'sharpeRatio' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('maxDrawdown')}
            className={`text-sm px-3 py-1 rounded-md ${
              sortBy === 'maxDrawdown'
                ? 'bg-blue/20 text-blue'
                : 'text-grey hover:text-foreground'
            }`}
          >
            Max Drawdown
            {sortBy === 'maxDrawdown' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('winRate')}
            className={`text-sm px-3 py-1 rounded-md ${
              sortBy === 'winRate'
                ? 'bg-blue/20 text-blue'
                : 'text-grey hover:text-foreground'
            }`}
          >
            Win Rate
            {sortBy === 'winRate' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        </div>

        {/* Backtest Cards */}
        {sortedBacktests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {sortedBacktests.map((backtest) => (
              <div key={backtest.id} className="card hover:border-blue/40 transition-colors">
                <div className="relative h-48 mb-4 rounded-md overflow-hidden">
                  <div className="absolute inset-0 bg-darkBlue/50 flex items-center justify-center">
                    <p className="text-foreground text-lg font-medium">Strategy Chart</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-blue/90 text-background text-xs font-bold px-2 py-1 rounded">
                    {backtest.category.toUpperCase()}
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-3">
                  <Link
                    href={`/backtests/${backtest.id}`}
                    className="hover:text-blue transition-colors"
                  >
                    {backtest.title}
                  </Link>
                </h2>
                <p className="text-grey mb-4 line-clamp-2">{backtest.description}</p>
                
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-grey mb-1">Annual Return</div>
                    <div className={`font-semibold ${backtest.annualReturn > 0 ? 'text-green' : 'text-red'}`}>
                      {backtest.annualReturn > 0 ? '+' : ''}{backtest.annualReturn.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-grey mb-1">Max Drawdown</div>
                    <div className="font-semibold text-red">
                      {backtest.maxDrawdown.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-grey mb-1">Sharpe Ratio</div>
                    <div className="font-semibold">{backtest.sharpeRatio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-grey mb-1">Win Rate</div>
                    <div className="font-semibold">{backtest.winRate}%</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-blue/10">
                  <div className="text-sm text-grey">{backtest.timeframe}</div>
                  <Link
                    href={`/backtests/${backtest.id}`}
                    className="text-blue hover:text-lightBlue transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-grey mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No strategies found</h3>
            <p className="text-grey">
              {searchQuery
                ? `No strategies matching "${searchQuery}"`
                : 'No strategies in this category yet'}
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="card bg-gradient-to-r from-darkBlue to-background">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Want Access to Premium Strategies?</h2>
            <p className="text-grey mb-6">
              Upgrade to a paid plan to access our full library of advanced backtested strategies and real-time models
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/pricing" className="btn-primary">
                View Pricing
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border border-blue text-blue hover:bg-blue/10 transition-colors px-4 py-2 rounded-md"
              >
                Request Custom Backtest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 