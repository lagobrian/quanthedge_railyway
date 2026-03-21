import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import StoreProvider from '@/providers/StoreProvider';

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
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <StoreProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster position="bottom-right" />
        </StoreProvider>
      </body>
    </html>
  );
}