import { ShieldCheck, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';

export function StatusBadge({ status, className = '' }) {
  const getBadgeConfig = () => {
    switch(status) {
      case 'VERIFIED':
        return {
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          icon: <ShieldCheck size={14} />,
          label: 'Verified'
        };
      case 'UNDER_REVIEW':
        return {
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          icon: <Clock size={14} />,
          label: 'Under Review'
        };
      case 'REJECTED':
        return {
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          icon: <ShieldAlert size={14} />,
          label: 'Rejected'
        };
      case 'PENDING':
      default:
        return {
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          icon: <AlertTriangle size={14} />,
          label: 'Pending KYC'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.color} ${config.bg} ${className}`}>
      {config.icon}
      {config.label}
    </div>
  );
}
