'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Show success message
    toast.success('Successfully logged out!');
    
    // Redirect to home page
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-grey">Logging out...</p>
      </div>
    </div>
  );
}
