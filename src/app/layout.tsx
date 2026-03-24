import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import StoreProvider from '@/providers/StoreProvider';
import ThemeProvider from '@/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quant (h)Edge - Financial Analysis & Market Insights',
  description: 'Discover advanced financial models, backtests, and market insights with Quant (h)Edge - your edge in quantitative finance.',
  keywords: 'quantitative finance, financial models, backtests, market analysis, trading strategies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.toggle('dark', theme === 'dark');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased transition-colors duration-300">
        <ThemeProvider>
          <StoreProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <ProfileCompletionBanner />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster position="bottom-right" />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}