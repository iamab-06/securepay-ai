import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

export function LandingLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1020] text-white selection:bg-primary/30 font-sans overflow-hidden relative">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[150px] pointer-events-none rounded-full" />
      
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 md:py-8 max-w-[1440px] mx-auto relative z-50 gap-2"
      >
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="bg-primary/20 text-primary p-2 md:p-2.5 rounded-lg md:rounded-xl border border-primary/20 shadow-[0_0_20px_rgba(124,77,255,0.2)]">
            <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <span className="text-xl md:text-3xl font-extrabold tracking-tight">SecurePay <span className="text-primary hidden sm:inline">AI</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-12 text-sm font-semibold text-gray-300">
          <Link to="#" className="hover:text-white transition-colors">Features</Link>
          <Link to="#" className="hover:text-white transition-colors">Security</Link>
          <Link to="#" className="hover:text-white transition-colors">How it works</Link>
          <Link to="#" className="hover:text-white transition-colors">About us</Link>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <Link to="/login" className="text-xs md:text-sm font-semibold text-gray-300 hover:text-white transition-colors">Sign In</Link>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-primary hover:bg-primary/90 text-white rounded-lg md:rounded-xl px-4 md:px-8 h-9 md:h-12 shadow-premium text-xs md:text-sm font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            Get Started
          </Button>
        </div>
      </motion.nav>
      
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
