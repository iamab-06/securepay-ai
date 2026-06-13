import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, ShieldCheck, Clock, User, Mail, Activity, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState('LOADING');

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const { data } = await api.get('/kyc/status');
        setKycStatus(data.status); // PENDING, UNDER_REVIEW, VERIFIED, REJECTED
      } catch (err) {
        console.error('Failed to fetch KYC status:', err);
        setKycStatus('ERROR');
      }
    };
    fetchKycStatus();
  }, []);

  const getKycBadge = () => {
    switch(kycStatus) {
      case 'VERIFIED':
        return <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm font-bold"><ShieldCheck size={16}/> Verified</div>;
      case 'UNDER_REVIEW':
        return <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-sm font-bold"><Clock size={16}/> Under Review</div>;
      case 'REJECTED':
        return <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-1 rounded-full text-sm font-bold"><ShieldAlert size={16}/> Rejected</div>;
      case 'PENDING':
      default:
        return <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full text-sm font-bold"><AlertTriangle size={16}/> Pending KYC</div>;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'ACTIVE') return 'text-green-500';
    if (status === 'FROZEN') return 'text-blue-500';
    if (status === 'SUSPENDED') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getRiskColor = (tier) => {
    if (tier === 'LOW') return 'text-green-500';
    if (tier === 'MEDIUM') return 'text-orange-400';
    if (tier === 'HIGH' || tier === 'CRITICAL') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, and compliance settings.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-black">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail size={14} /> {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-background rounded-xl">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User size={16}/> Role</span>
              <span className="text-sm font-bold text-foreground">{user?.role}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-xl">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity size={16}/> Account Status</span>
              <span className={`text-sm font-bold ${getStatusColor(user?.status)}`}>{user?.status || 'ACTIVE'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-xl">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ShieldAlert size={16}/> Risk Tier</span>
              <span className={`text-sm font-bold ${getRiskColor(user?.risk_tier)}`}>{user?.risk_tier || 'LOW'}</span>
            </div>
          </div>
        </motion.div>

        {/* KYC & Compliance Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="text-primary" size={24} /> Compliance & Limits
            </h2>
            {getKycBadge()}
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <h3 className="text-sm font-bold text-foreground mb-1">Current Transfer Limits</h3>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Per Transaction:</span>
                <span className="font-bold">₹{kycStatus === 'VERIFIED' ? '1,000,000' : '10,000'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Velocity Limit:</span>
                <span className="font-bold">{kycStatus === 'VERIFIED' ? 'Unlimited' : '₹50,000'}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {kycStatus === 'VERIFIED' 
                ? "Your identity has been verified. You have full access to enterprise transfer limits."
                : "Submit your KYC documents to unlock enterprise transfer limits and secure your account."}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Link to="/settings/kyc" className="w-full">
              <button className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors shadow-premium">
                {kycStatus === 'PENDING' || kycStatus === 'REJECTED' || kycStatus === 'ERROR' ? 'Complete KYC Verification' : 'View KYC Details'}
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
