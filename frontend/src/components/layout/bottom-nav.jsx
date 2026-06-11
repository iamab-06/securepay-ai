import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Send, PlusCircle, History } from 'lucide-react';
import { cn } from '../../utils/cn';

const bottomNavItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Send', href: '/send-money', icon: Send },
  { name: 'Add', href: '/add-money', icon: PlusCircle },
  { name: 'History', href: '/transactions', icon: History },
];

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] font-semibold", isActive ? "font-bold" : "")}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
