import { Search, Send, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="h-[88px] bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-10 sticky top-0 z-10"
    >
      <div className="flex items-center gap-4">
        <h1 className="text-[28px] font-black tracking-tight text-foreground">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search transactions, users..." 
            className="pl-12 pr-4 py-3 bg-card border border-border rounded-full text-[15px] font-medium w-[340px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
        
        <Button className="rounded-full flex gap-2.5 shadow-premium px-6 h-12 text-[15px] font-bold">
          <Send size={18} strokeWidth={2.5} />
          Send Money
        </Button>

        <button onClick={handleLogout} className="p-3 text-muted-foreground hover:text-destructive transition-all bg-card border border-border rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 ml-2" title="Logout">
          <LogOut size={20} strokeWidth={2.5} />
        </button>
      </div>
    </motion.header>
  );
}
