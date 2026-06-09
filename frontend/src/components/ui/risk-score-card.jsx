import React from 'react';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

export default function RiskScoreCard({ score = 0, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
        <div className="flex items-center justify-center">
          <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Determine risk level based on thresholds
  let level = 'LOW';
  let color = 'text-green-500';
  let bgColor = 'bg-green-50';
  let Icon = ShieldCheck;

  if (score >= 80) {
    level = 'HIGH';
    color = 'text-red-500';
    bgColor = 'bg-red-50';
    Icon = ShieldAlert;
  } else if (score >= 40) {
    level = 'MEDIUM';
    color = 'text-amber-500';
    bgColor = 'bg-amber-50';
    Icon = Shield;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Current Risk Profile</h3>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100" />
            <circle 
              cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" 
              strokeDasharray="351.86" 
              strokeDashoffset={351.86 - (351.86 * score) / 100}
              className={`transition-all duration-1000 ease-out ${color}`} 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{score}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>
        
        <div className={`mt-6 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full ${bgColor} ${color}`}>
          <Icon size={16} />
          <span className="text-sm font-bold tracking-wide">{level} RISK</span>
        </div>
      </div>
    </div>
  );
}
