'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';

interface User {
  id: number;
  username: string;
}

interface Comment {
  id: number;
  content?: string;       // Backend might use 'content' or 'comment' field
  comment?: string;       // Allow either field name
  user: User;
  date: string;
  likes_count: number;
  replies_count?: number; // Make optional since it might not always be present
  replies?: Comment[];
  parent_id?: number | null;
  is_liked?: boolean;
  name?: string;         // Some backend systems might include this
  email?: string;        // Some backend systems might include this
}

interface CommentSectionProps {
  postSlug: string;
  initialComments: Comment[];
}

export default function CommentSection({ postSlug, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    console.log('Fetching comments for post slug:', postSlug);
    fetchComments();
  }, [postSlug]); // Re-fetch when post changes

  const fetchComments = async () => {
    try {
      console.log(`Fetching comments from: http://127.0.0.1:8000/api/posts/${postSlug}/comments/`);
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${postSlug}/comments/`);
      
      // Log response status and headers for debugging
      console.log('Comments API response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        
        if (response.status === 404) {
          setError(`No comments found for this post (${postSlug}). The post may not exist in the database with this exact slug.`);
        } else {
          setError(`Failed to fetch comments: ${response.status} ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      
      // Debug the structure returned from the API
      console.log('Comments data from API:', JSON.stringify(data, null, 2));
      
      // The API response might be {comments: [...]} or directly an array
      // Extract the comments array properly in either case
      let commentsArray = [];
      if (data && data.comments && Array.isArray(data.comments)) {
        console.log('API returned comments in a comments object');
        commentsArray = data.comments;
      } else if (Array.isArray(data)) {
        console.log('API returned comments directly as an array');
        commentsArray = data;
      } else {
        console.log('Unexpected API response format:', typeof data);
        commentsArray = [];
      }
      
      console.log('Comments array length:', commentsArray.length);
      
      // Ensure each comment has a replies array if it doesn't already
      const commentsWithReplies = commentsArray.map((comment: Comment) => ({
        ...comment,
        replies: comment.replies || []
      }));
      
      console.log('Processed comments:', JSON.stringify(commentsWithReplies, null, 2));
      setComments(commentsWithReplies);
      setError(null); // Clear any previous errors if successful
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Handle the unknown error type properly
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load comments: ${errorMessage}`);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent, parentId?: number, replyTextOverride?: string) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${postSlug}/comment/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: parentId ? replyTextOverride : newComment,
          parent_id: parentId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newCommentData = await response.json();
      console.log('New comment data:', newCommentData);
      
      if (parentId) {
        // Add reply to existing comment (recursive function to handle nested replies)
        const addReplyToComment = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === parentId) {
              // This is the parent comment, add the reply
              return {
                ...comment,
                replies: [...(comment.replies || []), newCommentData],
                replies_count: (comment.replies_count || 0) + 1
              };
            } else if (comment.replies && comment.replies.length > 0) {
              // Check if the parent is in the replies
              return {
                ...comment,
                replies: addReplyToComment(comment.replies)
              };
            }
            return comment;
          });
        };

        setComments(prev => addReplyToComment(prev));
        setReplyTo(null);
        setReplyText('');
      } else {
        // Add new top-level comment
        setComments(prev => [
          {
            ...newCommentData,
            replies: newCommentData.replies || []  // Ensure replies array exists
          }, 
          ...prev
        ]);
        setNewComment('');
      }
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      const data = await response.json();
      console.log('Like response:', data);
      
      // Update comment likes in state with recursive function to handle nested replies
      const updateCommentLikes = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            // This is the comment that was liked
            return {
              ...comment,
              likes_count: Math.max(0, data.likes_count),
              is_liked: data.liked
            };
          } else if (comment.replies && comment.replies.length > 0) {
            // Check if the liked comment is in the replies
            return {
              ...comment,
              replies: updateCommentLikes(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(prev => updateCommentLikes(prev));
    } catch (error) {
      console.error('Error liking comment:', error);
      setError('Failed to like comment. Please try again.');
    }
  };

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    // Local ReplyForm with local state for reply text
    const ReplyForm = () => {
      const [localReplyText, setLocalReplyText] = useState('');
      const [isReplyLoading, setIsReplyLoading] = useState(false);
      return (
        <form
          onSubmit={async (e) => {
            setIsReplyLoading(true);
            await handleSubmitComment(e, comment.id, localReplyText);
            setIsReplyLoading(false);
            setLocalReplyText('');
          }}
          className="mt-4"
        >
          <textarea
            rows={2}
            className="w-full rounded-md border border-gray-700 bg-[#232c3b] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
            placeholder="Write a reply..."
            value={localReplyText}
            onChange={(e) => setLocalReplyText(e.target.value)}
            disabled={isReplyLoading}
          />
          <div className="mt-2 flex space-x-2">
            <button
              type="submit"
              disabled={isReplyLoading || !localReplyText.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isReplyLoading ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setLocalReplyText('');
              }}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    };

    const [formattedDate, setFormattedDate] = useState('');
    useEffect(() => {
      setFormattedDate(formatDistanceToNow(new Date(comment.date), { addSuffix: true }));
    }, [comment.date]);

    // For debugging
    console.log('Rendering comment:', comment);
    
    return (
      <div className={`${isReply ? 'mt-4' : 'mt-6'} bg-[#181f2a] rounded-lg shadow p-4 text-gray-100 ${
        isReply ? 'border-l-2 border-blue-400/30 ml-6' : ''
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.username || 'User')}`}
                alt={comment.user?.username || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-gray-600 bg-gray-200"
              />
              <span className="font-semibold text-blue-400">{comment.user?.username || comment.name || 'Anonymous'}</span>
              <span className="text-xs text-gray-400">{formattedDate}</span>
              {isReply && (
                <span className="text-xs italic text-gray-500">reply</span>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-200 whitespace-pre-line">
              {comment.content || comment.comment || ''}
            </div>
            <div className="mt-2 flex items-center space-x-4">
              <button
                className={`flex items-center space-x-1 text-gray-400 hover:text-pink-500 focus:outline-none ${
                  comment.is_liked ? 'text-pink-500' : ''
                }`}
                onClick={() => handleLikeComment(comment.id)}
                aria-label="Like comment"
                type="button"
              >
                <Heart size={16} />
                <span>{comment.likes_count}</span>
              </button>
              <button
                className="text-xs text-blue-400 hover:underline focus:outline-none"
                onClick={() => setReplyTo(comment.id)}
                type="button"
              >
                Reply
              </button>
            </div>
            {/* Reply Form */}
            {replyTo === comment.id && <ReplyForm />}
            
            {/* Replies - with better indentation and visual hierarchy */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-3 pl-2 mt-4">
                {comment.replies.map(reply => (
                  <CommentComponent key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-2xl font-bold">Comments</h2>
      {/* Add Comment Form */}
      <form onSubmit={(e) => handleSubmitComment(e)} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Add a comment
          </label>
          <textarea
            id="comment"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-700 bg-[#232c3b] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400"
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isLoading || !isLoggedIn}
          />
        </div>
        {!isLoggedIn && (
          <p className="text-sm text-gray-500">
            Please <button type="button" onClick={() => router.push('/login')} className="text-blue-600 hover:underline">log in</button> to comment
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || !newComment.trim() || !isLoggedIn}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-4 my-6" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Comments could not be loaded</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2">You can still read and enjoy the post. Try refreshing the page or coming back later to see comments.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map(comment => (
          <CommentComponent key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
