import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { TopNavbar } from './top-navbar';
import { BottomNav } from './bottom-nav';

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background pt-[env(safe-area-inset-top)] overflow-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 relative">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
