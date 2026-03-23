'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';

// Mock data for demonstration
const mockModels = [
  {
    id: 100,
    title: 'Crypto Breadth',
    description: 'Tracks the percentage of cryptocurrencies trading above their 50, 100, and 200-day moving averages.',
    category: 'market-indicators',
    dataSource: 'Coin price history',
    updateFrequency: 'Daily',
    isPremium: false,
    image: API_BASE + '/api/models/chart-thumbnail/crypto-breadth/',
    link: '/models/crypto-breadth',
  },
  {
    id: 101,
    title: 'Altcoin 100 Index',
    description: 'Market-cap weighted index of the top 100 altcoins (excluding BTC and stablecoins), rebalanced monthly.',
    category: 'market-indicators',
    dataSource: 'CoinMarketCap',
    updateFrequency: 'Hourly',
    isPremium: true,
    image: API_BASE + '/api/models/chart-thumbnail/altcoin-index/',
    link: '/models/altcoin-index',
  },
  {
    id: 102,
    title: 'BTC Dominance & Global Metrics',
    description: 'Track Bitcoin dominance, total market cap, and global crypto market metrics over time.',
    category: 'market-indicators',
    dataSource: 'CoinMarketCap',
    updateFrequency: 'Hourly',
    isPremium: true,
    image: API_BASE + '/api/models/chart-thumbnail/global-metrics/',
    link: '/models/global-metrics',
  },
  {
    id: 1,
    title: 'Market Sentiment Indicator',
    description: 'Real-time market sentiment analysis based on social media, news, and technical indicators.',
    category: 'market-indicators',
    dataSource: 'Twitter API, News APIs, Yahoo Finance',
    updateFrequency: 'Daily',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 2,
    title: 'Sector Rotation Model',
    description: 'Identifies which market sectors are likely to outperform based on economic cycle analysis.',
    category: 'market-indicators',
    dataSource: 'Yahoo Finance, Federal Reserve Economic Data',
    updateFrequency: 'Weekly',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 3,
    title: 'Crypto Market Correlation Matrix',
    description: 'Real-time correlation analysis between major cryptocurrencies and traditional assets.',
    category: 'asset-correlations',
    dataSource: 'CoinMarketCap, Yahoo Finance',
    updateFrequency: 'Hourly',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 4,
    title: 'Volatility Forecast Model',
    description: 'Predicts market volatility using GARCH models and option-implied volatility.',
    category: 'market-indicators',
    dataSource: 'Yahoo Finance, CBOE VIX Data',
    updateFrequency: 'Daily',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 5,
    title: 'Global Macro Dashboard',
    description: 'Comprehensive view of global economic indicators and their impact on financial markets.',
    category: 'market-indicators',
    dataSource: 'World Bank, IMF, Federal Reserve',
    updateFrequency: 'Monthly',
    isPremium: false,
    image: '/images/placeholder.jpg',
  },
  {
    id: 6,
    title: 'Stock-Bond Correlation Tracker',
    description: 'Monitors the changing relationship between stocks and bonds for portfolio allocation decisions.',
    category: 'asset-correlations',
    dataSource: 'Yahoo Finance, Federal Reserve',
    updateFrequency: 'Daily',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 7,
    title: 'Social Media Sentiment Analysis',
    description: 'Analyzes sentiment from Reddit, Twitter, and other platforms for major assets and indices.',
    category: 'sentiment-analysis',
    dataSource: 'Reddit API, Twitter API',
    updateFrequency: 'Daily',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 8,
    title: 'Economic Surprise Index',
    description: 'Tracks how economic data is performing relative to economist expectations.',
    category: 'market-indicators',
    dataSource: 'Bloomberg, Economic Calendars',
    updateFrequency: 'Weekly',
    isPremium: false,
    image: '/images/placeholder.jpg',
  },
];

export default function Models() {
  const { user } = useAppSelector((state) => state.auth);
  const isPaidUser = user?.is_premium || false;
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeCard, setShowUpgradeCard] = useState(true);

  // Filter models based on category and search query
  const filteredModels = mockModels.filter((model) => {
    const matchesCategory = activeCategory === 'all' || model.category === activeCategory;
    const matchesSearch = model.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          model.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Real-time Financial Models</h1>
          <p className="text-xl text-grey max-w-3xl mx-auto">
            Access our suite of real-time financial models powered by data from Yahoo Finance, Alpha Vantage, and CoinMarketCap
          </p>
        </div>

        {/* Premium Banner (if not a paid user) */}
        {!isPaidUser && showUpgradeCard && (
          <div className="card bg-gradient-to-r from-blue/20 to-purple/20 border-blue/30 mb-12 relative">
            <button
              aria-label="Dismiss upgrade card"
              onClick={() => setShowUpgradeCard(false)}
              className="absolute top-2 right-4 bg-transparent border-none text-2xl cursor-pointer"
              type="button"
            >
              &times;
            </button>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-6">
                <h2 className="text-2xl font-bold mb-2">Upgrade to Access Premium Models</h2>
                <p className="text-grey">
                  Most of our real-time models are available exclusively to premium subscribers. Upgrade today to unlock the full power of our quantitative analysis.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link href="/pricing" className="btn-primary whitespace-nowrap">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'all'
                  ? 'bg-[#00ced1] text-[#061829] font-semibold shadow-md'
                  : 'bg-[#0e2239] text-gray-400 border border-[#18324f] hover:bg-[#18324f] hover:text-white'
              } transition-colors`}
            >
              All Models
            </button>
            <button
              onClick={() => setActiveCategory('market-indicators')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'market-indicators'
                  ? 'bg-[#00ced1] text-[#061829] font-semibold shadow-md'
                  : 'bg-[#0e2239] text-gray-400 border border-[#18324f] hover:bg-[#18324f] hover:text-white'
              } transition-colors`}
            >
              Market Indicators
            </button>
            <button
              onClick={() => setActiveCategory('asset-correlations')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'asset-correlations'
                  ? 'bg-[#00ced1] text-[#061829] font-semibold shadow-md'
                  : 'bg-[#0e2239] text-gray-400 border border-[#18324f] hover:bg-[#18324f] hover:text-white'
              } transition-colors`}
            >
              Asset Correlations
            </button>
            <button
              onClick={() => setActiveCategory('sentiment-analysis')}
              className={`px-4 py-2 rounded-md ${
                activeCategory === 'sentiment-analysis'
                  ? 'bg-[#00ced1] text-[#061829] font-semibold shadow-md'
                  : 'bg-[#0e2239] text-gray-400 border border-[#18324f] hover:bg-[#18324f] hover:text-white'
              } transition-colors`}
            >
              Sentiment Analysis
            </button>
          </div>
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
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

        {/* Models Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredModels.map((model) => (
              <Link
                key={model.id}
                href={model.isPremium && !isPaidUser ? '/pricing' : (model.link || `/models/${model.id}`)}
                className="card hover:border-[#00ced1]/50 hover:shadow-lg hover:shadow-[#00ced1]/10 transition-all duration-200 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00ced1] group"
                tabIndex={0}
                aria-label={`View ${model.title}`}
              >
                <div className="relative h-48 mb-4 rounded-md overflow-hidden bg-[#061829]">
                  {model.image && !model.image.includes('placeholder') ? (
                    <img
                      src={model.image}
                      alt={model.title}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0e2239] to-[#061829]">
                      <svg className="w-16 h-16 text-[#00ced1]/30 group-hover:text-[#00ced1]/50 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-3">
                  {model.title}
                </h2>
                <p className="text-grey mb-4 line-clamp-2">{model.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-grey">Data Source:</span>
                    <span className="text-sm text-right">{model.dataSource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-grey">Updates:</span>
                    <span className="text-sm text-right">{model.updateFrequency}</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-[#18324f]">
                  {model.isPremium && !isPaidUser ? (
                    <div className="flex justify-center items-center gap-2 py-2 text-grey">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6-2V9a6 6 0 10-12 0v6a2 2 0 002 2h8a2 2 0 002-2z" />
                      </svg>
                      <span className="text-sm font-medium">Premium</span>
                    </div>
                  ) : (
                    <span className="block w-full text-center py-2 text-[#00ced1] group-hover:text-white font-semibold text-sm transition-colors">
                      View Model &rarr;
                    </span>
                  )}
                </div>
              </Link>
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
            <h3 className="text-xl font-semibold mb-2">No models found</h3>
            <p className="text-grey">
              {searchQuery
                ? `No models matching "${searchQuery}"`
                : 'No models in this category yet'}
            </p>
          </div>
        )}

        {/* Data Sources Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-blue/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Yahoo Finance</h3>
              <p className="text-grey">
                Comprehensive market data including stocks, ETFs, indices, and historical price information for robust financial analysis.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Alpha Vantage</h3>
              <p className="text-grey">
                Real-time and historical financial data including technical indicators, forex, and economic data for advanced modeling.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-purple/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-purple"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">CoinMarketCap</h3>
              <p className="text-grey">
                Comprehensive cryptocurrency data including prices, market caps, trading volumes, and historical metrics for crypto analysis.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">How often are the models updated?</h3>
              <p className="text-grey">
                Update frequency varies by model. Some models update in real-time or hourly, while others update daily or weekly. The update frequency is listed on each model's card.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">Can I export data from the models?</h3>
              <p className="text-grey">
                Yes, premium subscribers can export data from most models in CSV or Excel format. This feature allows you to perform your own analysis or integrate our data into your workflows.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">How are the models developed and validated?</h3>
              <p className="text-grey">
                Our models are developed by our team of quantitative analysts and data scientists. Each model undergoes rigorous backtesting and validation before being made available. We continuously monitor and refine our models to ensure accuracy.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">Can I request a custom model?</h3>
              <p className="text-grey">
                Yes, premium subscribers can request custom models tailored to specific assets or strategies. Please contact our team to discuss your requirements and we'll evaluate the feasibility of developing a custom solution.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        
      </div>
    </div>
  );
} 