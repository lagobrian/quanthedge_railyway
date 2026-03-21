'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data for demonstration
const mockStats = {
  posts: 12,
  views: 8432,
  likes: 347,
  comments: 89,
};

const mockPosts = [
  {
    id: 1,
    title: 'Market Outlook: Fed Policy and Inflation Trends',
    category: 'Weekly Market Report',
    status: 'published',
    views: 1243,
    likes: 87,
    comments: 23,
    date: '2023-06-12',
  },
  {
    id: 2,
    title: 'Sector Rotation: Technology to Value Stocks',
    category: 'Supplementary Data',
    status: 'published',
    views: 982,
    likes: 64,
    comments: 18,
    date: '2023-06-05',
  },
  {
    id: 3,
    title: 'Crypto Market Analysis: Bitcoin Halving Cycle',
    category: 'Other',
    status: 'published',
    views: 1567,
    likes: 112,
    comments: 31,
    date: '2023-05-28',
  },
  {
    id: 4,
    title: 'Emerging Markets: Opportunities and Risks',
    category: 'Weekly Market Report',
    status: 'draft',
    views: 0,
    likes: 0,
    comments: 0,
    date: '2023-06-15',
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Author Dashboard</h1>
            <p className="text-grey">Manage your content and track performance</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/dashboard/new-post" className="btn-primary">
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
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <h3 className="text-grey text-sm font-medium mb-2">Total Posts</h3>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{mockStats.posts}</p>
                  <div className="flex items-center text-green text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span>+2 this month</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-grey text-sm font-medium mb-2">Total Views</h3>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{mockStats.views.toLocaleString()}</p>
                  <div className="flex items-center text-green text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span>+12% this month</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-grey text-sm font-medium mb-2">Total Likes</h3>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{mockStats.likes.toLocaleString()}</p>
                  <div className="flex items-center text-green text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span>+8% this month</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-grey text-sm font-medium mb-2">Total Comments</h3>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{mockStats.comments.toLocaleString()}</p>
                  <div className="flex items-center text-green text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span>+15% this month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="card mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recent Posts</h2>
                <Link href="/dashboard/posts" className="text-blue hover:text-lightBlue transition-colors text-sm">
                  View All
                </Link>
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
                    {mockPosts.slice(0, 3).map((post) => (
                      <tr key={post.id} className="border-b border-blue/10">
                        <td className="py-4 pr-4">
                          <div className="font-medium">{post.title}</div>
                        </td>
                        <td className="py-4 pr-4 text-sm text-grey">{post.category}</td>
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
                        <td className="py-4 pr-4 text-sm">{post.views.toLocaleString()}</td>
                        <td className="py-4 pr-4 text-sm text-grey">{post.date}</td>
                        <td className="py-4 text-sm">
                          <div className="flex space-x-2">
                            <Link
                              href={`/dashboard/edit/${post.id}`}
                              className="text-blue hover:text-lightBlue transition-colors"
                            >
                              Edit
                            </Link>
                            <button className="text-grey hover:text-foreground transition-colors">
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/dashboard/new-post"
                    className="flex items-center text-blue hover:text-lightBlue transition-colors"
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
                  </Link>
                  <Link
                    href="/dashboard/drafts"
                    className="flex items-center text-blue hover:text-lightBlue transition-colors"
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
                  </Link>
                  <Link
                    href="/dashboard/comments"
                    className="flex items-center text-blue hover:text-lightBlue transition-colors"
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
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className="flex items-center text-blue hover:text-lightBlue transition-colors"
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
                  </Link>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Email Newsletter</h3>
                <p className="text-grey text-sm mb-4">
                  Send your latest post as an email newsletter to subscribers.
                </p>
                <button className="btn-primary w-full">
                  Prepare Newsletter
                </button>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Subscription Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-grey">Free Subscribers</span>
                      <span>1,245</span>
                    </div>
                    <div className="w-full bg-darkBlue/50 rounded-full h-2">
                      <div className="bg-blue h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-grey">Paid Subscribers</span>
                      <span>532</span>
                    </div>
                    <div className="w-full bg-darkBlue/50 rounded-full h-2">
                      <div className="bg-green h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/subscribers"
                    className="text-blue hover:text-lightBlue transition-colors text-sm block mt-4"
                  >
                    View Subscriber Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab Content */}
        {activeTab === 'posts' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">All Posts</h2>
              <div className="flex space-x-2">
                <select className="input text-sm py-1">
                  <option>All Categories</option>
                  <option>Weekly Market Report</option>
                  <option>Supplementary Data</option>
                  <option>Other</option>
                </select>
                <select className="input text-sm py-1">
                  <option>All Status</option>
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-grey text-sm border-b border-blue/10">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Views</th>
                    <th className="pb-3 font-medium">Likes</th>
                    <th className="pb-3 font-medium">Comments</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPosts.map((post) => (
                    <tr key={post.id} className="border-b border-blue/10">
                      <td className="py-4 pr-4">
                        <div className="font-medium">{post.title}</div>
                      </td>
                      <td className="py-4 pr-4 text-sm text-grey">{post.category}</td>
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
                      <td className="py-4 pr-4 text-sm">{post.views.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-sm">{post.likes.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-sm">{post.comments.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-sm text-grey">{post.date}</td>
                      <td className="py-4 text-sm">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/edit/${post.id}`}
                            className="text-blue hover:text-lightBlue transition-colors"
                          >
                            Edit
                          </Link>
                          <button className="text-grey hover:text-foreground transition-colors">
                            View
                          </button>
                          <button className="text-red hover:text-lightRed transition-colors">
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
        )}

        {/* Comments Tab Content */}
        {activeTab === 'comments' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Recent Comments</h2>
            <p className="text-grey mb-8">
              This section will display recent comments on your posts for moderation.
            </p>
            <div className="flex justify-center">
              <div className="text-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-grey mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-2">Comments Section</h3>
                <p className="text-grey max-w-md">
                  This feature is coming soon. You'll be able to view and moderate comments on your posts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Analytics</h2>
            <p className="text-grey mb-8">
              This section will display detailed analytics about your posts and audience.
            </p>
            <div className="flex justify-center">
              <div className="text-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-grey mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-grey max-w-md">
                  This feature is coming soon. You'll be able to view detailed analytics about your content performance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 