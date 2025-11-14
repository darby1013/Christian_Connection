import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function EnterpriseCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  subtitle, 
  color = 'cyan',
  children,
  className = ''
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400 bg-green-500/10';
    if (trend === 'down') return 'text-red-400 bg-red-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  return (
    <Card className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-${color}-500/50 transition-all hover:shadow-xl hover:shadow-${color}-500/5 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 border border-${color}-500/30 flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${color}-400`} />
            </div>
          )}
          {trendValue && (
            <Badge className={`${getTrendColor()} border-0 font-bold`}>
              {getTrendIcon()}
              <span className="ml-1">{trendValue}</span>
            </Badge>
          )}
        </div>
        <div>
          <p className="text-slate-400 text-sm font-semibold mb-1">{title}</p>
          <p className="text-white text-3xl font-black mb-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs font-medium">{subtitle}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}