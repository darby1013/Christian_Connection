import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, CheckCircle2 } from 'lucide-react';

export default function WidgetSelector({ open, onClose, onAddWidget, availableWidgets, activeWidgets }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Add Widgets to Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {availableWidgets.map((widget) => {
            const isActive = activeWidgets.some(w => w.id === widget.id);
            
            return (
              <Card 
                key={widget.id} 
                className={`border ${isActive ? 'bg-slate-800 border-green-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all cursor-pointer hover:border-cyan-500/50`}
                onClick={() => !isActive && onAddWidget(widget)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <widget.icon className={`w-5 h-5 ${widget.iconColor}`} />
                      <h4 className="text-white font-bold">{widget.title}</h4>
                    </div>
                    {isActive ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{widget.description}</p>
                  <div className="flex gap-2">
                    <Badge className={widget.badgeColor}>{widget.category}</Badge>
                    <Badge className="bg-slate-700">{widget.size}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}