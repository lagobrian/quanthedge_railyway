'use client';

import React from 'react';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';


export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogoutClick = () => {
    dispatch(logout());
    router.push('/');
  };
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isPremium = user?.is_premium;
  const isAuthor = user?.is_author;
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-background border-b border-blue/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue">Quant (h)Edge</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/models" 
              className={`text-sm hover:text-blue transition-colors ${
                pathname === '/models' ? 'text-blue' : 'text-foreground'
              }`}
            >
              Models
            </Link>
            <Link 
              href="/backtests" 
              className={`text-sm hover:text-blue transition-colors ${
                pathname === '/backtests' ? 'text-blue' : 'text-foreground'
              }`}
            >
              Backtests
            </Link>
            <Link 
              href="/blog" 
              className={`text-sm hover:text-blue transition-colors ${
                pathname === '/blog' ? 'text-blue' : 'text-foreground'
              }`}
            >
              Blog
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm hover:text-blue transition-colors ${
                pathname === '/pricing' ? 'text-blue' : 'text-foreground'
              }`}
            >
              Pricing
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isPremium && (
  <span className="text-xs bg-blue/10 text-blue px-2 py-1 rounded">
    Premium
  </span>
)}
<NotificationDropdown />
<Link 
  href="/profile" 
  className="text-sm px-4 py-2 rounded-md border border-blue/20 hover:bg-blue/10 transition-colors"
>
  Profile
</Link>
{isAuthor && (
  <Link 
    href="/dashboard" 
    className="text-sm px-4 py-2 rounded-md border border-blue/20 hover:bg-blue/10 transition-colors"
  >
    Dashboard
  </Link>
)}
<button
  onClick={handleLogoutClick}
  className="text-sm px-4 py-2 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
>
  Logout
</button>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm px-4 py-2 rounded-md border border-blue/20 hover:bg-blue/10 transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm px-4 py-2 rounded-md bg-blue text-white hover:bg-blue-dark transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-blue/10 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue/10">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/models" 
                className={`text-sm hover:text-blue transition-colors ${
                  pathname === '/models' ? 'text-blue' : 'text-foreground'
                }`}
              >
                Models
              </Link>
              <Link 
                href="/backtests" 
                className={`text-sm hover:text-blue transition-colors ${
                  pathname === '/backtests' ? 'text-blue' : 'text-foreground'
                }`}
              >
                Backtests
              </Link>
              <Link 
                href="/blog" 
                className={`text-sm hover:text-blue transition-colors ${
                  pathname === '/blog' ? 'text-blue' : 'text-foreground'
                }`}
              >
                Blog
              </Link>
              <Link 
                href="/pricing" 
                className={`text-sm hover:text-blue transition-colors ${
                  pathname === '/pricing' ? 'text-blue' : 'text-foreground'
                }`}
              >
                Pricing
              </Link>
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 text-sm px-4 py-2 rounded-md hover:bg-muted transition-colors w-fit"
              >
                {theme === 'dark' ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg><span>Light Mode</span></>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg><span>Dark Mode</span></>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  {isPremium && (
                    <span className="text-xs bg-blue/10 text-blue px-2 py-1 rounded w-fit">
                      Premium
                    </span>
                  )}
                  <Link 
                    href="/profile" 
                    className="text-sm px-4 py-2 rounded-md border border-blue/20 hover:bg-blue/10 transition-colors w-fit"
                  >
                    Profile
                  </Link>
                  {isAuthor && (
                    <Link 
                      href="/dashboard" 
                      className="text-sm px-4 py-2 rounded-md border border-blue/20 hover:bg-blue/10 transition-colors w-fit"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogoutClick}
                    className="text-sm px-4 py-2 rounded-md border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors w-fit"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-sm px-4 py-2 rounded-md border border-blue/20 hover:bg-blue/10 transition-colors w-fit"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/register" 
                    className="text-sm px-4 py-2 rounded-md bg-blue text-white hover:bg-blue-dark transition-colors w-fit"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}