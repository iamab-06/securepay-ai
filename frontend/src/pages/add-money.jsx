import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, CheckCircle2, Clock, IndianRupee, Loader2, ArrowRight } from 'lucide-react';
import api from '@/services/api';

const AddMoneyPage = () => {
  const { user, refreshUser } = useAuth();
  
  const storageKey = `securepay_active_deposit_${user?.id}`;

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active intent tracking
  const [activeReference, setActiveReference] = useState(() => {
    return localStorage.getItem(storageKey) || null;
  });
  const [intentStatus, setIntentStatus] = useState(null);
  
  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch History
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/deposits');
      setHistory(res.data.data.deposits);
    } catch (e) {
      console.error("Failed to fetch deposit history", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Polling Effect
  useEffect(() => {
    let interval;

    const checkStatus = async () => {
      if (!activeReference) return;
      try {
        const res = await api.get(`/deposits/${activeReference}`);
        const intent = res.data.data.intent;
        setIntentStatus(intent.status);

        if (intent.status === 'COMPLETED') {
          clearInterval(interval);
          setActiveReference(null);
          localStorage.removeItem(storageKey);
          setError(null);
          setSuccessMsg(`Deposit of ₹${intent.amount} was successfully settled!`);
          await refreshUser(); // Global state refresh
          fetchHistory(); // Refresh table
        } else if (intent.status === 'FAILED') {
          clearInterval(interval);
          setActiveReference(null);
          localStorage.removeItem(storageKey);
          setSuccessMsg(null);
          setError('Deposit failed or was rejected by the bank.');
          fetchHistory();
        }
      } catch (err) {
        console.error("Failed to poll status", err);
      }
    };

    if (activeReference) {
      // Check immediately, then every 3 seconds
      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeReference, refreshUser, fetchHistory]);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await api.post('/deposits', { amount: Number(amount) });
      const intent = res.data.data;
      
      setActiveReference(intent.reference);
      localStorage.setItem(storageKey, intent.reference);
      setIntentStatus('PENDING');
      setAmount('');
      fetchHistory(); // Re-fetch to show pending row
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const [simulating, setSimulating] = useState(false);

  const handleSimulateSettlement = async () => {
    if (!activeReference || simulating) return;
    setSimulating(true);
    try {
      await api.post('/webhooks/mock-gateway', {
        securepay_reference: activeReference,
        provider_reference: `EXT-SIM-${Date.now()}`
      });
      // The polling loop will catch the status change naturally
    } catch (err) {
      setSuccessMsg(null);
      setError('Simulation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSimulating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 rounded-full flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'PENDING':
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-500 rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-500 rounded-full flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-500/10 text-slate-500 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Money</h1>
          <p className="text-muted-foreground mt-2">
            Fund your SecurePay wallet via external bank transfer.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">{successMsg}</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Deposit Form */}
        {!activeReference ? (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Initiate Deposit</CardTitle>
              <CardDescription>Enter the amount you wish to add to your wallet.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInitiate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="1000" 
                      className="pl-10 h-12 text-lg"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-md font-semibold" disabled={loading || !amount}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Deposit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Active Tracker */
          <Card className="border-amber-500/50 shadow-sm relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                Awaiting Settlement
              </CardTitle>
              <CardDescription>We are waiting for your bank to clear the transaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-secondary/50 rounded-lg flex justify-between items-center border border-border/50">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-mono font-medium">{activeReference}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-amber-500">{intentStatus || 'PENDING'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Developer Tools</p>
                <Button 
                  variant="outline" 
                  onClick={handleSimulateSettlement} 
                  disabled={simulating || intentStatus === 'COMPLETED'}
                  className="w-full border-dashed"
                >
                  {simulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Simulate Bank Clearance"}
                  {!simulating && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-border/50 bg-secondary/20 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
              <p>Initiate a deposit to generate a secure tracking reference.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
              <p>Transfer funds via your banking provider using the reference.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">3</div>
              <p>Funds are instantly credited to your wallet once the webhook clears.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <div className="pt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4">Deposit History</h2>
        <Card className="border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b border-border/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Reference</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {historyLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No deposits found
                    </td>
                  </tr>
                ) : (
                  history.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-xs">{deposit.reference}</td>
                      <td className="px-6 py-4 text-right font-medium">₹{Number(deposit.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{getStatusBadge(deposit.status)}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {new Date(deposit.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddMoneyPage;
