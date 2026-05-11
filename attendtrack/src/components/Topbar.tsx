import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

interface TopbarProps {
  activePath: '/' | '/admin-dashboard';
}

export default function Topbar({ activePath }: TopbarProps) {
  const navItems = [
    { label: 'Employee Check-In', href: '/' },
    { label: 'Admin Dashboard', href: '/admin-dashboard' },
  ];

  return (
    <header className="w-full bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <AppLogo size={36} />
          <span className="font-bold text-lg text-foreground tracking-tight hidden sm:block">
            AttendTrack
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={`nav-${item.href}`}
              href={item.href}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                activePath === item.href
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}