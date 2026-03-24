'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { toast } from 'sonner';

const REACTIONS = [
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'lightbulb', emoji: '💡', label: 'Insightful' },
  { type: 'chart', emoji: '📈', label: 'Bullish' },
  { type: 'thinking', emoji: '🤔', label: 'Interesting' },
  { type: 'diamond', emoji: '💎', label: 'Gem' },
  { type: 'pray', emoji: '🙏', label: 'Thanks' },
];

interface PostReactionsProps {
  slug: string;
}

export default function PostReactions({ slug }: PostReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/${slug}/reactions/`, {
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('access_token')
          ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
          : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCounts(data.counts || {});
        setUserReactions(data.user_reactions || []);
      })
      .catch(() => {});
  }, [slug]);

  const toggleReaction = async (reactionType: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sign in to react');
      return;
    }
    setLoading(reactionType);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${slug}/react/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setCounts(data.counts || {});
        setUserReactions(data.user_reactions || []);
      }
    } catch {
      toast.error('Failed to react');
    } finally {
      setLoading(null);
    }
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {REACTIONS.map((r) => {
        const count = counts[r.type] || 0;
        const isActive = userReactions.includes(r.type);
        const isLoading = loading === r.type;
        return (
          <button
            key={r.type}
            onClick={() => toggleReaction(r.type)}
            disabled={isLoading}
            title={r.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
              isActive
                ? 'bg-primary/20 border border-primary/40 shadow-sm'
                : 'bg-card border border-border hover:border-primary/30 hover:bg-primary/5'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            <span className={`text-base ${isActive ? 'scale-110' : ''} transition-transform`}>
              {r.emoji}
            </span>
            {count > 0 && (
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
      {totalReactions > 0 && (
        <span className="text-xs text-muted-foreground ml-2">
          {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
