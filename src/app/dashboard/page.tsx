'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import shortuuid from 'shortuuid';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });

interface DashboardStats {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_bookmarks: number;
  view_change_pct?: number;
  likes_change_pct?: number;
  comments_change_pct?: number;
  subscribers_change_pct?: number;
  subscriber_count?: number;
  published_posts?: number;
  draft_posts?: number;
  premium_posts?: number;
  free_subscribers?: number;
  free_subscribers_pct?: number;
  paid_subscribers?: number;
  paid_subscribers_pct?: number;
}

interface Post {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  status: string;
  view: number;
  date: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_premium: boolean;
  send_as_email: boolean;
  email_sent: boolean;
  image: string;
  category: string;
}

const defaultStats: DashboardStats = {
  total_posts: 0,
  total_views: 0,
  total_likes: 0,
  total_comments: 0,
  total_bookmarks: 0
};

export default function Dashboard() {
  // ...existing state declarations...
  // Add comment moderation handlers
  const handleApproveComment = async (commentId: number) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/moderate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ action: 'approve' })
    });
    if (!response.ok) {
      let errorMsg = 'Failed to approve comment';
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch {}
      setError(errorMsg);
      return;
    }
    fetchDashboardData();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error approving comment');
  }
};

  const handleDeleteComment = async (commentId: number) => {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/moderate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ action: 'delete' })
    });
    if (!response.ok) {
      let errorMsg = 'Failed to delete comment';
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch {}
      setError(errorMsg);
      return;
    }
    fetchDashboardData();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error deleting comment');
  }
};

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draftPosts, setDraftPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [totalCommentsPages, setTotalCommentsPages] = useState(1);
  const [analytics, setAnalytics] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [selectedCategory, selectedStatus]);

const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch dashboard statistics
      const statsResponse = await fetch('http://127.0.0.1:8000/api/dashboard/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          router.push('/login');
          return;
        }
        let errorMsg = 'Failed to fetch dashboard statistics';
        try {
          const errorData = await statsResponse.json();
          if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch posts with filters
      const postsUrl = new URL('http://127.0.0.1:8000/api/dashboard/posts/');
      if (selectedCategory !== 'all') {
        postsUrl.searchParams.append('category', selectedCategory);
      }
      if (selectedStatus !== 'all') {
        postsUrl.searchParams.append('status', selectedStatus);
      }

      const postsResponse = await fetch(postsUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!postsResponse.ok) {
        if (postsResponse.status === 401) {
          router.push('/login');
          return;
        }
        let errorMsg = 'Failed to fetch posts';
        try {
          const errorData = await postsResponse.json();
          if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const postsData = await postsResponse.json();
      setPosts(postsData);

      // Fetch draft posts
      const draftPostsResponse = await fetch('http://127.0.0.1:8000/api/dashboard/posts/?status=draft', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!draftPostsResponse.ok) {
        if (draftPostsResponse.status === 401) {
          router.push('/login');
          return;
        }
        let errorMsg = 'Failed to fetch draft posts';
        try {
          const errorData = await draftPostsResponse.json();
          if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const draftPostsData = await draftPostsResponse.json();
      setDraftPosts(draftPostsData);

      // Fetch comments (logic adapted from ViewPost)
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }
        const commentsResponse = await fetch(`http://127.0.0.1:8000/api/dashboard/comments/?page=${commentsPage}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!commentsResponse.ok) {
          if (commentsResponse.status === 401) {
            router.push('/login');
            return;
          }
          let errorMsg = 'Failed to fetch comments';
          try {
            const errorData = await commentsResponse.json();
            if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
              errorMsg = errorData.detail;
            }
          } catch {}
          throw new Error(errorMsg);
        }

        const data = await commentsResponse.json();
        const normalize = (arr: any[]) => arr.map((c: any) => ({ ...c, is_approved: c.approved }));
        if (Array.isArray(data)) {
          setComments(normalize(data));
        } else if (Array.isArray(data.comments)) {
          setComments(normalize(data.comments));
        } else if (data.results && Array.isArray(data.results)) {
          setComments(normalize(data.results));
        } else {
          setComments(data.comments || []);
        }
        setTotalCommentsPages(data.total_pages || 1);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      }

      // Fetch analytics
      const analyticsResponse = await fetch('http://127.0.0.1:8000/api/dashboard/analytics/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!analyticsResponse.ok) {
        if (analyticsResponse.status === 401) {
          router.push('/login');
          return;
        }
        let errorMsg = 'Failed to fetch analytics';
        try {
          const errorData = await analyticsResponse.json();
          if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = (slug: string) => {
    try {
      router.push(`/dashboard/posts/${slug}/edit`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to navigate to edit post page');
    }
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/posts/${slug}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        let errorMsg = 'Failed to delete post';
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === 'object' && 'detail' in errorData && errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch {}
        setError(errorMsg);
        return;
      }

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-red text-center">
              <p className="text-lg font-medium mb-2">Error</p>
              <p>{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-4 px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Author Dashboard</h1>
            <p className="text-grey">Manage your content and track performance</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button
              onClick={async () => {
                const email = prompt('Send test email to:', 'lagobrian@outlook.com');
                if (!email) return;
                const token = localStorage.getItem('access_token');
                try {
                  const res = await fetch('http://127.0.0.1:8000/api/dashboard/send-test-email/', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  const data = await res.json();
                  alert(res.ok ? data.message : data.error);
                } catch { alert('Failed'); }
              }}
              className="px-4 py-2 border border-gray-600 text-gray-400 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Test Email
            </button>
            <label className="px-4 py-2 border border-[#00ced1]/30 text-[#00ced1] rounded-md cursor-pointer hover:bg-[#00ced1]/10 transition-colors text-sm font-medium">
              Import from Substack
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const token = localStorage.getItem('access_token');
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('http://127.0.0.1:8000/api/dashboard/import-posts/', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Imported ${data.imported} posts!`);
                      fetchDashboardData();
                    } else {
                      alert(data.error || 'Import failed');
                    }
                  } catch (err) {
                    alert('Import failed');
                  }
                  e.target.value = '';
                }}
              />
            </label>
            <Link href="/dashboard/new-post" className="btn-primary px-4 py-2">
              Create New Post
            </Link>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="border-b border-blue/20 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground hover:border-grey/30'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground hover:border-grey/30'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'drafts'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground hover:border-grey/30'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground hover:border-grey/30'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground hover:border-grey/30'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue text-blue'
                  : 'border-transparent text-grey hover:text-foreground hover:border-grey/30'
              }`}
            >
              Users
            </button>
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-gray-300 font-medium mb-2">Total Posts</h3>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-bold">{stats.total_posts}</p>
                      {stats.view_change_pct !== undefined && (
                        <span className={`text-sm font-medium ${stats.view_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                          {stats.view_change_pct >= 0 ? '+' : ''}{stats.view_change_pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">This month</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-gray-300 font-medium mb-2">Total Views</h3>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-bold">{stats.total_views}</p>
                      {stats.view_change_pct !== undefined && (
                        <span className={`text-sm font-medium ${stats.view_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                          {stats.view_change_pct >= 0 ? '+' : ''}{stats.view_change_pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">From last month</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-gray-300 font-medium mb-2">Total Likes</h3>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-bold">{stats.total_likes}</p>
                      {stats.likes_change_pct !== undefined && (
                        <span className={`text-sm font-medium ${stats.likes_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                          {stats.likes_change_pct >= 0 ? '+' : ''}{stats.likes_change_pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">From last month</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-gray-300 font-medium mb-2">Total Comments</h3>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-3xl font-bold">{stats.total_comments}</p>
                      {stats.comments_change_pct !== undefined && (
                        <span className={`text-sm font-medium ${stats.comments_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                          {stats.comments_change_pct >= 0 ? '+' : ''}{stats.comments_change_pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">From last month</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-4 rounded-lg shadow col-span-1">
                    <h3 className="text-gray-300 font-medium mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push('/dashboard/new-post')}
                        className="w-full flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                      >
                        <span className="font-medium text-gray-200">Create a new post</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveTab('posts')}
                        className="w-full flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                      >
                        <span className="font-medium text-gray-200">View all posts</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 110 4v2a2 2 0 002 2h12a2 2 0 002-2v-2a2 2 0 110-4V5a2 2 0 00-2-2H5zM5 11a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setActiveTab('drafts')}
                        className="w-full flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                      >
                        <span className="font-medium text-gray-200">View drafts ({stats.draft_posts})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg shadow col-span-1 md:col-span-2">
                    <h3 className="text-gray-300 font-medium mb-4">Subscribers</h3>
                    <div className="flex items-baseline space-x-2 mb-4">
                      <p className="text-3xl font-bold">{stats.subscriber_count || 0}</p>
                      {stats.subscribers_change_pct !== undefined && (
                        <span className={`text-sm font-medium ${stats.subscribers_change_pct >= 0 ? 'text-green' : 'text-red'}`}>
                          {stats.subscribers_change_pct >= 0 ? '+' : ''}{stats.subscribers_change_pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-4">Active subscribers to your newsletter.</p>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Published Posts</h4>
                        <p className="text-xl font-bold">{stats.published_posts}</p>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Draft Posts</h4>
                        <p className="text-xl font-bold">{stats.draft_posts}</p>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Premium Content</h4>
                        <p className="text-xl font-bold">{stats.premium_posts}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="card mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recent Posts</h2>
                <button onClick={() => setActiveTab('posts')} className="text-blue hover:text-lightBlue transition-colors text-sm">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-grey text-sm border-b border-blue/10">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Views</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.slice(0, 3).map((post) => (
                      <tr key={post.id} className="border-b border-blue/10">
                        <td className="py-4 pr-4">
                          <div className="font-medium">{post.title}</div>
                        </td>
                        <td className="py-4 pr-4 text-sm text-grey">Market Analysis</td>
                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              post.status === 'published'
                                ? 'bg-green/10 text-green'
                                : 'bg-grey/10 text-grey'
                            }`}
                          >
                            {post.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-sm">{post.view.toLocaleString()}</td>
                        <td className="py-4 pr-4 text-sm text-grey">{new Date(post.date).toLocaleDateString()}</td>
                        <td className="py-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditPost(post.slug)}
                              className="text-blue hover:text-lightBlue transition-colors"
                            >
                              Edit
                            </button>
                            {!post.email_sent && post.status === 'published' && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Send "${post.title}" as newsletter to all subscribers?`)) return;
                                  const token = localStorage.getItem('access_token');
                                  try {
                                    const res = await fetch(`http://127.0.0.1:8000/api/dashboard/send-newsletter/${post.slug}/`, {
                                      method: 'POST',
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    const data = await res.json();
                                    alert(res.ok ? data.message : data.error);
                                    if (res.ok) fetchDashboardData();
                                  } catch { alert('Failed to send'); }
                                }}
                                className="text-[#00ced1] hover:text-[#00ced1]/80 transition-colors"
                              >
                                Send Newsletter
                              </button>
                            )}
                            {post.email_sent && (
                              <span className="text-gray-500 text-xs">✓ Sent</span>
                            )}
                            <button
                              onClick={() => handleDeletePost(post.slug)}
                              className="text-red hover:text-lightRed transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard/new-post')}
                    className="flex items-center text-blue hover:text-lightBlue transition-colors w-full text-left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create New Post
                  </button>
                  <button
                    onClick={() => setActiveTab('drafts')}
                    className="flex items-center text-blue hover:text-lightBlue transition-colors w-full text-left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    View Drafts
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className="flex items-center text-blue hover:text-lightBlue transition-colors w-full text-left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    Moderate Comments
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="flex items-center text-blue hover:text-lightBlue transition-colors w-full text-left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    View Analytics
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Email Newsletter</h3>
                <p className="text-grey text-sm mb-4">
                  Send your latest post as an email newsletter to subscribers.
                </p>
                {/* TODO: Implement newsletter sending functionality */}
                <button className="btn-primary w-full py-2" disabled>
                  Prepare Newsletter
                </button>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Subscription Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-grey">Free Subscribers</span>
                      <span>{stats.free_subscribers ?? '—'}</span>
                    </div>
                    <div className="w-full bg-darkBlue/50 rounded-full h-2">
                      <div className="bg-blue h-2 rounded-full" style={{ width: stats.free_subscribers_pct ? `${stats.free_subscribers_pct}%` : '70%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-grey">Paid Subscribers</span>
                      <span>{stats.paid_subscribers ?? '—'}</span>
                    </div>
                    <div className="w-full bg-darkBlue/50 rounded-full h-2">
                      <div className="bg-green h-2 rounded-full" style={{ width: stats.paid_subscribers_pct ? `${stats.paid_subscribers_pct}%` : '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab Content */}
        {activeTab === 'posts' && (
          <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All Posts</h2>
                <div className="flex space-x-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="crypto">Crypto</option>
                    <option value="markets">Markets</option>
                    <option value="quant-finance">Quantitative Finance</option>
                    <option value="trading">Trading</option>
                    <option value="weekly-hedge">Weekly (h)Edge</option>
                    <option value="resources">Resources</option>
                    <option value="ordam">O.R.D.A.M</option>
                    <option value="bad-market-comics">Bad Market Comics</option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Views</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Likes</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Comments</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-700">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                          No posts found. <Link href="/dashboard/new-post" className="text-blue hover:underline">Create one?</Link>
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-md object-cover" src={post.image ? (post.image.startsWith('http') ? post.image : `http://127.0.0.1:8000${post.image}`) : '/placeholder.png'} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium">
                                  <Link href={`/blog/${post.slug}`} className="hover:text-blue">
                                    {post.title}
                                  </Link>
                                </div>
                                <div className="text-sm text-gray-400">{post.excerpt?.substring(0, 60) || 'No excerpt available'}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              post.status === 'published' ? 'bg-green/20 text-green' : 'bg-yellow/20 text-yellow'
                            }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{post.view}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{post.likes_count || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{post.comments_count || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(post.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link href={`/blog/${post.slug}`} className="text-blue hover:text-blue-dark">
                                View
                              </Link>
                              <button
                                onClick={() => handleEditPost(post.slug)}
                                className="text-blue hover:text-blue-dark"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.slug)}
                                className="text-red hover:text-red-dark"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Drafts Tab Content */}
        {activeTab === 'drafts' && (
          <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Draft Posts</h2>
                <button
                  onClick={() => router.push('/dashboard/new-post')}
                  className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
                >
                  New Post
                </button>
              </div>

              {draftPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">You don't have any draft posts yet.</p>
                  <button
                    onClick={() => router.push('/dashboard/new-post')}
                    className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-dark transition-colors"
                  >
                    Create New Post
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {draftPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-md object-cover" src={post.image ? (post.image.startsWith('http') ? post.image : `http://127.0.0.1:8000${post.image}`) : '/placeholder.png'} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium">{post.title}</div>
                                <div className="text-sm text-gray-400">{post.excerpt?.substring(0, 60) || 'No excerpt available'}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(post.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => router.push(`/dashboard/posts/${post.slug}`)}
                                className="text-blue hover:text-blue-dark"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditPost(post.slug)}
                                className="text-blue hover:text-blue-dark"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.slug)}
                                className="text-red hover:text-red-dark"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Tab Content */}
        {activeTab === 'comments' && (
  <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden">
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Comment Moderation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Comment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {comments.length > 0 ? (
              comments.map((comment: any) => (
                <tr key={comment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{comment.user?.username || comment.name || 'Anonymous'}</td>
                  <td className="px-6 py-4 whitespace-pre-line max-w-xs">{comment.content || comment.comment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{new Date(comment.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comment.is_approved ? (
                      <span className="text-green-600 font-semibold">Approved</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {!comment.is_approved && (
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => handleApproveComment(comment.id)}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No comments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && analytics && (
  <>
    <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Analytics</h2>
        <DashboardCharts analytics={analytics} />
      </div>
    </div>
    <div className="bg-gray-900 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-6">Top Performing Posts</h3>
      {analytics.top_posts && analytics.top_posts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-800 text-left text-gray-300 text-base">
                <th className="py-3 px-4 font-semibold">Title</th>
                <th className="py-3 px-4 font-semibold">Views</th>
                <th className="py-3 px-4 font-semibold">Likes</th>
                <th className="py-3 px-4 font-semibold">Comments</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {analytics.top_posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {post.image && (
                        <div className="flex-shrink-0 h-8 w-8 mr-3">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="h-8 w-8 rounded object-cover border border-blue-100 dark:border-slate-800"
                          />
                        </div>
                      )}
                      <div className="truncate max-w-xs font-medium">
                        {post.title}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-blue">{post.view}</td>
                  <td className="py-3 px-4 font-semibold text-green">{post.likes_count}</td>
                  <td className="py-3 px-4 font-semibold text-purple-400">{post.comments_count}</td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/posts/${post.slug}/edit`}
                      className="text-blue hover:underline font-semibold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No post data available</p>
        </div>
      )}
    </div>
  </>
)}

        {activeTab === 'users' && <UsersTab />}

      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [granting, setGranting] = useState<number | null>(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/dashboard/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const grantPremium = async (userId: number, duration: string) => {
    const token = localStorage.getItem('access_token');
    setGranting(userId);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/dashboard/users/grant-premium/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, duration }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch { alert('Failed'); }
    setGranting(null);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8"><div className="animate-spin h-8 w-8 border-t-2 border-[#00ced1] rounded-full mx-auto"></div></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Users ({users.length})</h2>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-[#0e2239] border border-[#18324f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ced1] w-72"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#18324f]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0e2239] text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium text-center">Activity</th>
              <th className="px-4 py-3 font-medium">Premium</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#18324f]">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[#0e2239]/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{u.full_name || u.email.split('@')[0]}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  <div className="flex gap-1 mt-1">
                    {u.is_author && <span className="text-[10px] bg-[#00ced1]/20 text-[#00ced1] px-1.5 py-0.5 rounded">Author</span>}
                    {u.is_analyst && <span className="text-[10px] bg-[#b091cc]/20 text-[#b091cc] px-1.5 py-0.5 rounded">Analyst</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-3 text-xs">
                    <span title="Comments" className="text-gray-400">💬 {u.total_comments}</span>
                    <span title="Likes" className="text-gray-400">❤️ {u.total_likes}</span>
                    <span title="Bookmarks" className="text-gray-400">🔖 {u.total_bookmarks}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.has_active_premium ? (
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-[#00ced1]/20 text-[#00ced1] rounded">
                        Active
                      </span>
                      {u.premium_until && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          Until {new Date(u.premium_until).toLocaleDateString()}
                        </div>
                      )}
                      {!u.premium_until && u.is_premium && (
                        <div className="text-[10px] text-gray-500 mt-1">Lifetime</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Free</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    disabled={granting === u.id}
                    onChange={(e) => {
                      if (e.target.value) {
                        grantPremium(u.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-[#18324f] border border-[#18324f] text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>Grant premium...</option>
                    <option value="1d">1 Day</option>
                    <option value="1w">1 Week</option>
                    <option value="1m">1 Month</option>
                    <option value="3m">3 Months</option>
                    <option value="6m">6 Months</option>
                    <option value="1y">1 Year</option>
                    <option value="2y">2 Years</option>
                    <option value="lifetime">Lifetime</option>
                    {u.has_active_premium && <option value="revoke">❌ Revoke</option>}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">No users found</div>
      )}
    </div>
  );
}