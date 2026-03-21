'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

// Mock data for demonstration
const mockPosts = [
  {
    id: '1',
    title: 'Market Outlook: Fed Policy and Inflation Trends',
    content: `
      <h2>Introduction</h2>
      <p>The Federal Reserve's monetary policy decisions have far-reaching implications for financial markets and the broader economy. In this analysis, we examine recent Fed policy shifts and their potential impact on various market sectors.</p>
      
      <h2>Current Fed Policy Stance</h2>
      <p>The Federal Reserve has maintained a hawkish stance in response to persistent inflation pressures. Despite signs of economic slowdown, the Fed has signaled its commitment to bringing inflation back to its 2% target, even at the cost of short-term economic pain.</p>
      
      <p>Key points from recent FOMC meetings:</p>
      <ul>
        <li>Interest rates have been raised to their highest level in over a decade</li>
        <li>The Fed has begun quantitative tightening, reducing its balance sheet</li>
        <li>Forward guidance suggests rates will remain "higher for longer"</li>
        <li>Inflation remains the primary concern, despite softening economic data</li>
      </ul>
      
      <h2>Inflation Trends</h2>
      <p>While headline inflation has moderated from its peak, core inflation remains sticky. Housing costs, services inflation, and wage growth continue to run hot, complicating the Fed's task.</p>
      
      <p>Our analysis suggests that inflation will gradually moderate over the next 12-18 months, but the path will not be linear. Supply chain improvements and commodity price stabilization will help, but structural factors like labor market tightness and deglobalization trends may keep inflation above pre-pandemic norms.</p>
      
      <h2>Market Implications</h2>
      <p>The "higher for longer" interest rate environment has several implications for investors:</p>
      
      <h3>Fixed Income</h3>
      <p>Bond markets have already priced in significant Fed tightening, creating attractive opportunities in short and intermediate-term high-quality bonds. We recommend:</p>
      <ul>
        <li>Increasing duration as we approach the end of the hiking cycle</li>
        <li>Focusing on investment-grade corporate bonds and Treasury securities</li>
        <li>Maintaining some floating-rate exposure as a hedge</li>
      </ul>
      
      <h3>Equities</h3>
      <p>Higher interest rates typically pressure equity valuations, particularly for growth stocks with cash flows weighted to the distant future. Sectors with the following characteristics may outperform:</p>
      <ul>
        <li>Strong current cash flows</li>
        <li>Pricing power to pass through inflation</li>
        <li>Low leverage and healthy balance sheets</li>
        <li>Defensive characteristics in a slowing economy</li>
      </ul>
      
      <h3>Real Assets</h3>
      <p>Real assets can provide portfolio diversification and inflation protection. We favor:</p>
      <ul>
        <li>Infrastructure investments with inflation-linked revenue streams</li>
        <li>Select REITs in sectors with strong fundamentals</li>
        <li>Commodities as a tactical allocation</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>The Fed's fight against inflation is likely to continue dominating market dynamics in the near term. Investors should position for volatility while seeking opportunities created by market dislocations. A balanced approach with quality assets across fixed income, equities, and real assets remains prudent in this challenging environment.</p>
    `,
    category: 'Weekly Market Report',
    author: {
      name: 'Jane Smith',
      title: 'Chief Market Strategist',
      image: '/images/placeholder-author.jpg',
    },
    date: 'June 12, 2023',
    readTime: '8 min read',
    isPremium: false,
    image: '/images/placeholder.jpg',
    tags: ['Federal Reserve', 'Inflation', 'Monetary Policy', 'Market Outlook'],
  },
  {
    id: '2',
    title: 'Sector Rotation: Technology to Value Stocks',
    content: `
      <h2>Introduction</h2>
      <p>The market has been experiencing a significant rotation from high-growth technology stocks to value-oriented sectors. This analysis examines the drivers behind this shift and its implications for portfolio positioning.</p>
      
      <h2>The Growth-to-Value Rotation</h2>
      <p>After years of technology dominance, we're witnessing a meaningful rotation toward value stocks. This shift is being driven by several factors:</p>
      <ul>
        <li>Rising interest rates, which disproportionately impact high-multiple growth stocks</li>
        <li>Elevated inflation, benefiting companies with current cash flows and pricing power</li>
        <li>Economic reopening, supporting cyclical sectors that lagged during the pandemic</li>
        <li>Attractive relative valuations after years of growth outperformance</li>
      </ul>
      
      <h2>Sector Analysis</h2>
      
      <h3>Technology</h3>
      <p>The technology sector faces several headwinds:</p>
      <ul>
        <li>Higher discount rates pressuring valuations</li>
        <li>Slowing growth after pandemic-era acceleration</li>
        <li>Increasing regulatory scrutiny</li>
        <li>Margin pressure from rising input costs and wages</li>
      </ul>
      <p>However, the selloff has created opportunities in high-quality tech companies with reasonable valuations, strong cash flows, and dominant market positions.</p>
      
      <h3>Value Sectors</h3>
      <p>Several traditional value sectors offer compelling opportunities:</p>
      
      <h4>Financials</h4>
      <p>Banks and financial services firms benefit from rising interest rates through expanded net interest margins. Strong balance sheets, increased dividends, and share repurchases provide additional support.</p>
      
      <h4>Energy</h4>
      <p>Energy companies are generating substantial free cash flow at current commodity prices. The sector offers attractive dividends and benefits from improved capital discipline compared to previous cycles.</p>
      
      <h4>Healthcare</h4>
      <p>Healthcare combines defensive characteristics with reasonable valuations. Pharmaceutical and medical device companies with strong innovation pipelines are particularly attractive.</p>
      
      <h2>Portfolio Implications</h2>
      <p>Investors should consider the following adjustments to their equity allocations:</p>
      <ul>
        <li>Reduce exposure to high-multiple growth stocks without clear paths to profitability</li>
        <li>Increase allocations to quality value sectors with strong cash flows and dividend yields</li>
        <li>Maintain some exposure to high-quality technology leaders that have sold off to reasonable valuations</li>
        <li>Consider small and mid-cap value stocks, which may offer greater upside in this rotation</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>While we don't advocate completely abandoning growth stocks, a strategic shift toward value appears warranted in the current environment. The rotation may not proceed in a straight line, but the fundamental drivers supporting value outperformance are likely to persist as long as inflation remains elevated and interest rates continue rising.</p>
      
      <p>Investors should focus on companies with strong current cash flows, reasonable valuations, and the ability to thrive in an environment of higher inflation and interest rates.</p>
    `,
    category: 'Supplementary Data',
    author: {
      name: 'John Doe',
      title: 'Senior Equity Analyst',
      image: '/images/placeholder-author.jpg',
    },
    date: 'June 5, 2023',
    readTime: '6 min read',
    isPremium: true,
    image: '/images/placeholder.jpg',
    tags: ['Sector Rotation', 'Technology', 'Value Stocks', 'Equity Markets'],
  },
];

export default function BlogPost() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    // In a real app, you would fetch the post from an API
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const foundPost = mockPosts.find((p) => p.id === params.id);
        setPost(foundPost || null);
        
        // Check if post is premium and user is not paid
        if (foundPost?.isPremium && !isPaidUser) {
          setShowPaywall(true);
        } else {
          setShowPaywall(false);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id, isPaidUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-grey mx-auto mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-grey text-xl mb-8">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog" className="btn-primary">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <nav className="flex text-sm text-grey">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/blog/${post.category.toLowerCase().replace(/\s+/g, '-')}`}
              className="hover:text-foreground transition-colors"
            >
              {post.category}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{post.title}</span>
          </nav>
        </div>

        {/* Post Header */}
        <div className="mb-8">
          <div className="text-blue text-sm mb-2">{post.category}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-darkBlue/50 flex items-center justify-center mr-3">
                <span className="text-foreground font-medium">
                  {post.author.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium">{post.author.name}</div>
                <div className="text-sm text-grey">{post.author.title}</div>
              </div>
            </div>
            <div className="text-sm text-grey">
              <span>{post.date}</span>
              <span className="mx-2">•</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-darkBlue/50 flex items-center justify-center">
            <p className="text-foreground text-xl font-medium">Featured Image Placeholder</p>
          </div>
          {post.isPremium && (
            <div className="absolute top-4 right-4 bg-blue/90 text-background text-xs font-bold px-2 py-1 rounded">
              PREMIUM
            </div>
          )}
        </div>

        {/* Post Content */}
        {showPaywall ? (
          <div className="card bg-darkBlue/30 border-blue/30 text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-blue mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
            <p className="text-grey max-w-md mx-auto mb-6">
              This article is available exclusively to paid subscribers. Upgrade your account to
              continue reading.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/pricing" className="btn-primary">
                View Pricing
              </Link>
              <Link
                href="/login"
                className="bg-transparent border border-blue text-blue hover:bg-blue/10 transition-colors px-4 py-2 rounded-md"
              >
                Log In
              </Link>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-blue max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        )}

        {/* Tags */}
        {!showPaywall && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-darkBlue/30 hover:bg-darkBlue/50 transition-colors text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        {!showPaywall && (
          <div className="card mb-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-darkBlue/50 flex items-center justify-center flex-shrink-0">
                <span className="text-foreground text-3xl font-medium">
                  {post.author.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{post.author.name}</h3>
                <p className="text-grey mb-4">{post.author.title}</p>
                <p className="text-grey">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockPosts
              .filter((p) => p.id !== post.id)
              .slice(0, 2)
              .map((relatedPost) => (
                <div key={relatedPost.id} className="card hover:border-blue/40 transition-colors">
                  <div className="relative h-40 mb-4 rounded-md overflow-hidden">
                    <div className="absolute inset-0 bg-darkBlue/50 flex items-center justify-center">
                      <p className="text-foreground text-lg font-medium">Image Placeholder</p>
                    </div>
                    {relatedPost.isPremium && (
                      <div className="absolute top-4 right-4 bg-blue/90 text-background text-xs font-bold px-2 py-1 rounded">
                        PREMIUM
                      </div>
                    )}
                  </div>
                  <div className="mb-2 text-sm text-blue">{relatedPost.category}</div>
                  <h3 className="text-lg font-semibold mb-3">
                    <Link
                      href={`/blog/post/${relatedPost.id}`}
                      className="hover:text-blue transition-colors"
                    >
                      {relatedPost.title}
                    </Link>
                  </h3>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-blue/10">
                    <div className="text-sm text-grey">
                      <span>{relatedPost.date}</span>
                    </div>
                    <Link
                      href={`/blog/post/${relatedPost.id}`}
                      className="text-blue hover:text-lightBlue transition-colors"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="card bg-gradient-to-r from-darkBlue to-background">
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