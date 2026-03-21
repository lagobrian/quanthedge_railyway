export interface Profile {
  id: number;
  image: string;
  full_name: string;
  bio: string | null;
  about: string | null;
  country: string | null;
  twitter: string | null;
  linkedin: string | null;
  is_author: boolean;
  is_premium: boolean;
  date: string;
  user: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_premium: boolean;
}

export interface Post {
  id: number;
  title: string;
  description: string;
  excerpt: string | null;
  image: string;
  status: 'Draft' | 'Published' | 'Disabled';
  view: number;
  slug: string;
  date: string;
  tags: string | null;
  is_premium: boolean;
  send_as_email: boolean;
  email_sent: boolean;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  user: User;
  profile: Profile;
  is_pinned?: boolean; // Added for pin/feature functionality
}

export interface CommentUser {
  id: number;
  username: string;
  profile: {
    image: string | null;
  };
}

export interface Comment {
  id: number;
  content: string;
  user: CommentUser;
  date: string;
  likes_count: number;
  replies_count: number;
  replies?: Comment[];
  is_liked: boolean;
  is_author: boolean;
  is_post_author: boolean;
  hidden: boolean;
}
