import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B1020] flex flex-col gap-6 items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <div className="bg-card border border-primary/20 p-4 rounded-2xl relative shadow-[0_0_40px_rgba(124,77,255,0.15)]">
            <ShieldCheck size={40} strokeWidth={2} className="text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">Securing your session...</h3>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Validating credentials</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback network error gracefully
  if (authState === 'error') {
    return (
      <div className="min-h-screen bg-[#0B1020] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-foreground mb-4">Connection Failed</h2>
          <p className="text-muted-foreground mb-8">We could not verify your session. Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-primary text-white py-3 rounded-xl font-bold">Retry Connection</button>
        </div>
      </div>
    );
  }

  return authState === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
}
