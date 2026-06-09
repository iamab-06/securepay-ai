import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import api from '../services/api';

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBeneficiaries = async () => {
    try {
      const res = await api.get('/beneficiaries');
      setBeneficiaries(res.data?.data?.beneficiaries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/beneficiaries', { targetEmail: email, nickname });
      setSuccess('Beneficiary added successfully!');
      setEmail('');
      setNickname('');
      fetchBeneficiaries();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add beneficiary');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return;
    try {
      await api.delete(`/beneficiaries/${id}`);
      fetchBeneficiaries();
    } catch (err) {
      alert('Failed to remove beneficiary');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Beneficiaries</h2>
          <p className="text-muted-foreground mt-1 font-medium">Manage your trusted contacts for quick transfers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Add New
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-destructive text-sm font-medium mb-4 bg-destructive/10 p-3 rounded-xl">{error}</div>}
            {success && <div className="text-success text-sm font-medium mb-4 bg-success/10 p-3 rounded-xl">{success}</div>}
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">USER EMAIL</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter exact email" 
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">NICKNAME (OPTIONAL)</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="e.g. Rent, Mom, Groceries" 
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>
              <Button type="submit" disabled={adding} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 rounded-xl shadow-premium mt-2">
                {adding ? <Loader2 className="animate-spin" size={18} /> : 'Save Beneficiary'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Your Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : beneficiaries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-lg">No beneficiaries yet</p>
                <p className="text-sm">Add someone to start sending money instantly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(beneficiaries || []).map((b, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={b?.id || i} 
                    className="flex items-center justify-between p-4 border border-border bg-background rounded-2xl hover:border-primary/30 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
                        {(b?.nickname || b?.beneficiary?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-base">{b?.nickname || b?.beneficiary?.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground font-medium">{b?.beneficiary?.email || 'No email'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(b.id)}
                      className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
