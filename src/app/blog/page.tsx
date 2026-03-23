'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, Bookmark, Search, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface Profile {
  image: string;
  bio: string;
}

interface User {
  username: string;
  full_name: string;
}

interface Post {
  id: number;
  title: string;
  excerpt: string;
  description: string;
  image: string;
  image_url: string;
  thumbnail: string;
  status: 'Draft' | 'Published' | 'Disabled';
  view: number;
  reading_time: number;
  slug: string;
  date: string;
  tags: string;
  is_premium: boolean;
  publishing_method: 'web' | 'email' | 'both';
  email_sent: boolean;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_pinned: boolean;
  user: User;
  profile: Profile;
  category?: { id: number; title: string; slug: string; };
}

interface Category {
  id: number;
  title: string;
  slug: string;
  image?: string;
  post_count?: number;
}

interface BlogApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}

export default function Blog() {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsPremium(user.is_premium || false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsPremium(false);
      }
    }
    // Check if already subscribed to newsletter
    const subscribed = localStorage.getItem('newsletter_subscribed');
    if (subscribed) {
      setHasSubscribed(true);
      setShowNewsletter(false);
    } else {
      setShowNewsletter(true);
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(API_BASE + '/api/categories/', {
          headers,
          mode: 'cors',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch categories: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load newsletter filters. Please try again.');
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        if (activeCategory !== 'all') {
          params.append('category', activeCategory);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        console.log('Fetching posts from:', `${API_BASE}/api/posts/?${params.toString()}`);
        
        const response = await fetch(`${API_BASE}/api/posts/?${params.toString()}`, {
          headers,
          mode: 'cors', 
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch posts: ${response.status} ${errorText}`);
        }

        const data: BlogApiResponse = await response.json();
        console.log('Posts data:', data);
        setPosts(data.results || []);
        setTotalPages(Math.ceil((data.count || 0) / 10));
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts. Please try again.');
        setPosts([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [activeCategory, searchQuery, currentPage]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    try {
      setIsSubscribing(true);
      const response = await fetch(API_BASE + '/api/newsletter/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 200) {
        // Treat "already exists" as success
        if (data?.email?.[0]?.toLowerCase().includes('already exists')) {
          toast.success("You're already subscribed!");
        } else {
          throw new Error(data?.email?.[0] || data?.message || 'Failed to subscribe');
        }
      } else {
        toast.success(data.message || 'Successfully subscribed to the newsletter!');
      }
      setEmail('');
      setHasSubscribed(true);
      localStorage.setItem('newsletter_subscribed', 'true');
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleLike = async (slug: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to like posts');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${slug}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      setPosts(posts.map(post => {
        if (post.slug === slug) {
          return {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like. Please try again.');
    }
  };

  const handleBookmark = async (slug: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to bookmark posts');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${slug}/bookmark/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      setPosts(posts.map(post => {
        if (post.slug === slug) {
          return {
            ...post,
            is_bookmarked: !post.is_bookmarked,
            bookmarks_count: post.is_bookmarked ? post.bookmarks_count - 1 : post.bookmarks_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark. Please try again.');
    }
  };

  const handlePostClick = async (e: React.MouseEvent, post: Post) => {
    if (post.is_premium) {
      e.preventDefault();
      
      if (!isAuthenticated) {
        toast.error('Please log in to view premium content');
        router.push('/login');
        return;
      }
      
      if (!isPremium) {
        toast.error('This post is only available to premium members');
        router.push('/pricing');
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/posts/${post.slug}/`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 403) {
          if (!isAuthenticated) {
            toast.error('Please log in to view premium content');
            router.push('/login');
          } else {
            toast.error('This post is only available to premium members');
            router.push('/pricing');
          }
          return;
        }
        throw new Error('Failed to fetch post');
      }

      router.push(`/blog/${post.slug}`);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post. Please try again.');
    }
  };


  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Quant (h)Edge Newsletters</h1>
          <p className="text-xl text-grey max-w-3xl mx-auto">
            Insights, analysis, and market research from our team of financial experts
          </p>
        </div>

        {/* Navigation Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 space-y-4 md:space-y-0">
          <nav className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-[#00ced1] to-[#00e3bc] text-[#061829] shadow-lg shadow-[#00ced1]/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-[#00ced1]/40'
              }`}
            >
              Home
            </button>

            {isLoadingCategories ? (
              <div className="flex items-center px-4">
                <div className="animate-spin h-4 w-4 border-t-2 border-[#00ced1] rounded-full"></div>
              </div>
            ) : (
              categories.map((category, i) => {
                const colors = ['#00FF9D', '#FF8C00', '#00ced1', '#b091cc', '#ba5533', '#46b389', '#cc91ad', '#adcc91'];
                const color = colors[i % colors.length];
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.slug)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                      activeCategory === category.slug
                        ? 'text-[#061829] font-semibold'
                        : 'text-foreground hover:text-foreground'
                    }`}
                    style={activeCategory === category.slug
                      ? { background: color, boxShadow: `0 4px 14px ${color}44, 0 1px 3px rgba(0,0,0,0.2)` }
                      : { background: `${color}15`, border: `1px solid ${color}40`, boxShadow: `0 1px 4px rgba(0,0,0,0.1)` }
                    }
                    onMouseEnter={(e) => { if (activeCategory !== category.slug) { (e.target as HTMLElement).style.background = color + '30'; (e.target as HTMLElement).style.borderColor = color + '80'; }}}
                    onMouseLeave={(e) => { if (activeCategory !== category.slug) { (e.target as HTMLElement).style.background = color + '15'; (e.target as HTMLElement).style.borderColor = color + '40'; }}}
                  >
                    {category.title}
                  </button>
                );
              })
            )}
          </nav>
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="input pl-10 w-full md:w-64"
              />
              <Search
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-grey"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue"></div>
          </div>
        ) : posts && posts.length > 0 ? (
          <>
            {/* Featured Posts Carousel - hide when searching */}
            {!searchQuery && (() => {
              const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const pinned = posts.filter(p => p.is_pinned);
              const featuredPosts = pinned.length >= 2 ? pinned.slice(0, 4) : sorted.slice(0, 4);
              if (featuredPosts.length === 0) return null;

              return (
                <div className="relative mb-12 group/carousel">
                  {/* Arrows */}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('featured-carousel');
                      if (el) el.scrollBy({ left: -(el.offsetWidth * 0.85), behavior: 'smooth' });
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#061829]/80 hover:bg-[#0e2239] border border-[#18324f] text-white rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity -ml-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('featured-carousel');
                      if (el) el.scrollBy({ left: el.offsetWidth * 0.85, behavior: 'smooth' });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#061829]/80 hover:bg-[#0e2239] border border-[#18324f] text-white rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity -mr-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>

                  <div id="featured-carousel" className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
                    {featuredPosts.map((fp) => {
                        // Only use image if it's a valid URL (not HTML content)
                        const imgSrc = [fp.image, fp.image_url, fp.thumbnail].find(
                          (src) => src && (src.startsWith('http') || src.startsWith('/'))
                        );
                        const colors = ['from-[#00ced1]/30 to-[#061829]', 'from-[#b091cc]/30 to-[#061829]', 'from-[#FF8C00]/30 to-[#061829]', 'from-[#00FF9D]/30 to-[#061829]'];
                        const accentColors = ['#00ced1', '#b091cc', '#FF8C00', '#00FF9D'];
                        const idx = featuredPosts.indexOf(fp);
                        return (
                          <Link
                            key={fp.id}
                            href={`/blog/${fp.slug}`}
                            onClick={(e) => handlePostClick(e, fp)}
                            className="flex-none w-full md:w-[calc(50%-12px)] snap-start rounded-xl overflow-hidden relative shadow-lg group/card min-h-[320px] md:min-h-[380px] border border-border/50 hover:border-primary/30 transition-all hover:shadow-xl"
                          >
                            {/* Background */}
                            {imgSrc ? (
                              <img src={imgSrc} alt={fp.title} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className={`absolute inset-0 bg-gradient-to-br ${colors[idx % colors.length]}`} />
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
                            {/* Premium badge */}
                            {fp.is_premium && !isPremium && (
                              <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1 z-10">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                PREMIUM
                              </div>
                            )}
                            {/* Date badge */}
                            <div className="absolute top-4 left-4 text-xs text-white/70 font-medium z-10">
                              {fp.date ? new Date(fp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                            </div>
                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                              <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: accentColors[idx % accentColors.length] }}>
                                {typeof fp.category === 'object' && fp.category ? (fp.category as any).title : (typeof fp.category === 'string' ? fp.category : 'Newsletter')}
                              </div>
                              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-lg leading-tight">
                                {fp.title}
                              </h2>
                              {fp.excerpt && (
                                <p className="text-sm md:text-base text-gray-300 line-clamp-2 mb-4">
                                  {fp.excerpt}
                                </p>
                              )}
                              <span className="inline-flex items-center font-semibold text-sm group-hover/card:gap-2 transition-all" style={{ color: accentColors[idx % accentColors.length] }}>
                                Read More
                                <svg className="w-4 h-4 ml-1 group-hover/card:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                              </span>
                            </div>
                          </Link>
                        );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* Posts Grid (excluding featured) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(() => {
                const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const pinned = posts.filter(p => p.is_pinned);
                const featuredIds = new Set((pinned.length >= 2 ? pinned.slice(0, 4) : sorted.slice(0, 4)).map(p => p.id));
                return posts.filter(post => !featuredIds.has(post.id));
              })()
                .map((post) => (
                <Link
  key={post.id}
  href={`/blog/${post.slug}`}
  className="card hover:border-blue/40 transition-colors flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue"
  tabIndex={0}
  aria-label={`View post: ${post.title}`}
  onClick={(e) => handlePostClick(e, post)}
>
  <div className="relative h-48 mb-4 rounded-md overflow-hidden bg-[#061829]">
    {(post.thumbnail || post.image || post.image_url) ? (
      <img
        src={post.thumbnail || post.image || post.image_url}
        alt={post.title}
        className="object-cover w-full h-full"
        loading="lazy"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-[#0e2239] to-[#061829] flex items-center justify-center">
        <svg className="w-12 h-12 text-[#00ced1]/20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
        </svg>
      </div>
    )}
    {post.is_premium && !isPremium && (
      <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        PREMIUM
      </div>
    )}
  </div>
  <div className="mb-2 text-sm text-blue">
    {post.category ? post.category.title : 
     (post.tags ? post.tags.split(',')[0] : 'Uncategorized')}
  </div>
  <h2 className="text-xl font-semibold mb-3">
    {post.title}
  </h2>
  <p className="text-grey mb-4 line-clamp-3">{post.excerpt}</p>
  <div className="flex justify-between items-center mt-auto pt-4 border-t border-blue/10">
    <div className="text-sm text-grey">
      <span>{new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}</span>
      {post.reading_time > 0 && (
        <><span className="mx-2">•</span><span>{post.reading_time} min read</span></>
      )}
      <span className="mx-2">•</span>
      <span>{post.view} views</span>
    </div>
    <div className="flex space-x-3">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLike(post.slug);
        }}
        className={`flex items-center ${post.is_liked ? 'text-red' : 'text-grey hover:text-red'}`}
        aria-label="Like post"
        tabIndex={0}
      >
        <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
        <span className="ml-1 text-xs">{post.likes_count}</span>
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleBookmark(post.slug);
        }}
        className={`flex items-center ${post.is_bookmarked ? 'text-blue' : 'text-grey hover:text-blue'}`}
        aria-label="Bookmark post"
        tabIndex={0}
      >
        <Bookmark className={`h-5 w-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
        <span className="ml-1 text-xs">{post.bookmarks_count}</span>
      </button>
      <button
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const shareUrl = `${window.location.origin}/blog/${post.slug}`;
          if (navigator.share) {
            try {
              await navigator.share({
                title: post.title,
                url: shareUrl,
              });
            } catch {}
          } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied!');
          }
        }}
        className="flex items-center text-grey hover:text-blue"
        aria-label={`Share post: ${post.title}`}
        title="Share"
        tabIndex={0}
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  </div>
</Link>

              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-md ${currentPage === pageNum ? 'bg-blue text-background' : 'bg-darkBlue/30 text-grey hover:bg-darkBlue/50'} transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md bg-darkBlue/30 text-grey hover:bg-darkBlue/50 transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-grey mb-4">No posts found</p>
            <p className="text-grey">
              {searchQuery ? (
                <>No posts match your search criteria. Try a different search term.</>
              ) : activeCategory !== 'all' ? (
                <>No posts found in this newsletter category. Check back later for updates.</>
              ) : (
                <>We haven't published any posts yet. Check back later for updates.</>
              )}
            </p>
          </div>
        )}

        {/* Newsletter Subscription */}
        {hasSubscribed && (
          <div className="mt-16 mb-8 text-center py-8 bg-card rounded-xl border border-border">
            <p className="text-lg text-accent font-medium">Thanks for subscribing! You&apos;re on the list.</p>
            <p className="text-muted-foreground text-sm mt-1">We&apos;ll send you our best content weekly.</p>
          </div>
        )}

        {showNewsletter && !hasSubscribed && !isPremium && (
          <div className="relative mt-20 bg-darkBlue/30 rounded-xl p-8 text-center">
            <button
              aria-label="Dismiss newsletter banner"
              className="absolute top-4 right-4 text-grey hover:text-blue transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-blue"
              style={{ lineHeight: 1 }}
              onClick={() => setShowNewsletter(false)}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-3">Subscribe to Our Newsletter</h2>
            <p className="text-grey mb-6 max-w-2xl mx-auto">
              Stay updated with our latest insights, analysis, and market research. We'll send you a weekly digest of our best content.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="input flex-grow"
                required
              />
              <button
                type="submit"
                className="btn-primary whitespace-nowrap"
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-t-2 border-background mr-2"></div>
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}