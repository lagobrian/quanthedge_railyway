'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill with proper SSR handling
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] bg-darkBlue/30 animate-pulse">Loading editor...</div>,
});

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('weekly-market-report');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [sendAsEmail, setSendAsEmail] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your post');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Draft saved successfully!');
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsPublished(true);
      alert('Post published successfully!');
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen py-8">
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
    <div className="min-h-screen py-8">
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
                  <span className={isPublished ? 'text-green' : 'text-grey'}>
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey">Visibility:</span>
                  <span>Public</span>
                </div>
                <div className="border-t border-blue/10 pt-4 flex flex-col space-y-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="bg-transparent border border-blue text-blue hover:bg-blue/10 transition-colors px-4 py-2 rounded-md flex justify-center items-center disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Draft'
                    )}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="btn-primary flex justify-center items-center disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-background"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Publishing...
                      </>
                    ) : (
                      'Publish'
                    )}
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
                aria-label="Post category"
              >
                <option value="weekly-market-report">Weekly Market Report</option>
                <option value="supplementary-data">Supplementary Data</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              <p className="text-grey text-sm mb-4">
                Add tags separated by commas (e.g. "stocks, crypto, analysis")
              </p>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags..."
                className="input w-full"
                aria-label="Post tags"
              />
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Content Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Premium Content</p>
                    <p className="text-grey text-sm">
                      Make this post available only to paid subscribers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={() => setIsPremium(!isPremium)}
                      className="sr-only peer"
                      aria-label="Toggle premium content"
                    />
                    <div className="w-11 h-6 bg-darkBlue/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue" />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-blue/10">
                  <div>
                    <p className="font-medium">Send as Email</p>
                    <p className="text-grey text-sm">
                      Send this post as an email to subscribers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAsEmail}
                      onChange={() => setSendAsEmail(!sendAsEmail)}
                      className="sr-only peer"
                      aria-label="Toggle email sending"
                    />
                    <div className="w-11 h-6 bg-darkBlue/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue" />
                  </label>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
              <p className="text-grey text-sm mb-4">
                Upload a featured image for your post
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