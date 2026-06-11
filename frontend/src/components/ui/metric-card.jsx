import React from 'react';
import { Card } from './card';

export function MetricCard({ title, value, icon: Icon, trend, trendValue, subtitle, iconBgClass, subtitleClass }) {
  return (
    <Card className="flex flex-col justify-between p-5 md:p-7 h-full">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div className="space-y-1 md:space-y-1.5 min-w-0 pr-2">
          <p className="text-xs md:text-sm text-muted-foreground font-semibold">{title}</p>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground break-all">{value}</h3>
          {subtitle && (
            <p className={`text-xs font-medium mt-1 break-all ${subtitleClass || 'text-muted-foreground'}`}>{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-[14px] flex items-center justify-center ${iconBgClass || 'bg-primary/10 text-primary'}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        )}
      </div>
      {(trend || trendValue) && (
        <div className="flex items-center text-sm font-semibold">
          {trend === 'up' && <span className="text-success flex items-center mr-2 bg-success/10 px-2 py-0.5 rounded-md">↑ {trendValue}</span>}
          {trend === 'down' && <span className="text-destructive flex items-center mr-2 bg-destructive/10 px-2 py-0.5 rounded-md">↓ {trendValue}</span>}
          <span className="text-muted-foreground font-medium">from last month</span>
        </div>
      )}
    </Card>
  );
}
