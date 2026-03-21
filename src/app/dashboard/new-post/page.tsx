'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TipTapEditor from './TipTapEditor';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // Define Category interface
  interface Category {
    id: number;
    title: string;
    slug: string;
    image?: string;
    post_count?: number;
  }
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(''); // Will store the category ID as a string
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [publishingMethod, setPublishingMethod] = useState('website');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_BASE + '/api/categories/');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        console.log('Fetched categories:', data);
        setCategories(data);
        if (data.length > 0) setCategory(String(data[0].id));
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);



  const buildRequestBody = (postStatus: string) => {
    const postData: Record<string, unknown> = {
      title,
      description: content,
      excerpt,
      category: Number(category),
      status: postStatus,
      is_premium: isPremium,
      publishing_method: publishingMethod,
      send_as_email: publishingMethod === 'email' || publishingMethod === 'both',
    };
    const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (thumbnailFile) {
      const formData = new FormData();
      Object.entries(postData).forEach(([key, val]) => {
        formData.append(key, String(val));
      });
      formData.append('tags', tagList.join(','));
      formData.append('image', thumbnailFile);
      return { body: formData, headers: {} as Record<string, string> };
    } else {
      if (thumbnailPreview) {
        postData.image_url = thumbnailPreview;
      }
      return {
        body: JSON.stringify({ ...postData, tags: tagList.join(',') }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your post');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const { body, headers } = buildRequestBody('draft');
      const response = await fetch(API_BASE + '/api/posts/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...headers,
        },
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save draft');
      }

      const data = await response.json();
      alert('Draft saved successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your post');
      return;
    }

    if (!content.trim()) {
      alert('Please add some content to your post');
      return;
    }

    setIsPublishing(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const { body, headers } = buildRequestBody('published');
      const response = await fetch(API_BASE + '/api/posts/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...headers,
        },
        credentials: 'include',
        body,
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to publish post');
      }

      const data = await response.json();
      router.push(`/dashboard/posts/${data.slug}`);
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen py-8 dashboard-editor">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-darkBlue/30 rounded"></div>
            <div className="h-[400px] bg-darkBlue/30 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 dashboard-editor">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
            <p className="text-grey">Write and publish a new article</p>
          </div>
          <div className="flex space-x-4">
            <Link href="/dashboard" className="text-grey hover:text-foreground transition-colors">
              Cancel
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-background border border-blue/20 rounded-md shadow-none">
              <h2 className="text-2xl font-bold mb-4">Write Post</h2>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="input input-lg w-full mb-4"
              />
              <TipTapEditor value={content} onChange={setContent} />
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Enter a brief summary of your post..."
                className="input w-full h-32 mt-4"
                aria-label="Post excerpt"
              />
              <div className="mt-4 flex justify-between">
                <span className="text-grey">Visibility:</span>
                <span>Public</span>
              </div>
              <div className="border-t border-blue/10 mt-4 pt-4 flex flex-col space-y-2">
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

          {/* Sidebar column */}
          <div className="space-y-6">
            <div className="bg-background border border-blue/20 rounded-md p-6">
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

            <div className="bg-background border border-blue/20 rounded-md p-6">
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

            <div className="bg-background border border-blue/20 rounded-md p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Publishing Method</h3>
                <select
                  value={publishingMethod}
                  onChange={(e) => setPublishingMethod(e.target.value)}
                  className="input w-full"
                >
                  <option value="website">Web Only</option>
                  <option value="email">Email Only</option>
                  <option value="both">Both Web &amp; Email</option>
                </select>
                <p className="text-grey text-sm mt-2">
                  {publishingMethod === 'website' && 'This will be published on the website only'}
                  {publishingMethod === 'email' && 'This will be sent as an email newsletter only'}
                  {publishingMethod === 'both' && 'This will be published on the website and sent as an email'}
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-blue/10">
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
            </div>

            <div className="bg-background border border-blue/20 rounded-md p-6">
              <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
              <p className="text-grey text-sm mb-4">
                Upload a featured image for your post
              </p>
              {thumbnailPreview ? (
                <div className="relative mb-4">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full rounded-md border border-blue/20" />
                  <button
                    type="button"
                    onClick={() => { setThumbnailPreview(''); setThumbnailFile(null); }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ) : (
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
                    <label className="text-blue hover:text-lightBlue transition-colors cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setThumbnailFile(file);
                            setThumbnailPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </p>
                  <p className="text-grey text-sm mt-2">
                    Recommended size: 1200 x 630 pixels
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  // Extract first image from editor content
                  const match = content.match(/<img[^>]+src="([^"]+)"/);
                  if (match) {
                    setThumbnailPreview(match[1]);
                  } else {
                    alert('No images found in post content');
                  }
                }}
                className="text-blue hover:text-lightBlue text-sm mt-3 transition-colors"
              >
                Auto-extract thumbnail from post content
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}