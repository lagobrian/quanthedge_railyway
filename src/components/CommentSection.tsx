'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE } from '@/lib/api';
import { toast } from 'sonner';

interface CommentUser {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

interface Comment {
  id: number;
  content?: string;
  comment?: string;
  user: CommentUser;
  date: string;
  likes_count: number;
  replies?: Comment[];
  parent_id?: number | null;
  is_liked?: boolean;
}

interface CommentSectionProps {
  postSlug: string;
  initialComments?: Comment[];
}

type SortMode = 'newest' | 'top';

export default function CommentSection({ postSlug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('access_token'));
    fetchComments();
  }, [postSlug]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postSlug}/comments/`);
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.comments || []);
      setComments(arr.map((c: Comment) => ({ ...c, replies: c.replies || [] })));
    } catch {}
  };

  const handleSubmit = async (parentId?: number) => {
    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;
    const token = localStorage.getItem('access_token');
    if (!token) { toast.error('Please log in to comment'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postSlug}/comment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text, parent: parentId || null }),
      });
      if (res.ok) {
        parentId ? setReplyText('') : setNewComment('');
        setReplyTo(null);
        fetchComments();
        toast.success('Comment posted');
      } else {
        toast.error('Failed to post comment');
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) { toast.error('Please log in to like'); return; }
    try {
      await fetch(`${API_BASE}/api/comments/${commentId}/like/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments();
    } catch {}
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  const sortedComments = [...comments].sort((a, b) => {
    if (sortMode === 'top') return (b.likes_count || 0) - (a.likes_count || 0);
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getAvatarUrl = (user: CommentUser) => {
    return user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  };

  const getText = (c: Comment) => c.content || c.comment || '';

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : 'mt-4'}`}>
      <img
        src={getAvatarUrl(comment.user)}
        alt={comment.user.username}
        className="w-8 h-8 rounded-full flex-shrink-0 bg-muted"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.user.full_name || comment.user.username}</span>
          <span className="text-xs text-muted-foreground" title={new Date(comment.date).toLocaleString()}>
            {formatDistanceToNow(new Date(comment.date), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{getText(comment)}</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => handleLike(comment.id)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.is_liked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={comment.is_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {comment.likes_count > 0 && comment.likes_count}
          </button>
          {!isReply && isLoggedIn && (
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Reply
            </button>
          )}
        </div>
        {/* Reply input */}
        {replyTo === comment.id && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(comment.id)}
              placeholder="Write a reply..."
              className="input flex-1 text-sm py-1.5"
              autoFocus
            />
            <button
              onClick={() => handleSubmit(comment.id)}
              disabled={isSubmitting || !replyText.trim()}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
            >
              Reply
            </button>
            <button
              onClick={() => { setReplyTo(null); setReplyText(''); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Cancel
            </button>
          </div>
        )}
        {/* Nested replies (max 1 level) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="border-l-2 border-border pl-0">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-10 border-t border-border pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">
          Comments {totalCount > 0 && <span className="text-muted-foreground font-normal">({totalCount})</span>}
        </h3>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setSortMode('newest')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              sortMode === 'newest' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortMode('top')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              sortMode === 'top' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Top
          </button>
        </div>
      </div>

      {/* New comment input */}
      {isLoggedIn ? (
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">You</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="input w-full text-sm resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !newComment.trim()}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted rounded-lg p-4 text-center mb-6">
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">Sign in</a> to join the discussion
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-1">
        {sortedComments.slice(0, visibleCount).map((comment) => renderComment(comment))}
      </div>

      {/* Load more */}
      {sortedComments.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((v) => v + 20)}
          className="mt-6 w-full py-3 text-sm text-primary border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Load more comments ({sortedComments.length - visibleCount} remaining)
        </button>
      )}

      {comments.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}
