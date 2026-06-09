import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, ArrowRightLeft, ShieldAlert, Zap, Plus, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetricCard } from '../components/ui/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { SpendingOverviewChart } from '../components/ui/spending-chart';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import RiskScoreCard from '../components/ui/risk-score-card';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const { user, wallet, authState } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [riskProfile, setRiskProfile] = useState({ score: 0, insights: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      api.get('/transactions'),
      api.get('/security/risk-profile')
    ])
    .then(([txnRes, riskRes]) => {
      setTransactions(txnRes.data?.data?.transactions || []);
      setRiskProfile(riskRes.data?.data || { score: 0, insights: [] });
    })
    .catch(err => console.error('Failed to load dashboard data', err))
    .finally(() => setIsLoading(false));
  }, []);

  const formattedBalance = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(wallet?.balance || 0);

  const outgoings = transactions.filter(txn => txn?.sender_wallet_id === wallet?.id && txn?.status === 'SUCCESS');
  const monthlySpend = outgoings.reduce((sum, txn) => sum + Number(txn?.amount || 0), 0);
  
  const formattedSpend = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(monthlySpend);

  const breakdownMap = {};
  outgoings.forEach(txn => {
    const receiverName = txn?.receiver?.user?.name || 'Unknown User';
    breakdownMap[receiverName] = (breakdownMap[receiverName] || 0) + Number(txn?.amount || 0);
  });

  const colors = ['#7C4DFF', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
  
  const categoryBreakdown = Object.keys(breakdownMap)
    .map((name, index) => ({
      name,
      value: breakdownMap[name],
      amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(breakdownMap[name]),
      percentage: monthlySpend > 0 ? Math.round((breakdownMap[name] / monthlySpend) * 100) + '%' : '0%',
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1600px] mx-auto w-full"
    >
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}><MetricCard title="Wallet Balance" value={formattedBalance} subtitle={wallet?.wallet_number || 'Loading...'} icon={Wallet} iconBgClass="bg-primary/10 text-primary" /></motion.div>
        <motion.div variants={itemVariants}><MetricCard title="This Month Spent" value={formattedSpend} icon={CreditCard} trend="none" trendValue="" iconBgClass="bg-primary/10 text-primary" /></motion.div>
        <motion.div variants={itemVariants}><MetricCard title="Transactions" value={outgoings.length.toString()} icon={ArrowRightLeft} trend="up" trendValue={`+${outgoings.length}`} iconBgClass="bg-primary/10 text-primary" /></motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard 
            title="Risk Score" 
            value={`${riskProfile.score}/100`} 
            subtitle={riskProfile.score < 50 ? "Low Risk" : riskProfile.score < 80 ? "Medium Risk" : "High Risk"} 
            icon={ShieldAlert} 
            iconBgClass={riskProfile.score < 50 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"} 
            subtitleClass={riskProfile.score < 50 ? "text-success" : "text-destructive"} 
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {isLoading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted rounded"></div>
                          <div className="h-3 w-16 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-4 w-16 bg-muted rounded ml-auto"></div>
                        <div className="h-3 w-12 bg-muted rounded ml-auto"></div>
                      </div>
                    </div>
                  ))
                ) : transactions?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No recent transactions.</p>
                ) : (
                  transactions.map((txn, i) => {
                    const isOut = txn?.sender_wallet_id === wallet?.id;
                    const counterparty = isOut ? (txn?.receiver?.user?.name || 'Unknown User') : (txn?.sender?.user?.name || 'Unknown User');
                    return (
                      <div key={txn?.id || i} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOut ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                            <ArrowRightLeft size={16} className={isOut ? 'rotate-45' : '-rotate-45'} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{isOut ? 'To' : 'From'} {counterparty}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{txn?.created_at ? new Date(txn.created_at).toLocaleDateString() : 'Recent'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-foreground">₹{txn?.amount || '0.00'}</p>
                          <p className="text-xs text-success font-medium mt-0.5">{txn?.status || 'UNKNOWN'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <Link to="/transactions" className="text-primary text-sm font-semibold hover:underline w-full block text-left mt-4 pt-4 border-t">
                View All Transactions
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Overview */}
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Spending Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <div className="min-h-[220px]">
                <SpendingOverviewChart data={categoryBreakdown} total={formattedSpend} />
              </div>
              <div className="space-y-3 mt-4">
                {categoryBreakdown.length > 0 ? categoryBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                      <span className="text-muted-foreground font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">{item.amount}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{item.percentage}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Make your first transfer to see insights.</p>
                )}
              </div>
              <button className="text-primary text-sm font-semibold hover:underline w-full text-left mt-6 pt-4 border-t">
                View Full Report
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Stack */}
        <motion.div variants={itemVariants} className="xl:col-span-1 flex flex-col gap-6">
          {/* Risk Score Widget */}
          <div>
            <RiskScoreCard score={riskProfile.score} isLoading={isLoading} />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ArrowRightLeft size={18} className="-rotate-45" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Send Money</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                  <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Add Money</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Scan & Pay</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
