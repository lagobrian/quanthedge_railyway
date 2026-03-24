'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';

export default function ProfileCompletionBanner() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissedAt = localStorage.getItem('profile_banner_dismissed');
    if (dismissedAt) {
      // Reappear after 7 days
      const diff = Date.now() - parseInt(dismissedAt);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }
    setDismissed(false);
  }, []);

  if (!isAuthenticated || !user || dismissed) return null;

  const hasFullName = !!user.full_name?.trim();
  const hasAvatar = !!user.image;
  const hasBio = !!user.bio?.trim();
  const steps = [hasFullName, hasAvatar, hasBio];
  const completed = steps.filter(Boolean).length;
  const total = steps.length;
  const isComplete = completed === total;

  if (isComplete) return null;

  const pct = Math.round((completed / total) * 100);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('profile_banner_dismissed', Date.now().toString());
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Progress ring */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-primary"
                strokeDasharray={`${pct} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {completed}/{total}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              Complete your profile to get the most out of Quant (h)Edge
            </p>
            <p className="text-xs text-muted-foreground">
              {!hasFullName && 'Add your name'}
              {!hasFullName && (!hasAvatar || !hasBio) && ' · '}
              {!hasAvatar && 'Upload a photo'}
              {!hasAvatar && !hasBio && ' · '}
              {!hasBio && 'Write a bio'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/profile"
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Complete Profile
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
