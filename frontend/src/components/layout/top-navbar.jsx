import { Search, Send, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';

export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-[72px] md:h-[88px] bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-10 sticky top-0 z-20 shrink-0"
      >
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 -ml-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-xl md:text-[28px] font-black tracking-tight text-foreground hidden sm:block">Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-8 flex-1 sm:flex-none justify-end">
          <div className="relative group flex-1 max-w-[200px] sm:max-w-[340px]">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-card border border-border rounded-full text-sm md:text-[15px] font-medium w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
          
          <Button className="hidden lg:flex rounded-full gap-2.5 shadow-premium px-6 h-12 text-[15px] font-bold">
            <Send size={18} strokeWidth={2.5} />
            Send Money
          </Button>

          <button onClick={handleLogout} className="p-2 md:p-3 text-muted-foreground hover:text-destructive transition-all bg-card border border-border rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 ml-1 md:ml-2 shrink-0" title="Logout">
            <LogOut size={20} strokeWidth={2.5} />
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card border-r border-border md:hidden pt-[env(safe-area-inset-top)] flex flex-col"
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-full"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
              <div className="flex-1 overflow-y-auto">
                <Sidebar isMobile />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
