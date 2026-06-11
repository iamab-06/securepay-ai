import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, ArrowRightLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function SendMoneyPage() {
  const { wallet, refreshUser } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBen, setSelectedBen] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successTxn, setSuccessTxn] = useState(null);

  useEffect(() => {
    api.get('/beneficiaries').then(res => setBeneficiaries(res.data.data.beneficiaries));
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/transfers', {
        beneficiaryId: selectedBen,
        amount,
        description
      });
      await refreshUser();
      setSuccessTxn(res.data.data.transaction);
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const formattedBalance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(wallet?.balance || 0);

  if (successTxn) {
    return (
      <div className="max-w-2xl mx-auto pt-6 md:pt-12 px-2 md:px-0">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-border rounded-3xl md:rounded-[2rem] p-6 md:p-10 flex flex-col items-center text-center shadow-premium relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-success"></div>
          <div className="w-20 h-20 md:w-24 md:h-24 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 shrink-0">
            <CheckCircle2 size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight mb-2">Transfer Successful</h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium mb-8">Your money is on its way instantly and securely.</p>
          
          <div className="w-full bg-background border border-border rounded-2xl p-4 md:p-6 mb-8 text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-border pb-4 gap-2">
              <span className="text-muted-foreground font-bold text-sm">Amount Sent</span>
              <span className="text-2xl font-black text-foreground break-all">₹{successTxn.amount}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-border pb-4 gap-2">
              <span className="text-muted-foreground font-bold text-sm">Reference Number</span>
              <span className="text-xs md:text-sm font-mono text-foreground font-semibold bg-muted px-2 py-1 rounded-md break-all">{successTxn.transaction_reference}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-muted-foreground font-bold text-sm">Status</span>
              <span className="text-sm font-bold text-success flex items-center gap-1.5"><ShieldCheck size={16} /> Verified Secure</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">Send Another</Button>
            <Link to="/dashboard" className="w-full h-12 rounded-xl border border-border flex items-center justify-center text-foreground font-bold hover:bg-muted transition-colors">Back to Dashboard</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 px-2 md:px-0">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Send Money</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1 font-medium">Instantly transfer funds to your beneficiaries.</p>
      </div>

      <Card className="shadow-premium overflow-hidden border-border/50">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-border flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-primary mb-1">AVAILABLE BALANCE</p>
            <h3 className="text-3xl font-black text-foreground">{formattedBalance}</h3>
          </div>
          <div className="bg-primary/20 p-3 rounded-2xl text-primary">
            <ArrowRightLeft size={28} />
          </div>
        </div>
        
        <CardContent className="p-8">
          {error && <div className="text-destructive text-sm font-medium mb-6 bg-destructive/10 p-4 rounded-xl border border-destructive/20">{error}</div>}
          
          <form onSubmit={handleTransfer} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">SELECT BENEFICIARY</label>
              <select 
                required
                value={selectedBen}
                onChange={e => setSelectedBen(e.target.value)}
                className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold appearance-none"
              >
                <option value="" disabled>Choose a recipient...</option>
                {beneficiaries.map(b => (
                  <option key={b.id} value={b.id}>{b.nickname || b.beneficiary.name} ({b.beneficiary.email})</option>
                ))}
              </select>
              {beneficiaries.length === 0 && (
                <p className="text-xs text-destructive mt-2 font-medium">You need to add a beneficiary first. <Link to="/beneficiaries" className="underline">Go to Beneficiaries</Link></p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">AMOUNT (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-foreground">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="w-full pl-10 pr-4 py-4 bg-background border border-border rounded-xl text-2xl font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">DESCRIPTION (OPTIONAL)</label>
              <input 
                type="text" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What's this for?" 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !selectedBen} 
              className="w-full bg-primary hover:bg-primary/90 text-white font-black text-lg h-14 rounded-2xl shadow-[0_10px_30px_rgba(124,77,255,0.3)] mt-4 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Transfer Now'}
              {!loading && <Send size={20} />}
            </Button>
            <p className="text-center text-xs text-muted-foreground font-medium mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-success" /> End-to-end encrypted and secured
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
