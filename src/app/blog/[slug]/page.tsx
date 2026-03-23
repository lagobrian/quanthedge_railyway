'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PostActions from './PostActions';
import CommentSection from '@/components/CommentSection';
import React from 'react';
import { Share2 } from 'lucide-react';
import BlogShareMenu from './BlogShareMenu';
import { API_BASE } from '@/lib/api';

interface BlogPostParams {
  slug: string;
}

interface BlogPostProps {
  params: Promise<BlogPostParams>; 
}

interface Post {
  id: number;
  title: string;
  description: string;
  excerpt: string;
  slug: string;
  status: string;
  view: number;
  date: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_premium: boolean;
  image: string;
  comments: Comment[];
  user: {
    username: string;
    profile?: { 
      image?: string; 
    };
  };
}

interface Comment {
  id: number;
  name: string;
  email: string;
  comment: string;
  reply?: string;
  date: string;
}

export default function BlogPost({ params }: BlogPostProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unwrappedParams = use(params);
  const { slug } = unwrappedParams;

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoggedIn(false);
        setIsPaidUser(false);
        return;
      }
      
      try {
        const response = await fetch(API_BASE + '/api/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setIsPaidUser(userData.is_premium || false);
        } else {
          setIsLoggedIn(false);
          setIsPaidUser(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
        setIsPaidUser(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/posts/${slug}/`, {
          headers
        }).catch(error => {
          console.error('Network error:', error);
          throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 403) {
            throw new Error('This is premium content. Please upgrade your account to view.');
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch post');
        }

        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch post');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug, isLoggedIn, isPaidUser, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-red text-center">
              <p className="text-lg font-medium mb-2">Error</p>
              <p>{error}</p>
              {error?.includes('premium content') && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="mt-4 px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
                >
                  View Pricing Plans
                </button>
              )}
              <button
                onClick={() => router.push('/blog')}
                className="mt-4 ml-4 px-4 py-2 bg-gray text-white rounded hover:bg-gray-dark transition-colors"
              >
                Return to Blog
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Post Not Found</h2>
              <p className="text-grey mb-4">The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <button
                onClick={() => router.push('/blog')}
                className="mt-4 px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
              >
                Return to Blog
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-6">
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold">{post.title}</h1>
              {post.is_premium && !isPaidUser && (
                <span className="shrink-0 px-2 py-1 text-xs font-semibold bg-primary/20 text-primary rounded border border-primary/30">
                  Premium
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {post.user?.profile?.image && (
                  <Image
                    src={post.user.profile.image}
                    alt={post.user?.username || 'Author'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{post.user?.username || 'Anonymous'}</p>
                  <p className="text-sm text-grey">
                    {post.date ? new Date(post.date).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <PostActions post={post} />
                {/* Share button with popover */}
                <BlogShareMenu post={post} />
              </div>
            </div>
          </header>

          {post.image && (
            <div className="relative w-full h-96 mb-8">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          {post.excerpt && (
            <div className="bg-darkBlue/30 border-l-4 border-blue p-4 mb-8 rounded-r">
              <p className="text-lg text-grey italic">{post.excerpt}</p>
            </div>
          )}

          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.description }}
          />

          {(post as any).is_paywalled && (
            <div className="relative mt-8">
              <div className="absolute inset-x-0 -top-32 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              <div className="bg-[#0e2239] border border-[#00ced1]/30 rounded-xl p-8 text-center">
                <svg className="w-10 h-10 mx-auto mb-4 text-[#00ced1]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <h3 className="text-xl font-bold mb-2">Premium Content</h3>
                <p className="text-grey mb-6">This article is available exclusively to premium subscribers. Upgrade to continue reading.</p>
                <a href="/pricing" className="inline-block px-6 py-3 bg-[#00ced1] text-[#061829] font-semibold rounded-lg hover:bg-[#00ced1]/80 transition-colors">
                  Upgrade to Premium
                </a>
              </div>
            </div>
          )}

          {!(post as any).is_paywalled && (
            <div className="mt-8 border-t border-blue/20 pt-8">
              <CommentSection postSlug={post.slug} initialComments={[]} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
