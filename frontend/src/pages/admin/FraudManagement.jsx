import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, ShieldCheck, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/status-badge';

export default function FraudManagement() {
  const [activeTab, setActiveTab] = useState('ALERTS'); // 'ALERTS' or 'CASES'
  
  // Alerts State
  const [alerts, setAlerts] = useState([]);
  const [alertsPagination, setAlertsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  
  // Cases State
  const [cases, setCases] = useState([]);
  const [casesPagination, setCasesPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resolution Modal State
  const [resolveModal, setResolveModal] = useState({ open: false, caseId: null });
  const [resolutionType, setResolutionType] = useState('FALSE_POSITIVE');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (activeTab === 'ALERTS') fetchAlerts();
    else fetchCases();
  }, [activeTab, alertsPagination.page, casesPagination.page]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // By default fetch OPEN alerts for operational efficiency
      const { data } = await api.get('/admin/fraud/alerts', {
        params: { page: alertsPagination.page, limit: alertsPagination.limit, status: 'OPEN' }
      });
      setAlerts(data.data.alerts);
      setAlertsPagination(data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      // Fetch UNRESOLVED cases by default
      const { data } = await api.get('/admin/fraud/cases', {
        params: { page: casesPagination.page, limit: casesPagination.limit, resolved: false }
      });
      setCases(data.data.cases);
      setCasesPagination(data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertStatus = async (alertId, status) => {
    if (!window.confirm(`Are you sure you want to change this alert to ${status}?`)) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/fraud/alerts/${alertId}/status`, { status });
      await fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update alert');
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCaseResolution = async () => {
    if (!resolutionType) return alert('Select a resolution type');
    setIsProcessing(true);
    try {
      await api.post(`/admin/fraud/cases/${resolveModal.caseId}/resolve`, {
        resolution: resolutionType,
        notes: resolutionNotes
      });
      setResolveModal({ open: false, caseId: null });
      setResolutionNotes('');
      await fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve case');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert size={24} className="text-orange-500" />
            Fraud Monitoring
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review AI-generated anomaly alerts and manage fraud investigations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab('ALERTS'); setAlertsPagination(p => ({ ...p, page: 1 })); }}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'ALERTS' ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900/80'
          }`}
        >
          Open Alerts Queue
        </button>
        <button
          onClick={() => { setActiveTab('CASES'); setCasesPagination(p => ({ ...p, page: 1 })); }}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'CASES' ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900/80'
          }`}
        >
          Active Investigations (Cases)
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        
        {/* ALERTS TAB CONTENT */}
        {activeTab === 'ALERTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Severity</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Detection Rule</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Context</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Time</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading && alerts.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading alerts...</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500"><ShieldCheck className="mx-auto mb-2 text-green-500" size={32} /> No active fraud alerts. System is secure.</td></tr>
                ) : alerts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4"><StatusBadge status={a.severity} /></td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-900">{a.rule}</div>
                      <div className="text-xs text-slate-900/60 mt-1">{a.title}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="text-xs text-slate-400 mb-1">User: {a.user?.email}</div>
                      <div className="text-sm text-slate-900/80 line-clamp-2" title={a.description}>{a.description}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {new Date(a.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAlertStatus(a.id, 'ESCALATED')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          Escalate to Case
                        </button>
                        <button
                          onClick={() => handleAlertStatus(a.id, 'DISMISSED')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-slate-50 text-slate-900/60 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CASES TAB CONTENT */}
        {activeTab === 'CASES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Case ID</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Origin Alert</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Target User</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Assigned To</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading && cases.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading cases...</td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active cases to investigate.</td></tr>
                ) : cases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs text-slate-400 font-mono">...{c.id.slice(-8)}</td>
                    <td className="p-4">
                      <StatusBadge status={c.alert?.severity || 'LOW'} />
                      <div className="text-xs text-slate-900/60 mt-1">{c.alert?.rule}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-900">{c.alert?.user?.email}</td>
                    <td className="p-4 text-sm text-slate-900/70">{c.assignee?.name || 'Unassigned'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setResolveModal({ open: true, caseId: c.id })}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors shadow-lg shadow-primary/20"
                      >
                        Resolve Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Case Modal */}
      {resolveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={24} />
              Resolve Fraud Case
            </h3>
            <p className="text-slate-900/60 text-sm mb-6">Select an outcome for this investigation.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Resolution Action</label>
                <select
                  value={resolutionType}
                  onChange={e => setResolutionType(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="FALSE_POSITIVE">False Positive (Clear)</option>
                  <option value="MONITOR_ONLY">Monitor Only</option>
                  <option value="USER_WARNED">User Warned</option>
                  <option value="ACCOUNT_FROZEN">Account Frozen</option>
                  <option value="WALLET_FROZEN">Wallet Frozen</option>
                </select>
                <p className="text-[10px] text-orange-400 mt-2">Note: Selecting 'Frozen' here is for auditing purposes. You must still execute the freeze manually in User Management.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Investigation Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Summarize findings..."
                  className="w-full bg-[#0a0a0b] border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-white/30 focus:outline-none focus:border-primary transition-colors resize-none h-24"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResolveModal({ open: false, caseId: null })}
                className="px-4 py-2 text-slate-900/70 hover:text-slate-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitCaseResolution}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-slate-900 rounded-xl font-medium transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
