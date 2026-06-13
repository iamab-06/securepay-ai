import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Lock, Unlock, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/status-badge';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Debounce search slightly or trigger on search button, here we just fetch on page/search change
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.page, search]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/admin/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search || undefined
        }
      });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserStatus = async (userId, status) => {
    if (!window.confirm(`Are you sure you want to change this user's status to ${status}?`)) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/users/${userId}/status`, { status });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletStatus = async (walletId, status) => {
    if (!walletId) return alert('No wallet assigned to this user.');
    if (!window.confirm(`Are you sure you want to change this wallet's status to ${status}?`)) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/wallets/${walletId}/status`, { status });
      await fetchUsers();
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
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users size={24} className="text-primary" />
            User Management
          </h1>
          <p className="text-white/50 text-sm mt-1">Full control over enterprise user accounts and limits.</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="pl-10 pr-4 py-2 bg-[#121216] border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors w-64"
          />
        </div>
      </div>

      <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Email / Role</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Account Status</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Wallet Status</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Risk / KYC</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-white/50">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-white/50">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{u.email}</div>
                      <div className="text-xs text-white/40 mt-1">{u.role}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="p-4">
                      {u.wallet_status ? (
                        <StatusBadge status={u.wallet_status} />
                      ) : (
                        <span className="text-white/30 text-xs">Uninitialized</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 items-start">
                        <StatusBadge status={u.risk_tier || 'LOW'} />
                        {u.kyc_status && <StatusBadge status={u.kyc_status} />}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {u.status === 'FROZEN' ? (
                          <button
                            onClick={() => handleUserStatus(u.id, 'ACTIVE')}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Unlock size={14} /> Activate Account
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserStatus(u.id, 'FROZEN')}
                            disabled={isProcessing || u.role === 'ADMIN'}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Lock size={14} /> Freeze Account
                          </button>
                        )}
                        
                        {u.wallet_id && (
                          u.wallet_status === 'FROZEN' ? (
                            <button
                              onClick={() => handleWalletStatus(u.wallet_id, 'ACTIVE')}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Unlock size={14} /> Activate Wallet
                            </button>
                          ) : (
                            <button
                              onClick={() => handleWalletStatus(u.wallet_id, 'FROZEN')}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <ShieldAlert size={14} /> Freeze Wallet
                            </button>
                          )
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
