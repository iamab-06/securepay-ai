import React from 'react';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

export default function RiskScoreCard({ score = 0, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 animate-pulse h-full flex flex-col">
        <div className="h-5 w-32 bg-muted rounded mb-6"></div>
        <div className="flex-grow flex items-center justify-center">
          <div className="h-28 w-28 md:h-32 md:w-32 bg-muted rounded-full"></div>
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
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 flex flex-col h-full">
      <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current Risk Profile</h3>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 md:w-32 md:h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/50" />
            <circle 
              cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" 
              strokeDasharray="351.86" 
              strokeDashoffset={351.86 - (351.86 * score) / 100}
              className={`transition-all duration-1000 ease-out ${color}`} 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-foreground">{score}</span>
            <span className="text-[10px] md:text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        
        <div className={`mt-4 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full ${bgColor} ${color}`}>
          <Icon size={16} />
          <span className="text-xs md:text-sm font-bold tracking-wide">{level} RISK</span>
        </div>
      </div>
    </div>
  );
}
