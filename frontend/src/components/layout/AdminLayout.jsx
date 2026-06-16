import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ShieldCheck,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { TopNavbar } from '../layout/top-navbar';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'KYC Queue', path: '/admin/kyc', icon: ShieldCheck },
    { name: 'Fraud Monitoring', path: '/admin/fraud', icon: ShieldAlert },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Wallets', path: '/admin/wallets', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter selection:bg-primary/30">
      <TopNavbar />
      
      <div className="flex pt-20">
        {/* Sidebar */}
        <motion.aside 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 fixed h-[calc(100vh-5rem)] border-r border-slate-200 bg-white hidden md:flex flex-col"
        >
          <div className="p-6 flex-1 flex flex-col">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="font-semibold text-sm">Back to User Dashboard</span>
            </Link>

            <div className="text-xs font-semibold text-slate-500 tracking-wider mb-6 uppercase">
              Admin Operations
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-500'} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
