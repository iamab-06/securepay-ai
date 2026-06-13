import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, ShieldAlert, HeartPulse, BrainCircuit, CreditCard } from 'lucide-react';
import api from '../services/api';
import { MetricCard } from '../components/ui/metric-card';

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data } = await api.get('/user/insights');
      setInsights(data.data);
    } catch (err) {
      console.error('Failed to fetch AI Insights', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-white/50 animate-pulse">Running Intelligence Engine...</div>;
  }

  if (!insights) {
    return <div className="p-8 text-center text-red-400">Failed to load insights.</div>;
  }

  const { spending, risk, fraud, health, observations } = insights;

  // Determine trend styling
  const trendColor = spending.trend.direction === 'UP' ? 'text-green-500' : spending.trend.direction === 'DOWN' ? 'text-blue-500' : 'text-white/50';
  const TrendIcon = spending.trend.direction === 'UP' ? TrendingUp : spending.trend.direction === 'DOWN' ? TrendingDown : Activity;

  // Determine Health color
  const healthColor = health.score >= 80 ? 'text-green-500' : health.score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit size={32} className="text-primary" />
            AI Insights
          </h1>
          <p className="text-white/50 mt-1">Real-time intelligence and algorithmic profile evaluation.</p>
        </div>
        
        <div className={`flex flex-col items-end px-6 py-3 rounded-2xl border border-white/5 bg-[#121216] shadow-lg`}>
          <span className="text-xs font-semibold uppercase text-white/50 mb-1 flex items-center gap-1"><HeartPulse size={12}/> Account Health Score</span>
          <div className={`text-4xl font-bold ${healthColor}`}>
            {health.score}<span className="text-lg text-white/30">/100</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Current Month Volume" 
          value={`₹${spending.currentMonthVolume.toLocaleString()}`} 
          icon={CreditCard}
          trend={spending.trend.percentage > 0 ? (spending.trend.direction === 'UP' ? 'up' : 'down') : null}
          trendValue={spending.trend.percentage > 0 ? `${spending.trend.percentage}%` : null}
          subtitle={spending.trend.percentage === 0 ? 'No prior data' : null}
        />
        
        <MetricCard 
          title="Algorithmic Risk Score" 
          value={risk.latestScore.toString()} 
          icon={Activity}
          subtitle={`Tier: ${risk.tier} (${risk.trend})`}
          iconBgClass={risk.latestScore > 50 ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"}
        />
        
        <MetricCard 
          title="Active Fraud Alerts" 
          value={fraud.activeAlerts.toString()} 
          icon={ShieldAlert}
          subtitle={`${fraud.resolvedAlerts} resolved historically`}
          iconBgClass={fraud.activeAlerts > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}
        />

        <MetricCard 
          title="Spending Trend" 
          value={spending.trend.direction} 
          icon={TrendIcon}
          subtitle={`${spending.trend.percentage}% volatility`}
        />
      </div>

      {/* AI Observations & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Observations Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121216] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BrainCircuit size={20} className="text-primary" />
            AI Observations
          </h2>
          <div className="space-y-4">
            {observations.length === 0 ? (
              <p className="text-white/50 text-sm">Waiting for more data to generate observations.</p>
            ) : (
              observations.map((obs, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  <p className="text-sm text-white/80 leading-relaxed">{obs}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Diagnostic Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#121216] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-white/70" />
            Health Diagnostics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-white/60">KYC Compliance</span>
              <span className={`text-sm font-semibold ${health.kycStatus === 'VERIFIED' ? 'text-green-500' : 'text-yellow-500'}`}>
                {health.kycStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-white/60">User Account Status</span>
              <span className={`text-sm font-semibold ${health.accountStatus === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                {health.accountStatus}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-white/60">Wallet Operations</span>
              <span className={`text-sm font-semibold ${health.walletStatus === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                {health.walletStatus}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-white/60">Historical Fraud Flags</span>
              <span className="text-sm font-semibold text-white/80">
                {fraud.historicalAlerts} Lifetime
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
