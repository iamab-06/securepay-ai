import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Wallet, ShieldAlert, FileSearch, ShieldCheck, FileX, AlertTriangle, Activity } from 'lucide-react';
import api from '../../services/api';
import { MetricCard } from '../../components/ui/metric-card';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/admin/system-status');
        setStats(data.data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-1">Real-time enterprise metrics and compliance status.</p>
      </motion.div>

      {/* KYC Compliance Row */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="text-primary" size={20} />
          KYC Compliance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Pending Verification"
            value={stats.kyc.pending}
            icon={FileSearch}
            trend={{ value: 0, label: 'Requires Action', isPositive: false }}
          />
          <MetricCard
            title="Approved"
            value={stats.kyc.approved}
            icon={ShieldCheck}
            trend={{ value: 0, label: 'Total Verified', isPositive: true }}
          />
          <MetricCard
            title="Rejected"
            value={stats.kyc.rejected}
            icon={FileX}
            trend={{ value: 0, label: 'Failed Checks', isPositive: false }}
          />
        </div>
      </motion.div>

      {/* Risk & Safety Row */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 mt-8">
          <AlertTriangle className="text-orange-500" size={20} />
          Risk & Fraud Prevention
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="High Risk Users"
            value={stats.risk.high}
            icon={ShieldAlert}
            trend={{ value: 0, label: 'Needs monitoring', isPositive: false }}
          />
          <MetricCard
            title="Critical Risk Users"
            value={stats.risk.critical}
            icon={AlertTriangle}
            trend={{ value: 0, label: 'Action required', isPositive: false }}
          />
          <MetricCard
            title="Frozen Users"
            value={stats.frozen.users}
            icon={Users}
            trend={{ value: 0, label: 'Suspended accounts', isPositive: true }}
          />
          <MetricCard
            title="Frozen Wallets"
            value={stats.frozen.wallets}
            icon={Wallet}
            trend={{ value: 0, label: 'Locked funds', isPositive: true }}
          />
        </div>
      </motion.div>

      {/* Infrastructure Row */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 mt-8">
          <Activity className="text-green-500" size={20} />
          Ledger Infrastructure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Users"
            value={stats.users}
            icon={Users}
            trend={{ value: 0, label: 'Active profiles', isPositive: true }}
          />
          <MetricCard
            title="Active Wallets"
            value={stats.wallets - stats.frozen.wallets}
            icon={Wallet}
            trend={{ value: 0, label: 'System wide', isPositive: true }}
          />
          <MetricCard
            title="Ledger Health"
            value={stats.integrityStatus}
            icon={Activity}
            trend={{ value: 0, label: 'Double-entry balance', isPositive: stats.integrityStatus === 'HEALTHY' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
