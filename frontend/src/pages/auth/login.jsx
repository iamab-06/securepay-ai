import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex flex-col justify-center items-center relative overflow-hidden px-4 md:px-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] pointer-events-none rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] px-6 py-8 md:px-8 md:py-10 bg-[#1c2333]/80 border border-gray-700/50 backdrop-blur-xl shadow-2xl rounded-3xl md:rounded-[2.5rem] relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary/20 text-primary p-3 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(124,77,255,0.2)] mb-6">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 font-medium">Log in to your SecurePay AI account</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0B1020] border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-semibold text-gray-300">Password</label>
              <Link to="#" className="text-xs text-primary font-bold hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0B1020] border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            disabled={isLoading}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-[0_10px_30px_rgba(124,77,255,0.3)] font-bold text-lg mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'} 
            {!isLoading && <ArrowRight size={20} />}
          </Button>
        </form>

        <p className="text-center text-gray-400 mt-8 text-sm font-medium">
          Don't have an account? <Link to="/register" className="text-white font-bold hover:text-primary transition-colors">Create account</Link>
        </p>
      </motion.div>
    </div>
  );
}
