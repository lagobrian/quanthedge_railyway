import React, { useRef, useState, useEffect } from 'react';
import { Share2, X } from 'lucide-react';

interface BlogShareMenuProps {
  post: {
    title: string;
    slug: string;
  };
}

const getShareUrl = (slug: string) => `${window.location.origin}/blog/${slug}`;

export default function BlogShareMenu({ post }: BlogShareMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const shareUrl = getShareUrl(post.slug);
  const shareText = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Share"
        className="flex items-center text-grey hover:text-blue"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Share2 className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-blue/20 rounded shadow-lg z-30 p-3 flex flex-col space-y-2 animate-fade-in">
          <button
            aria-label="Close share menu"
            className="absolute top-2 right-2 text-grey hover:text-red-500 text-lg"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium mb-2">Share this post</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-2 py-1 rounded hover:bg-blue/10 transition-colors text-blue"
            aria-label="Share on Twitter"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.09 9.09 0 01-2.88 1.1A4.48 4.48 0 0016.11.36c-2.5 0-4.5 2.01-4.5 4.5 0 .35.04.69.11 1.02C7.69 5.71 4.07 3.93 1.64.9c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.52 4.52 0 01.96 6.1v.06c0 2.13 1.52 3.91 3.57 4.31-.37.1-.76.16-1.17.16-.28 0-.55-.03-.81-.08.55 1.7 2.15 2.94 4.05 2.97A9.05 9.05 0 012 19.54a12.79 12.79 0 006.92 2.03c8.3 0 12.85-6.87 12.85-12.83 0-.2 0-.41-.02-.61A9.22 9.22 0 0024 4.59a9.14 9.14 0 01-2.6.71A4.52 4.52 0 0023 3z"/></svg>
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-2 py-1 rounded hover:bg-blue/10 transition-colors text-blue"
            aria-label="Share on Facebook"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24h11.495v-9.294H9.692v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.314h3.587l-.467 3.622h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0"/></svg>
            Facebook
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-2 py-1 rounded hover:bg-blue/10 transition-colors text-blue"
            aria-label="Share on LinkedIn"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.327-.027-3.037-1.849-3.037-1.851 0-2.132 1.445-2.132 2.939v5.667h-3.554V9h3.414v1.561h.049c.476-.899 1.637-1.849 3.37-1.849 3.602 0 4.267 2.369 4.267 5.455v6.285zM5.337 7.433c-1.144 0-2.069-.926-2.069-2.068 0-1.143.925-2.069 2.069-2.069 1.143 0 2.068.926 2.068 2.069 0 1.142-.925 2.068-2.068 2.068zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.723v20.549C0 23.229.792 24 1.771 24h20.451C23.2 24 24 23.229 24 22.271V1.723C24 .771 23.2 0 22.225 0z"/></svg>
            LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
