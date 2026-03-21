'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] bg-darkBlue/30 animate-pulse">Loading editor...</div>,
});

interface Post {
  id?: number;
  title: string;
  description: string;
  excerpt: string;
  slug?: string;
  status: string;
  view?: number;
  date?: string;
  likes_count?: number;
  comments_count?: number;
  bookmarks_count?: number;
  is_premium: boolean;
  publishing_method: string;
  send_as_email: boolean;
  email_sent?: boolean;
  image: string;
  category: string;
  tags: string[];
}

interface Category {
  id: number;
  title: string;
  slug: string;
  image?: string;
  post_count?: number;
}

interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: Post;
  onSave?: (formData: any) => Promise<boolean>;
}

export default function PostForm({ mode, initialData, onSave }: PostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    excerpt: '',
    status: 'Draft',
    category: '',
    tags: [] as string[],
    is_premium: false,
    publishing_method: 'web',
    send_as_email: false,
    image: null as File | null,
    imagePreview: ''
  });

  useEffect(() => {
    // Fetch categories (newsletters) from the API
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('http://127.0.0.1:8000/api/categories/', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
        
        // Set default category if none is selected yet
        if (!formData.category && data.length > 0) {
          setFormData(prev => ({ ...prev, category: data[0].id.toString() }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        image: null,
        imagePreview: initialData.image || '',
        category: initialData.category || ''
      });
    }
  }, [mode, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('File must be an image');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Content is required');
      }

      // If onSave prop is provided, use it for custom save handling
      if (onSave) {
        const success = await onSave(formData);
        if (success) {
          router.push('/dashboard');
        }
        return;
      }

      const formDataToSend = new FormData();
      
      // Append all form fields with proper type conversion
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags' && Array.isArray(value)) {
          formDataToSend.append('tags', JSON.stringify(value));
        } else if (key !== 'imagePreview' && value !== null) {
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value.toString());
          } else if (value instanceof File) {
            formDataToSend.append('image', value);
          } else if (typeof value === 'string') {
            formDataToSend.append(key, value);
          }
        }
      });

      const url = mode === 'create' 
        ? 'http://127.0.0.1:8000/api/posts/'
        : `http://127.0.0.1:8000/api/posts/${initialData?.slug}/`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save post');
      }

      const data = await response.json();
      router.push(`/dashboard/posts/${data.slug}`);
    } catch (error) {
      console.error('Error saving post:', error);
      alert(error instanceof Error ? error.message : 'Failed to save post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="form-label">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="form-label">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows={2}
              className="form-input"
              placeholder="Write a brief summary of your post"
            />
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Content
            </label>
            <div className="min-h-[400px] bg-darkBlue/30 rounded-md">
              <ReactQuill
                value={formData.description}
                onChange={handleEditorChange}
                placeholder="Write your post content here..."
                theme="snow"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ indent: '-1' }, { indent: '+1' }],
                    [{ align: [] }],
                    ['link', 'image'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Post Settings</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="form-label">
                Newsletter
              </label>
              {isLoadingCategories ? (
                <div className="flex items-center space-x-2 h-10 px-3 rounded-md bg-darkBlue/30">
                  <div className="animate-spin h-4 w-4 border-t-2 border-blue"></div>
                  <span className="text-grey">Loading newsletters...</span>
                </div>
              ) : (
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {categories.length === 0 ? (
                    <option value="">No newsletters available</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tags" className="form-label">Tags</label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="form-input"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div>
                <label htmlFor="publishing_method" className="form-label">
                  Publishing Method
                </label>
                <select
                  id="publishing_method"
                  name="publishing_method"
                  value={formData.publishing_method}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="web">Web Only</option>
                  <option value="email">Email Only</option>
                  <option value="both">Both Web & Email</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  {formData.publishing_method === 'email' && 
                    'This will be sent as an email but not published on the website'}
                  {formData.publishing_method === 'web' && 
                    'This will be published on the website only'}
                  {formData.publishing_method === 'both' && 
                    'This will be published on the website and sent as an email'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Options</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="image" className="form-label">
                Featured Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
                className="form-input"
              />
              <button
                type="button"
                onClick={() => {
                  // Extract first image from the post HTML as thumbnail
                  const match = formData.description.match(/<img[^>]+src="([^"]+)"/);
                  if (match) {
                    setFormData(prev => ({ ...prev, imagePreview: match[1] }));
                  } else {
                    alert('No images found in post content to use as thumbnail.');
                  }
                }}
                className="mt-2 text-xs text-[#00ced1] hover:text-[#00ced1]/80 underline"
              >
                Auto-extract thumbnail from post content
              </button>
              {formData.imagePreview && (
                <div className="mt-2">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="rounded-md max-w-[200px] max-h-[200px] object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_premium"
                  name="is_premium"
                  checked={formData.is_premium}
                  onChange={handleCheckboxChange}
                  className="form-checkbox"
                />
                <label htmlFor="is_premium" className="text-sm">
                  Premium Content (Only available to paid subscribers)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-t-2 border-background mr-2"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>{mode === 'create' ? 'Create Post' : 'Update Post'}</>
          )}
        </button>
      </div>
    </form>
  );
}
