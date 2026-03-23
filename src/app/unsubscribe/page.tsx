'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function Unsubscribe() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }
    fetch(`${API_BASE}/api/newsletter/unsubscribe/?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Unsubscribed successfully.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to unsubscribe.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="card p-8">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold mb-2">Unsubscribing...</h1>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className="text-2xl font-bold mb-4">Unsubscribed</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-6">We&apos;re sorry to see you go. You can resubscribe anytime from our blog page.</p>
              <Link href="/blog" className="btn-primary px-6 py-3 inline-block">
                Back to Blog
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold mb-4 text-destructive">Error</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link href="/" className="btn-primary px-6 py-3 inline-block">
                Go Home
              </Link>
            </>
          )}
          {status === 'no-token' && (
            <>
              <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
              <p className="text-muted-foreground mb-6">This unsubscribe link is invalid or missing.</p>
              <Link href="/" className="btn-primary px-6 py-3 inline-block">
                Go Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
