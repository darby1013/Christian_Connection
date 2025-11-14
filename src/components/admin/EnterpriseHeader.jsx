import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function EnterpriseHeader({ 
  title, 
  subtitle, 
  icon: Icon,
  badge,
  actions = []
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Icon className="w-6 h-6 text-cyan-400" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              {title}
              {badge && <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">{badge}</Badge>}
            </h2>
            {subtitle && <p className="text-slate-400 font-semibold mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className={action.className || 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}