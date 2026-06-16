import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Search, FileText } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/status-badge';

export default function KycQueue() {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, kycId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      // By default, backend gets UNDER_REVIEW
      const { data } = await api.get('/admin/kyc/queue');
      setQueue(data.data || data); // handle potential response wrapper differences
    } catch (err) {
      console.error('Failed to fetch KYC queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (kycId) => {
    if (!window.confirm('Are you sure you want to approve this KYC application?')) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/kyc/${kycId}/review`, { action: 'APPROVE' });
      await fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) return alert('Reason is required');
    setIsProcessing(true);
    try {
      await api.post(`/admin/kyc/${rejectModal.kycId}/review`, {
        action: 'REJECT',
        reason: rejectionReason
      });
      setRejectModal({ open: false, kycId: null });
      setRejectionReason('');
      await fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KYC Verification Queue</h1>
          <p className="text-slate-500 text-sm mt-1">Review and process pending identity verification requests.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 mb-4 text-primary/50" />
            <p>Queue is empty. All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">PAN / Aadhaar</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Tier</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{item.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-slate-500">{item.user?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-900 flex items-center gap-2">
                        <FileText size={14} className="text-slate-400"/> {item.pan_number}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        ...{item.aadhaar_last4}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={item.user?.risk_tier || 'LOW'} />
                    </td>
                    <td className="p-4 text-sm text-slate-900/70">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, kycId: item.id })}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <XCircle className="text-red-500" size={24} />
                Reject Application
              </h3>
              <p className="text-slate-900/60 text-sm mb-6">
                Please provide a reason for rejecting this KYC application. The user will be notified.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., PAN card image is blurry..."
                className="w-full bg-[#0a0a0b] border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-white/30 focus:outline-none focus:border-red-500 transition-colors resize-none h-32 mb-6"
              />
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, kycId: null })}
                  className="px-4 py-2 text-slate-900/70 hover:text-slate-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-slate-900 rounded-xl font-medium transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
