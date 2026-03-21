'use client';

import AuthorRoute from '@/components/AuthorRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthorRoute>{children}</AuthorRoute>;
}
