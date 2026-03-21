'use client';

import { useState } from 'react';
import { HeartIcon, HeartFilledIcon } from '@radix-ui/react-icons';

interface LikeButtonProps {
  postSlug: string;
  initialLikes: number;
  isLiked: boolean;
}

export default function LikeButton({ postSlug, initialLikes, isLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(isLiked);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Please log in to like posts');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/posts/${postSlug}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setLiked(data.status === 'liked');
      setLikes(prev => data.status === 'liked' ? prev + 1 : prev - 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update like status');
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-1">
      <button 
        onClick={toggleLike}
        className="flex items-center space-x-2 hover:text-red-500 transition-colors"
        aria-label={liked ? 'Unlike post' : 'Like post'}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <div className="animate-spin w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
        ) : (
          <>
            {liked ? (
              <HeartFilledIcon className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span>{likes}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
