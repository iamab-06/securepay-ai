import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import RiskScoreCard from '../components/ui/risk-score-card';
import FraudInsights from '../components/ui/fraud-insights';
import api from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function SecurityPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/security/risk-profile')
      .then(res => setProfile(res.data?.data))
      .catch(err => console.error('Failed to load risk profile', err))
      .finally(() => setIsLoading(false));
  }, []);

  const score = profile?.score || 0;
  
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Security Center</h1>
        <p className="text-muted-foreground mt-1">AI-powered risk analysis and account protection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-1">
          <RiskScoreCard score={score} isLoading={isLoading} />
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2">
          <FraudInsights insights={profile?.insights} isLoading={isLoading} />
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Risk Assessments</CardTitle>
            <CardDescription>The last 10 security scans performed on your transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.history?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Score</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Flagged Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profile.history.map((h, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{h.transaction?.transaction_reference}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${h.transaction?.status === 'BLOCKED' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                            {h.transaction?.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">{h.risk_score}</td>
                        <td className="px-4 py-3">
                          {h.flagged_rules.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {h.flagged_rules.map(r => (
                                <span key={r} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning">{r.replace(/_/g, ' ')}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent security events.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
