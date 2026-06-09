import React, { useState, useEffect } from 'react';
import { History, Search, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import api from '../services/api';
import { useAuth } from "../context/AuthContext";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wallet } = useAuth();

  useEffect(() => {
    api.get('/transactions').then(res => {
      setTransactions(res.data?.data?.transactions || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground mt-1 font-medium">Track all your incoming and outgoing transfers.</p>
        </div>
        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by reference..." 
            className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">REFERENCE</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">TYPE</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">COUNTERPARTY</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">AMOUNT</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">STATUS</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-muted-foreground font-medium">No transactions found.</td></tr>
                ) : (
                  (transactions || []).map(txn => {
                    const isOut = txn?.sender_wallet_id === wallet?.id;
                    const counterparty = isOut ? txn?.receiver?.user : txn?.sender?.user;
                    
                    return (
                      <tr key={txn?.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded">{txn?.transaction_reference || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${isOut ? 'text-destructive' : 'text-success'}`}>
                            {isOut ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                            {isOut ? 'SENT' : 'RECEIVED'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-foreground">{counterparty?.name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground font-medium">{counterparty?.email || 'No email'}</p>
                        </td>
                        <td className="px-6 py-4 font-black text-foreground">
                          ₹{txn?.amount || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            txn?.status === 'SUCCESS' ? 'bg-success/10 text-success' : 
                            txn?.status === 'BLOCKED' ? 'bg-destructive/10 text-destructive' : 
                            'bg-muted/50 text-muted-foreground'
                          }`}>
                            {txn?.status || 'UNKNOWN'}
                          </span>
                          {txn?.status === 'BLOCKED' && txn?.risk_assessment && (
                            <div className="mt-1">
                              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold" title={txn.risk_assessment.flagged_rules?.join(', ')}>
                                Score: {txn.risk_assessment.risk_score}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                          {txn?.created_at ? new Date(txn.created_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
