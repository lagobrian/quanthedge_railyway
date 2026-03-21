import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * @param query Media query string like '(max-width: 768px)'
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on server or during initial client render
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Initial check
      setMatches(media.matches);
      
      // Update matches when the media query changes
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener
      media.addEventListener('change', listener);
      
      // Clean up
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;
