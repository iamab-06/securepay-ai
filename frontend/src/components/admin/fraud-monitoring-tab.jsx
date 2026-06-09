import React from 'react';
import { ShieldAlert, Users, Ban, Activity, AlertOctagon } from 'lucide-react';

export default function FraudMonitoringTab({ data, isLoading = false, error = null }) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
          <div className="h-64 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
        <AlertOctagon className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
        <p className="text-red-600">{error.message || 'Failed to fetch fraud analytics data.'}</p>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-12 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fraud Data Available</h3>
        <p className="text-gray-500">The system has not recorded any risk assessments yet.</p>
      </div>
    );
  }

  const { summary, ruleDistribution, blockedTransactions, highRiskUsers } = data;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalAssessments}</p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <Activity size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Blocked Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalBlocked}</p>
            </div>
            <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <Ban size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Block Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalAssessments > 0 ? Math.round((summary.totalBlocked / summary.totalAssessments) * 100) : 0}%
              </p>
            </div>
            <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
              <ShieldAlert size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-1">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Triggered Rule Analytics</h3>
          <div className="space-y-4">
            {Object.entries(ruleDistribution).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No rules triggered yet.</p>
            ) : (
              Object.entries(ruleDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([rule, count]) => (
                <div key={rule}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 truncate mr-2" title={rule}>{rule}</span>
                    <span className="text-gray-500 font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (count / summary.totalAssessments) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Risk Users */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Highest Risk Accounts</h3>
          {highRiskUsers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No high risk users identified.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Risk Score</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Blocks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {highRiskUsers.map((u, i) => (
                    <tr key={i}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                            {u.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{u.user.name}</div>
                            <div className="text-xs text-gray-500">{u.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.avgScore >= 80 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {u.avgScore}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.blockedTransfers} / {u.totalAssessments} transactions
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Blocked Transactions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-6">Recent Blocked Events</h3>
        {blockedTransactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No blocked transactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged Rules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blockedTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {tx.sender?.user?.name || 'Unknown'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {tx.risk_assessment?.risk_score || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {tx.risk_assessment?.flagged_rules?.map((rule, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
                            {rule}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
