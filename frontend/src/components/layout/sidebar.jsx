import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  PlusCircle,
  History,
  Users,
  BrainCircuit,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Send Money', href: '/send-money', icon: Send },
  { name: 'Add Money', href: '/add-money', icon: PlusCircle },
  { name: 'Transactions', href: '/transactions', icon: History },
  { name: 'Beneficiaries', href: '/beneficiaries', icon: Users },
  { name: 'Ledger Audit', href: '/admin', icon: ShieldCheck },
  { name: 'AI Insights', href: '/insights', icon: BrainCircuit },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const auth = useAuth();

  const user = auth?.user ?? null;
  const isLoading = auth?.authState === 'loading';

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="flex flex-col w-[260px] bg-card border-r border-border h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-8 h-[88px]">
        <div className="bg-primary text-white p-2 rounded-xl shadow-[0_4px_12px_rgba(124,77,255,0.3)]">
          <ShieldCheck size={24} strokeWidth={2.5} />
        </div>

        <span className="text-xl font-black tracking-tight text-foreground">
          SecurePay <span className="text-primary">AI</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.filter(item => !(item.href === '/admin' && user?.role !== 'ADMIN')).map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-bold transition-all',
                isActive
                  ? 'bg-primary text-white shadow-[0_4px_20px_rgba(124,77,255,0.25)] translate-x-1'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-muted/50 transition-colors">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${
              user?.name || 'Guest'
            }`}
            alt="User Avatar"
            className="w-11 h-11 rounded-full bg-muted border-2 border-background shadow-sm"
          />

          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">
              {isLoading
                ? 'Loading...'
                : user?.name || 'Guest User'}
            </span>

            <span className="text-xs text-muted-foreground font-medium truncate">
              {isLoading
                ? 'Authenticating...'
                : user?.role === 'ADMIN'
                ? 'Administrator'
                : user
                ? 'Premium User'
                : 'Not Signed In'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}