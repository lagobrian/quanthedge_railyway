'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthorRouteProps {
  children: React.ReactNode;
}

export default function AuthorRoute({ children }: AuthorRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Get auth status directly from backend
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const response = await fetch('http://127.0.0.1:8000/api/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        
        const userData = await response.json();
        
        if (!userData.is_author) {
          router.push('/');
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authorization:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-grey">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}







































