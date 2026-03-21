'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Post, Comment } from '@/types/blog';
import CommentTree from '@/components/CommentTree';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { API_BASE } from '@/lib/api';

interface ViewPostProps {
  params: {
    slug: string;
  };
}

export default function ViewPost({ params }: ViewPostProps) {
  const router = useRouter();
  // Unwrap params for Next.js future compatibility
  const unwrappedParams = React.use(params);
  const slug = unwrappedParams.slug;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPostAuthor, setIsPostAuthor] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/api/posts/${slug}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
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

    fetchPost();
  }, [slug, router]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (post?.id) {
      fetchComments();
    }
  }, [post?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      setCommentError('Please write something before posting');
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/posts/${slug}/comments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ content: commentContent }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to post comment');
      }

      // Clear input and refresh comments
      setCommentContent('');
      setCommentError('');
      fetchComments();
    } catch (error) {
      console.error('Comment submission error:', error);
      setCommentError(
        error instanceof Error 
          ? error.message 
          : 'Failed to post comment. Please try again.'
      );
    }
  };

  const fetchComments = async () => {
    setIsCommentsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/posts/${slug}/comments/`, {
        headers: {
          ...(token && {'Authorization': `Bearer ${token}`}),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch comments');
      }

      const data = await response.json();
      console.log('Fetched comments:', data);
      setComments(data.comments || []);
      setIsPostAuthor(data.is_post_author || false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch comments');
    } finally {
      setIsCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchComments();
    }
  }, [slug]);

  const handleReplyToComment = (commentId: number) => {
    // Scroll to comment form and focus it
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.scrollIntoView({ behavior: 'smooth' });
      // Set placeholder to indicate replying
      setCommentContent(`@reply-to-${commentId} `);
      // Focus the textarea
      const textarea = commentForm.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }
  };

  const handleModerateComment = async (commentId: number, action: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/comments/${commentId}/moderate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error('Failed to moderate comment');
      }

      // Refresh comments
      await fetchComments();

    } catch (error) {
      console.error('Error moderating comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/posts/${slug}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete post');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return '/default-post.jpg'; // Local fallback image
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

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
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
              >
                Return to Dashboard
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
              <h2 className="text-2xl font-bold text-gray-300 mb-2">Post Not Found</h2>
              <p className="text-gray-400 mb-4">The post you're looking for doesn't exist or you don't have permission to view it.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
              >
                Return to Dashboard
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">View Post</h1>
          <div className="space-x-4 flex items-center">
            <button
              onClick={async () => {
                if (!post) return;
                try {
                  const token = localStorage.getItem('access_token');
                  if (!token) {
                    router.push('/login');
                    return;
                  }
                  const response = await fetch(`${API_BASE}/api/posts/${slug}/pin/`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ is_pinned: !post.is_pinned })
                  });
                  if (!response.ok) {
                    throw new Error('Failed to update pin status');
                  }
                  const data = await response.json();
                  setPost(prev => prev ? { ...prev, is_pinned: data.is_pinned } : prev);
                  alert(data.is_pinned ? 'Post pinned to home page!' : 'Post unpinned from home page.');
                } catch (error) {
                  alert('Failed to update pin status.');
                  console.error(error);
                }
              }}
              className={`px-4 py-2 rounded transition-colors ${post?.is_pinned ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-darkBlue/40 text-white hover:bg-yellow-400 hover:text-black'}`}
            >
              {post?.is_pinned ? 'Unpin from Home' : 'Pin to Home'}
            </button>
            <Link
              href={`/dashboard/posts/${slug}/edit`}
              className="inline-block px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red text-white rounded hover:bg-red-dark transition-colors"
            >
              Delete Post
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 font-medium text-sm border-b-2 ${activeTab === 'details' ? 'border-blue text-blue' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              Post Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 font-medium text-sm border-b-2 ${activeTab === 'comments' ? 'border-blue text-blue' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              Moderate Comments
            </button>
          </nav>
        </div>

        {activeTab === 'details' && (
          <div className="rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
            {post.image && (
              <div className="relative w-full h-64 mb-6">
                <Image
                  src={getImageUrl(post.image)}
                  alt={post.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.description }} />
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-gray-300">
                <span className="font-medium">Status:</span> {post.status}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Premium:</span> {post.is_premium ? 'Yes' : 'No'}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Send as Email:</span> {post.send_as_email ? 'Yes' : 'No'}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Email Sent:</span> {post.email_sent ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="mt-8 space-y-8">
            <h2 className="text-2xl font-bold mb-4">Comments</h2>
            
            {/* Comments Section */}
            <div className="mt-8">
              {/* Comment form */}
              <div className="p-4 bg-gray-800 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2 text-white">Add a Comment</h3>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write your comment here..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    color: 'black',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                />
                {commentError && (
                  <p className="text-red-500 text-sm mt-1">{commentError}</p>
                )}
                <button
                  onClick={handleCommentSubmit}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments list */}
              <div className="mt-6 space-y-4">
                {isCommentsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Loading comments...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-gray-800 rounded-lg shadow">
                        <p className="text-white font-medium">{comment.user?.username}</p>
                        <p className="text-gray-300 mt-1">{comment.content}</p>
                        <div className="mt-2 flex space-x-4">
                          <button 
                            onClick={() => handleReplyToComment(comment.id)} 
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Reply
                          </button>
                          {isPostAuthor && (
                            <button 
                              onClick={() => handleModerateComment(comment.id, 'moderate')}
                              className="text-red-400 hover:text-red-300"
                            >
                              Moderate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400">No comments yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
