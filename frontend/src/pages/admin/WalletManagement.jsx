import { useState, useEffect } from 'react';
import { Search, Lock, Unlock } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/status-badge';

export default function WalletManagement() {
  const [wallets, setWallets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => fetchWallets(), 300);
    return () => clearTimeout(timer);
  }, [pagination.page, search]);

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/admin/wallets', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined
        }
      });
      setWallets(data.data.wallets);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch wallets', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletStatus = async (walletId, status) => {
    if (!window.confirm(`Are you sure you want to change this wallet's status to ${status}?`)) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/wallets/${walletId}/status`, { status });
      await fetchWallets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update wallet status');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Wallet Management</h1>
          <p className="text-white/50 text-sm mt-1">Monitor ledger balances and lock suspected fraudulent wallets.</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Search by wallet or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="pl-10 pr-4 py-2 bg-[#121216] border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors w-72"
          />
        </div>
      </div>

      <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Wallet Number</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Owner Email</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Balance (INR)</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && wallets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-white/50">Loading wallets...</td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-white/50">No wallets found.</td>
                </tr>
              ) : (
                wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white font-mono">{w.wallet_number}</div>
                      <div className="text-xs text-white/40 mt-1">Created: {new Date(w.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-white">{w.user_email}</div>
                      {w.user_status === 'FROZEN' && (
                        <span className="text-[10px] text-red-400 mt-1 block uppercase font-bold tracking-wider">Account Suspended</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white tracking-tight">₹{Number(w.balance).toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {w.status === 'FROZEN' ? (
                          <button
                            onClick={() => handleWalletStatus(w.id, 'ACTIVE')}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Unlock size={16} /> Unfreeze
                          </button>
                        ) : (
                          <button
                            onClick={() => handleWalletStatus(w.id, 'FROZEN')}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Lock size={16} /> Freeze
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-white/5 flex justify-between items-center text-sm">
            <span className="text-white/50">
              Showing page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded disabled:opacity-50 text-white transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded disabled:opacity-50 text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
