'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Verifying...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }
    fetch(`${API_BASE}/api/verify-email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
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
              <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait a moment.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✓</div>
              <h1 className="text-2xl font-bold mb-2 text-green">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link href="/login" className="btn-primary px-6 py-3 inline-block">
                Log In
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">✕</div>
              <h1 className="text-2xl font-bold mb-2 text-red">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link href="/login" className="btn-primary px-6 py-3 inline-block">
                Back to Login
              </Link>
            </>
          )}
          {status === 'no-token' && (
            <>
              <h1 className="text-2xl font-bold mb-2">No Verification Token</h1>
              <p className="text-muted-foreground mb-6">
                Please check your email for the verification link.
              </p>
              <Link href="/login" className="btn-primary px-6 py-3 inline-block">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
