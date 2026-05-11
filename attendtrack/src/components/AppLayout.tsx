import React from 'react';
import Topbar from '@/components/Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  activePath: '/' | '/admin-dashboard';
}

export default function AppLayout({ children, activePath }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Topbar activePath={activePath} />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8">
        {children}
      </main>
    </div>
  );
}