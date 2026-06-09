import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ShieldCheck, Activity, Database, AlertOctagon, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import api from '../services/api';
import FraudMonitoringTab from '../components/admin/fraud-monitoring-tab';
import { useAuth } from '../context/AuthContext';

export default function AuditPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger');
  
  const [fraudData, setFraudData] = useState(null);
  const [isFraudLoading, setIsFraudLoading] = useState(true);
  const [fraudError, setFraudError] = useState(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    
    api.get('/admin/system-status').then(res => setHealth(res.data.data));
    // Fetch recent transactions
    api.get('/transactions?limit=10').then(res => setTransactions(res.data.data.transactions));
    
    // Fetch fraud analytics
    api.get('/admin/fraud-analytics')
      .then(res => setFraudData(res.data.data))
      .catch(err => setFraudError(err))
      .finally(() => setIsFraudLoading(false));
  }, [user?.role]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-3xl font-black text-foreground tracking-tight mb-3">Access Denied</h2>
        <p className="text-muted-foreground font-medium">Administrator access is required to view the Ledger Operations and Security Audit panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-foreground tracking-tight">System & Security Audit</h2>
        <p className="text-muted-foreground mt-1 font-medium">Immutable double-entry ledger and AI fraud oversight.</p>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><Database size={16} /> Ledger Operations</div>
        </button>
        <button
          onClick={() => setActiveTab('fraud')}
          className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fraud' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2"><ShieldAlert size={16} /> Fraud & Security</div>
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <>
          {/* Health Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary/10 text-primary p-3 rounded-xl"><Database size={24} /></div>
              <p className="font-bold text-muted-foreground">Total Ledger Entries</p>
            </div>
            <p className="text-3xl font-black text-foreground">{health?.totalEntries || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-destructive/10 text-destructive p-3 rounded-xl"><AlertOctagon size={24} /></div>
              <p className="font-bold text-muted-foreground">Fraud Attempts</p>
            </div>
            <p className="text-3xl font-black text-destructive">{health?.fraudAttempts || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${health?.integrityStatus === 'HEALTHY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {health?.integrityStatus === 'HEALTHY' ? <CheckCircle2 size={24} /> : <AlertOctagon size={24} />}
              </div>
              <p className="font-bold text-muted-foreground">Global Integrity</p>
            </div>
            <p className={`text-2xl font-black ${health?.integrityStatus === 'HEALTHY' ? 'text-success' : 'text-destructive'}`}>
              {health?.integrityStatus || 'LOADING'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${health?.reconciliationStatus === 'HEALTHY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <ShieldCheck size={24} />
              </div>
              <p className="font-bold text-muted-foreground">Reconciliation</p>
            </div>
            <p className={`text-2xl font-black ${health?.reconciliationStatus === 'HEALTHY' ? 'text-success' : 'text-destructive'}`}>
              {health?.reconciliationStatus || 'LOADING'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Immutable Ledger Trail (Recent)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">BATCH ID</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">TXN REF</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">DEBIT ACC</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">CREDIT ACC</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">AMOUNT</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">STATUS</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground tracking-wider">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">No ledger events found</td></tr>
                )}
                {(transactions || []).map(txn => {
                  const debitEntry = txn?.ledger_entries?.find(e => e.entry_type === 'DEBIT');
                  const creditEntry = txn?.ledger_entries?.find(e => e.entry_type === 'CREDIT');
                  const batch = debitEntry?.batch || creditEntry?.batch;
                  const amount = debitEntry?.amount || creditEntry?.amount || txn?.amount || '0.00';

                  if (!debitEntry && !creditEntry && txn?.status !== 'BLOCKED') return null;

                  return (
                    <tr key={txn?.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-muted-foreground">{batch?.batch_reference || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold bg-muted/50 px-2 py-1 rounded text-foreground">{txn?.transaction_reference || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">{debitEntry?.ledger_account?.account_code || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">{creditEntry?.ledger_account?.account_code || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-foreground">
                        ₹{amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                            batch?.status === 'POSTED' || txn?.status === 'SUCCESS' ? 'bg-success/10 text-success' : 
                            txn?.status === 'BLOCKED' ? 'bg-destructive/10 text-destructive' : 
                            'bg-muted/50 text-muted-foreground'
                          }`}>
                          {batch?.status || txn?.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {txn?.created_at ? new Date(txn.created_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      ) : (
        <FraudMonitoringTab data={fraudData} isLoading={isFraudLoading} error={fraudError} />
      )}
    </div>
  );
}
