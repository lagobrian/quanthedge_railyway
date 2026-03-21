'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  status: string;
  view: number;
  date: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_premium: boolean;
  send_as_email: boolean;
  email_sent: boolean;
  image: string;
}

interface PostCardProps {
  post: Post;
  onDelete?: (slug: string) => void;
  onEdit?: (slug: string) => void;
}

export default function PostCard({ post, onDelete, onEdit }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${post.slug}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      onDelete?.(post.slug);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <Image
          src={post.image || '/default-post.jpg'}
          alt={post.title}
          fill
          className="object-cover"
        />
        {post.is_premium && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded">
            Premium
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex space-x-4">
            <span>👁️ {post.view}</span>
            <span>❤️ {post.likes_count}</span>
            <span>💬 {post.comments_count}</span>
          </div>
          <span className="text-xs">{new Date(post.date).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              post.status === 'Published' ? 'bg-green-100 text-green-800' :
              post.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {post.status}
            </span>
            {post.send_as_email && (
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                post.email_sent ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {post.email_sent ? 'Email Sent' : 'Email Pending'}
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(post.slug)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
