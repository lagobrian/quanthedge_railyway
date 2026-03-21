'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill with proper SSR handling
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] bg-darkBlue/30 animate-pulse">Loading editor...</div>,
});

interface EditPostParams {
  slug: string;
}

interface EditPostProps {
  params: Promise<EditPostParams>;
}

export default function EditPost({ params }: EditPostProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const { slug } = unwrappedParams;
  
  // Define Category interface
  interface Category {
    id: number;
    title: string;
    slug: string;
    image?: string;
    post_count?: number;
  }
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [sendAsEmail, setSendAsEmail] = useState(false);
  const [status, setStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState('');
  
  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/categories/');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        console.log('Fetched categories:', data);
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);
  
  // Rich text editor configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  };
  
  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        console.log(`Fetching post with slug: ${slug}`);
        const response = await fetch(`http://127.0.0.1:8000/api/posts/${slug}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).catch(error => {
          console.error('Network error:', error);
          throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 404) {
            throw new Error('Post not found');
          }
          let errorMsg = `Failed to fetch post (Status: ${response.status})`;
          try {
            const errorData = await response.json();
            if (errorData?.detail) errorMsg = String(errorData.detail);
          } catch {}
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('Post data retrieved:', data);
        
        // Populate form fields with post data
        setTitle(data.title || '');
        setContent(data.description || '');
        setExcerpt(data.excerpt || '');
        // Check the format of category data from API response
        console.log('Category data from API:', data.category);
        
        // Handle if it's an object with a slug property or just a slug string
        if (data.category && typeof data.category === 'object' && data.category.slug) {
          setCategory(String(data.category.id));
        } else if (typeof data.category === 'string') {
          setCategory(data.category);
        } else {
          setCategory('');
        }
        
        // If we have valid categories but no category is set, select the first one
        setTimeout(() => {
          if ((!data.category || data.category === '') && categories.length > 0) {
            setCategory(String(categories[0].id));
          }
        }, 500);
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''));
        setIsPremium(data.is_premium || false);
        setSendAsEmail(data.send_as_email || false);
        setStatus(data.status || 'draft');
        setImageUrl(data.image || '');
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch post');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (slug) {
      fetchPost();
    }
  }, [router, slug]);
  
  // Save post as draft
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your post');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Log the current category value being sent to backend
      console.log('Sending category to backend:', category);
      
      // Create request body as JSON instead of FormData
      console.log('tags value and type before sending (draft):', tags, typeof tags);
      const tagsString = Array.isArray(tags) ? tags.join(', ') : (typeof tags === 'string' ? tags : '');
      console.log('DEBUG: tagsString value:', tagsString, 'type:', typeof tagsString);
      
      const requestBody = {
        title,
        description: content,
        excerpt,
        category: Number(category), // This is the category slug
        tags: tagsString,
        is_premium: isPremium,
        send_as_email: sendAsEmail,
        status: 'draft',
      };

      
      console.log('Full request data:', requestBody);
// tags is always sent as a string
      
      console.log(`Updating post with slug: ${slug}`);
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${slug}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorText = await response.text();
        console.error('Error response from backend (save draft):', errorText);
        let errorMsg = 'Failed to save draft';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData?.detail) errorMsg = String(errorData.detail);
        } catch {}
        setError(errorMsg);
        return;
      }

      await response.json();
      setError('');
      alert('Draft saved!');
    } catch (error) {
      console.error('Error saving draft:', error);
      setError(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Publish post
  const handlePublish = async () => {
    console.log('tags value and type before sending (publish):', tags, typeof tags);

    if (!title.trim()) {
      setError('Please enter a title for your post');
      return;
    }
    
    if (!content.trim()) {
      setError('Please add some content to your post');
      return;
    }
    
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Log the current category value being sent to backend
      console.log('Sending category to backend for publish:', category);
      
      // Log the value and type of tags before building the request body
      console.log('tags value and type before sending (publish):', tags, typeof tags);
      
      // Create request body as JSON instead of FormData
      const requestBody = {
        title,
        description: content,
        excerpt,
        category: Number(category), // This is the category slug
        status: 'published',
        tags: typeof tags === 'string' ? tags : '',
        is_premium: isPremium,
        send_as_email: sendAsEmail
      };
      
      console.log('Full publish request data:', requestBody);
// tags is omitted if empty
      
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${slug}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Network error: Unable to connect to the server. Please make sure the backend is running.');
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        let errorMsg = 'Failed to publish post';
        try {
          const errorData = JSON.parse(await response.text());
          if (errorData?.detail) errorMsg = String(errorData.detail);
        } catch {}
        setError(errorMsg);
        return;
      }

      await response.json();
      setError('');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Loading state
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-darkBlue/30 rounded mb-2"></div>
              <div className="h-4 w-32 bg-darkBlue/30 rounded"></div>
            </div>
            <div className="animate-pulse h-6 w-20 bg-darkBlue/30 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-pulse h-12 bg-darkBlue/30 rounded"></div>
              <div className="animate-pulse h-[400px] bg-darkBlue/30 rounded"></div>
              <div className="animate-pulse h-32 bg-darkBlue/30 rounded"></div>
            </div>
            
            <div className="space-y-6">
              <div className="animate-pulse h-40 bg-darkBlue/30 rounded"></div>
              <div className="animate-pulse h-20 bg-darkBlue/30 rounded"></div>
              <div className="animate-pulse h-32 bg-darkBlue/30 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-red/10 border-l-4 border-red p-4 rounded mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red">Error Loading Post</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red shadow-sm hover:bg-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center px-3 py-2 border border-blue/20 text-sm leading-4 font-medium rounded-md text-grey hover:bg-darkBlue/30 focus:outline-none"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-darkBlue/30 p-6 rounded-lg border border-blue/20">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
            <ul className="list-disc pl-5 space-y-2 text-grey">
              <li>Check if the post exists in your dashboard</li>
              <li>Verify you have permission to edit this post</li>
              <li>Ensure you're logged in with the correct account</li>
              <li>Check if the backend server is running properly</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // Main form
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Post</h1>
            <p className="text-grey">Update your article</p>
          </div>
          <div className="flex space-x-4">
            <Link href="/dashboard" className="text-grey hover:text-foreground transition-colors">
              Cancel
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post Title"
                className="input w-full text-2xl font-bold py-3 px-4"
                aria-label="Post title"
              />
            </div>

            <div className="card overflow-hidden">
              <ReactQuill
                value={content}
                onChange={setContent}
                modules={modules}
                placeholder="Write your post content here..."
                theme="snow"
                className="bg-darkBlue/30 text-foreground min-h-[400px]"
              />
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Excerpt</h3>
              <p className="text-grey text-sm mb-4">
                Write a short excerpt for your post. This will be displayed on the blog list page and in search results.
              </p>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Enter a brief summary of your post..."
                className="input w-full h-32"
                aria-label="Post excerpt"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Publish</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-grey">Status:</span>
                  <span className={status === 'Published' ? 'text-green' : 'text-grey'}>
                    {status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Visibility:</span>
                  <span>Public</span>
                </div>
                <div className="border-t border-blue/10 pt-4 flex flex-col space-y-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving || isPublishing}
                    className={`btn btn-outline ${(isSaving || isPublishing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isSaving || isPublishing}
                    className={`btn btn-primary ${(isSaving || isPublishing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Category</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input w-full"
              >
                {categories.length === 0 && (
                  <option value="">Loading categories...</option>
                )}
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              <p className="text-grey text-sm mb-4">
                Enter tags separated by commas (e.g., forex, trading, analysis)
              </p>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags..."
                className="input w-full"
              />
            </div>

            <div className="card space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="premium"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="checkbox"
                />
                <label htmlFor="premium" className="text-sm">
                  Premium Content (Only available to paid subscribers)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendAsEmail}
                  onChange={(e) => setSendAsEmail(e.target.checked)}
                  className="checkbox"
                />
                <label htmlFor="sendEmail" className="text-sm">
                  Send as Email Newsletter
                </label>
              </div>
            </div>

            {imageUrl && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Current Featured Image</h3>
                <div className="relative aspect-video w-full overflow-hidden rounded-md">
                  <img 
                    src={imageUrl} 
                    alt="Featured image" 
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Update Featured Image</h3>
              <p className="text-grey text-sm mb-4">
                Upload a new featured image for your post
              </p>
              <div className="border-2 border-dashed border-blue/20 rounded-md p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-grey mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-grey">
                  Drag and drop an image here, or{' '}
                  <button className="text-blue hover:text-lightBlue transition-colors">
                    browse
                  </button>
                </p>
                <p className="text-grey text-sm mt-2">
                  Recommended size: 1200 x 630 pixels
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
