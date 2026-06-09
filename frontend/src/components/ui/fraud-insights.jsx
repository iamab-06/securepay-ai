import React from 'react';
import { Lightbulb, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function FraudInsights({ insights = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex space-x-3">
              <div className="h-5 w-5 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="h-4 w-full bg-gray-200 rounded mt-0.5"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Determine an empty or neutral state
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">AI Security Analysis</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-500 text-sm">No significant risk factors detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Lightbulb size={18} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">AI Security Analysis</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => {
          // Add some simple heuristic parsing to apply different icons/colors to insights
          const isPositive = insight.toLowerCase().includes("normal") || insight.toLowerCase().includes("secure");
          const Icon = isPositive ? Info : AlertTriangle;
          const colorClass = isPositive ? "text-green-500" : "text-amber-500";
          const bgClass = isPositive ? "bg-green-50" : "bg-amber-50";

          return (
            <div key={index} className="flex items-start space-x-3">
              <div className={`mt-0.5 p-1 rounded flex-shrink-0 ${bgClass} ${colorClass}`}>
                <Icon size={14} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
