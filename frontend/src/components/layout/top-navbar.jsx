import { Search, Send, LogOut, Menu, X, Bell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './sidebar';
import api from '../../services/api';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        
        <div className="flex items-center gap-2 md:gap-6 flex-1 sm:flex-none justify-end">
          <div className="relative group flex-1 max-w-[200px] sm:max-w-[340px] mr-2">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-card border border-border rounded-full text-sm md:text-[15px] font-medium w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-muted-foreground hover:text-foreground transition-all bg-card border border-border rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0"
            >
              <Bell size={20} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-destructive text-destructive-foreground text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-premium overflow-hidden z-50 flex flex-col max-h-[400px]"
                >
                  <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
                    <h3 className="font-bold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        <CheckCircle2 size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                        No new notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notif) => (
                          <Link 
                            key={notif.id}
                            to={notif.action_url || '#'}
                            onClick={(e) => {
                              if (!notif.action_url) e.preventDefault();
                              if (!notif.is_read) markAsRead(notif.id, e);
                            }}
                            className={`block p-4 hover:bg-background transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className={`text-sm font-bold ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                {timeAgo(notif.created_at)}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground line-clamp-2">
                              {notif.message}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <Button className="hidden lg:flex rounded-full gap-2.5 shadow-premium px-6 h-12 text-[15px] font-bold">
            <Send size={18} strokeWidth={2.5} />
            Send
          </Button>

          <button onClick={handleLogout} className="p-2.5 text-muted-foreground hover:text-destructive transition-all bg-card border border-border rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0" title="Logout">
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
