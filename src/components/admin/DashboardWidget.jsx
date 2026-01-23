import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export default function DashboardWidget({ 
  title, 
  icon: Icon, 
  children, 
  onRemove, 
  onExpand,
  isExpanded = false,
  color = 'cyan'
}) {
  const colorClasses = {
    cyan: 'from-cyan-950/30 to-blue-950/30 border-cyan-500/30',
    purple: 'from-purple-950/30 to-pink-950/30 border-purple-500/30',
    green: 'from-green-950/30 to-emerald-950/30 border-green-500/30',
    red: 'from-red-950/30 to-orange-950/30 border-red-500/30',
    orange: 'from-orange-950/30 to-amber-950/30 border-orange-500/30',
    blue: 'from-blue-950/30 to-indigo-950/30 border-blue-500/30'
  };

  const iconColors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border transition-all duration-200 hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            {Icon && <Icon className={`w-5 h-5 ${iconColors[color]}`} />}
            {title}
          </CardTitle>
          <div className="flex gap-1">
            {onExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={onExpand}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-400"
                onClick={onRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={isExpanded ? 'p-6' : 'p-4'}>
        {children}
      </CardContent>
    </Card>
  );
}