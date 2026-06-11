import React from 'react';
import { Shield, Lock, Users, Building, CheckCircle2, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 pb-20 md:pb-32 overflow-hidden">
      {/* Hero Section */}
      <div className="min-h-[85vh] flex flex-col lg:flex-row items-center gap-12 lg:gap-24 pt-8 lg:pt-0">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="flex-1 space-y-6 md:space-y-10 text-center lg:text-left mt-8 lg:mt-0 w-full"
        >
          <div className="inline-flex items-center gap-3 bg-[#1c2333]/80 border border-primary/30 text-primary px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold backdrop-blur-md shadow-[0_0_30px_rgba(124,77,255,0.15)] mx-auto lg:mx-0">
            <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#7C4DFF]"></span>
            AI-Powered Payment Security
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[96px] font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-white break-words">
            Smarter Payments,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Safer Future.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed font-medium mx-auto lg:mx-0">
            SecurePay AI protects every transaction with real-time risk analysis, scam detection, and AI-powered insights.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-4 md:pt-6 w-full max-w-sm mx-auto lg:mx-0">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 md:px-10 h-14 md:h-16 text-base md:text-lg shadow-[0_10px_40px_rgba(124,77,255,0.3)] font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              Create Account
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto border-gray-700 bg-[#1c2333]/50 text-white hover:bg-white/10 rounded-2xl px-8 md:px-10 h-14 md:h-16 text-base md:text-lg font-bold backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <Play size={20} className="mr-2 shrink-0" />
              Watch Demo
            </Button>
          </div>
        </motion.div>
        
        {/* Right Content - Phone Mockup Centerpiece */}
        <div className="flex-1 w-full flex justify-center lg:justify-end relative h-[500px] sm:h-[600px] lg:h-[800px] items-center mt-12 lg:mt-0 max-w-full">
          {/* Intense Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>
          
          {/* Floating Shield */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-4 sm:right-10 lg:-right-8 top-1/4 bg-gradient-to-br from-[#7C4DFF] to-[#512da8] rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(124,77,255,0.4)] z-30 transform rotate-12 border border-white/20 scale-75 md:scale-100"
          >
            <Lock className="text-white w-12 h-12 md:w-16 md:h-16" strokeWidth={1.5} />
            <div className="absolute -bottom-6 -left-6 bg-success text-white rounded-full p-2 md:p-3 border-[6px] border-[#0B1020] shadow-xl">
              <CheckCircle2 size={24} className="md:w-8 md:h-8" strokeWidth={3} />
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="w-[280px] sm:w-[320px] md:w-[380px] h-[560px] sm:h-[640px] md:h-[760px] bg-gradient-to-b from-[#2a3552] to-[#0d1326] rounded-[2.5rem] md:rounded-[3.5rem] p-2 md:p-3 relative z-20 shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-gray-700/50"
          >
            {/* Inner Phone Screen */}
            <div className="w-full h-full bg-[#0B1020] rounded-[2rem] md:rounded-[3rem] relative overflow-hidden flex flex-col border border-gray-800">
               {/* Notch */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 md:w-40 h-6 md:h-7 bg-black rounded-b-xl md:rounded-b-2xl z-10"></div>
               
               {/* Screen Top Nav */}
               <div className="mt-10 md:mt-12 mb-6 md:mb-8 text-center px-4 md:px-6">
                 <span className="text-base md:text-lg font-extrabold tracking-tight">SecurePay <span className="text-primary">AI</span></span>
               </div>

               {/* Screen Main Content */}
               <div className="flex-1 flex flex-col items-center justify-center pb-24 md:pb-32 px-4 md:px-6">
                 <div className="w-full bg-gradient-to-b from-[#1c2333] to-[#121826] border border-gray-700/50 rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
                    <p className="text-gray-400 text-xs md:text-sm mb-2 font-medium text-center">Transaction Protected</p>
                    <p className="text-gray-500 text-[10px] md:text-xs mb-4 md:mb-6">Your payment of</p>
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-4">₹25K</h3>
                    <p className="text-success text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 text-center">
                       <Shield size={14} className="md:w-4 md:h-4" /> has been secured
                    </p>
                 </div>
               </div>

               {/* Bottom Glow */}
               <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 bg-gradient-to-t from-primary/30 to-transparent blur-xl md:blur-2xl"></div>
            </div>
          </motion.div>

          {/* Platform Pedestal */}
          <div className="absolute bottom-[-20px] md:bottom-0 lg:bottom-12 w-[300px] md:w-[500px] h-[80px] md:h-[120px] bg-gradient-to-t from-[#0B1020] to-[#161d2e] rounded-[100%] shadow-[0_-20px_80px_rgba(124,77,255,0.15)] z-0 flex items-center justify-center border-t border-white/5">
             <div className="w-[200px] md:w-[400px] h-[40px] md:h-[80px] bg-[#1a233a] rounded-[100%] border-t border-white/10 shadow-inner"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] md:w-[300px] h-[30px] md:h-[60px] bg-primary/10 rounded-[100%] blur-md"></div>
          </div>
        </div>
      </div>
      
      {/* Feature Cards Grid */}
      <motion.div 
        id="how-it-works"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-40 mt-12 scroll-mt-24"
      >
        {[
          { icon: Lock, title: "Bank-Level Security", subtitle: "256-bit Encryption" },
          { icon: Shield, title: "AI Risk Detection", subtitle: "Real-time Monitoring" },
          { icon: Users, title: "Trusted by 10K+", subtitle: "Users Nationwide" },
          { icon: Building, title: "RBI Compliant", subtitle: "100% Secure" }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-[#1c2333]/80 to-[#121826]/80 border border-gray-700/50 p-8 rounded-[2rem] flex items-center gap-6 backdrop-blur-xl shadow-xl hover:shadow-[0_10px_30px_rgba(124,77,255,0.1)] hover:border-primary/30 transition-colors"
          >
             <div className="bg-[#0B1020] p-4 rounded-2xl border border-gray-800">
                <feature.icon className="text-gray-300 w-8 h-8" strokeWidth={1.5} />
             </div>
             <div>
               <h4 className="font-bold text-white text-lg">{feature.title}</h4>
               <p className="text-sm text-gray-400 font-medium mt-1">{feature.subtitle}</p>
             </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
