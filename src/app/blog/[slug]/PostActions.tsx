'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
}

interface PostActionsProps {
  post: Post;
}

export default function PostActions({ post }: PostActionsProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(
  typeof post.likes_count === 'number' && !isNaN(post.likes_count) ? post.likes_count : 0
);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarks_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in by checking for access token
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    
    // If logged in, fetch the post's like and bookmark status
    if (token) {
      fetchPostStatus(token);
    }
  }, [post.slug]);
  
  const fetchPostStatus = async (token: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${post.slug}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.is_liked || false);
        setIsBookmarked(data.is_bookmarked || false);
        setLikesCount(Math.max(0, typeof data.likes_count === 'number' && !isNaN(data.likes_count) ? data.likes_count : 0));
      }
    } catch (error) {
      console.error('Error fetching post status:', error);
      setError('Failed to fetch post status');
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setError(null);
    setIsLikeLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Please log in to like posts');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/posts/${post.slug}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to like post');
      }

      // Optimistically toggle like state and count
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update like status');
      console.error('Error liking post:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };


  const handleBookmark = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setError(null);
    setIsBookmarkLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Please log in to bookmark posts');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/posts/${post.slug}/bookmark/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to bookmark post');
      }

      const data = await response.json();
      setIsBookmarked(!isBookmarked);
      setBookmarksCount(prev => isBookmarked ? prev - 1 : prev + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update bookmark status');
      console.error('Error bookmarking post:', error);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 ${
            isLiked ? 'text-red-500' : 'text-gray hover:text-red-500'
          } transition-colors`}
          disabled={isLikeLoading}
          aria-label={isLiked ? 'Unlike post' : 'Like post'}
          aria-busy={isLikeLoading}
        >
          {isLikeLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill={isLiked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center space-x-2 ${
            isBookmarked ? 'text-blue' : 'text-gray hover:text-blue'
          } transition-colors`}
          disabled={isBookmarkLoading}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
          aria-busy={isBookmarkLoading}
        >
          {isBookmarkLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-blue border-t-transparent rounded-full"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill={isBookmarked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          )}
          <span>{bookmarksCount}</span>
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
