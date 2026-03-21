'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data for demonstration
const mockPosts = [
  {
    id: 1,
    title: 'Market Outlook: Fed Policy and Inflation Trends',
    excerpt:
      'Analysis of recent Federal Reserve policy decisions and their potential impact on market sectors.',
    category: 'Weekly Market Report',
    author: 'Jane Smith',
    date: 'June 12, 2023',
    readTime: '8 min read',
    isPremium: false,
    image: '/images/placeholder.jpg',
  },
  {
    id: 2,
    title: 'Sector Rotation: Technology to Value Stocks',
    excerpt:
      'Examining the ongoing shift from growth-oriented technology stocks to value investments.',
    category: 'Supplementary Data',
    author: 'John Doe',
    date: 'June 5, 2023',
    readTime: '6 min read',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 3,
    title: 'Crypto Market Analysis: Bitcoin Halving Cycle',
    excerpt:
      'Historical analysis of Bitcoin price action around halving events and projections for the next cycle.',
    category: 'Other',
    author: 'Alex Johnson',
    date: 'May 28, 2023',
    readTime: '10 min read',
    isPremium: false,
    image: '/images/placeholder.jpg',
  },
  {
    id: 4,
    title: 'Emerging Markets: Opportunities and Risks',
    excerpt:
      'A deep dive into emerging market economies and the potential investment opportunities they present.',
    category: 'Weekly Market Report',
    author: 'Sarah Williams',
    date: 'May 21, 2023',
    readTime: '7 min read',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
  {
    id: 5,
    title: 'ESG Investing: Impact on Portfolio Performance',
    excerpt:
      'Analyzing how environmental, social, and governance factors affect long-term investment returns.',
    category: 'Supplementary Data',
    author: 'Michael Brown',
    date: 'May 14, 2023',
    readTime: '9 min read',
    isPremium: false,
    image: '/images/placeholder.jpg',
  },
  {
    id: 6,
    title: 'Technical Analysis: Key Indicators for Market Timing',
    excerpt:
      'Exploring the most reliable technical indicators for timing market entries and exits.',
    category: 'Other',
    author: 'Lisa Chen',
    date: 'May 7, 2023',
    readTime: '11 min read',
    isPremium: true,
    image: '/images/placeholder.jpg',
  },
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on category and search query
  const filteredPosts = mockPosts.filter((post) => {
    const matchesCategory = activeCategory === 'all' || post.category.toLowerCase().replace(/\s+/g, '-') === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Quant (h)Edge Blog</h1>
          <p className="text-xl text-grey max-w-3xl mx-auto">
            Insights, analysis, and market research from our team of financial experts
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 space-y-4 md:space-y-0">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveCategory('all')}
              className={`pb-2 border-b-2 ${
                activeCategory === 'all'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setActiveCategory('weekly-market-report')}
              className={`pb-2 border-b-2 ${
                activeCategory === 'weekly-market-report'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground'
              }`}
            >
              Weekly Market Report
            </button>
            <button
              onClick={() => setActiveCategory('supplementary-data')}
              className={`pb-2 border-b-2 ${
                activeCategory === 'supplementary-data'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground'
              }`}
            >
              Supplementary Data
            </button>
            <button
              onClick={() => setActiveCategory('other')}
              className={`pb-2 border-b-2 ${
                activeCategory === 'other'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground'
              }`}
            >
              Other
            </button>
          </div>
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
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

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <div key={post.id} className="card hover:border-blue/40 transition-colors">
                <div className="relative h-48 mb-4 rounded-md overflow-hidden">
                  <div className="absolute inset-0 bg-darkBlue/50 flex items-center justify-center">
                    <p className="text-foreground text-lg font-medium">Image Placeholder</p>
                  </div>
                  {post.isPremium && (
                    <div className="absolute top-4 right-4 bg-blue/90 text-background text-xs font-bold px-2 py-1 rounded">
                      PREMIUM
                    </div>
                  )}
                </div>
                <div className="mb-2 text-sm text-blue">{post.category}</div>
                <h2 className="text-xl font-semibold mb-3">
                  <Link href={`/blog/post/${post.id}`} className="hover:text-blue transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-grey mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-blue/10">
                  <div className="text-sm text-grey">
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link
                    href={`/blog/post/${post.id}`}
                    className="text-blue hover:text-lightBlue transition-colors"
                  >
                    Read More →
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
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-grey">
              {searchQuery
                ? `No posts matching "${searchQuery}"`
                : 'No posts in this category yet'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-12">
          <nav className="flex items-center space-x-2">
            <button className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 rounded-md bg-blue text-background">1</button>
            <button className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors">
              2
            </button>
            <button className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors">
              3
            </button>
            <span className="text-grey">...</span>
            <button className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors">
              10
            </button>
            <button className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors">
              Next
            </button>
          </nav>
        </div>

        {/* Newsletter */}
        <div className="mt-20 card bg-gradient-to-r from-darkBlue to-background">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-grey mb-6">
              Get the latest market insights and analysis delivered straight to your inbox
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="input flex-grow"
                required
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 