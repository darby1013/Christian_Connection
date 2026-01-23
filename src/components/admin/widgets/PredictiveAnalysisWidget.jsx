import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PredictiveAnalysisWidget() {
  const [predictions, setPredictions] = useState([
    { 
      id: 1,
      incident: 'Database Connection Pool Exhaustion',
      probability: 78,
      timeframe: 'Next 6-12 hours',
      impact: 'High',
      indicators: ['Increasing connection count', 'Slow query trends'],
      dismissed: false
    },
    { 
      id: 2,
      incident: 'Memory Leak in Product Service',
      probability: 45,
      timeframe: 'Next 24-48 hours',
      impact: 'Medium',
      indicators: ['Gradual memory increase', 'GC frequency rising'],
      dismissed: false
    },
    { 
      id: 3,
      incident: 'API Rate Limit Breach',
      probability: 62,
      timeframe: 'Next 3-6 hours',
      impact: 'Medium',
      indicators: ['Traffic spike detected', 'Client retry patterns'],
      dismissed: false
    }
  ]);

  const handleDismiss = (predictionId) => {
    setPredictions(predictions.map(p => 
      p.id === predictionId ? { ...p, dismissed: true } : p
    ));
  };

  const handleActOnPrediction = (prediction) => {
    window.alert(`🔧 Taking action on: ${prediction.incident}\n\nRecommended Actions:\n• Scale up ${prediction.incident.includes('Database') ? 'database' : 'service'} resources\n• Enable auto-healing procedures\n• Alert DevOps team\n\nAction queued for execution.`);
  };

  const activePredictions = predictions.filter(p => !p.dismissed);

  return (
    <div className="space-y-3">
      {activePredictions.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-semibold">No Active Predictions</p>
          <p className="text-sm">System running smoothly</p>
        </div>
      ) : (
        activePredictions.map((pred) => (
          <div 
            key={pred.id}
            className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h5 className="text-white font-semibold text-sm mb-1">{pred.incident}</h5>
                <p className="text-slate-400 text-xs">{pred.timeframe}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-red-400"
                onClick={() => handleDismiss(pred.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge className={
                pred.probability > 70 ? 'bg-red-600' :
                pred.probability > 40 ? 'bg-orange-500' : 'bg-yellow-500'
              }>
                {pred.probability}% probability
              </Badge>
              <Badge variant="outline" className="text-slate-400 border-slate-600">
                {pred.impact} impact
              </Badge>
            </div>

            <div className="mb-3">
              <p className="text-slate-400 text-xs font-semibold mb-1">Key Indicators:</p>
              {pred.indicators.map((indicator, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-400 text-xs">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                  {indicator}
                </div>
              ))}
            </div>

            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => handleActOnPrediction(pred)}
            >
              <AlertTriangle className="w-3 h-3 mr-2" />
              Take Action
            </Button>
          </div>
        ))
      )}
    </div>
  );
}