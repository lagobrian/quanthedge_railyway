"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { API_BASE } from '@/lib/api';

interface Notification {
  id: number;
  message: string;
  is_seen: boolean;
  seen: boolean;
  date: string;
  type?: string;
  post?: any;
}

export default function NotificationDropdown() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.map((n: any) => ({ ...n, seen: n.is_seen ?? n.seen })));
      }
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  // Mark as seen
  const markNotificationsSeen = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    await fetch(`${API_BASE}/api/notifications/mark-seen/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    // Optionally update state
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  };

  // Poll notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000); // 30s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);

  // Open/close dropdown
  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open) markNotificationsSeen();
  };

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.seen).length;

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-blue/10 transition-colors"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        <svg
          className="h-6 w-6 text-blue"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-card shadow-xl rounded-lg z-50 overflow-y-auto border border-border">
          <div className="px-4 py-3 border-b border-border font-semibold text-foreground text-sm">Notifications</div>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
              No notifications yet
            </div>
          ) : (
            <ul>
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`px-4 py-3 border-b border-border text-sm cursor-pointer transition-colors ${
                    !notif.seen
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="text-foreground leading-snug">
                    {notif.message || `${notif.type || 'Notification'}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(notif.date).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
