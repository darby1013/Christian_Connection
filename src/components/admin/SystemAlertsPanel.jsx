import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Sparkles, X, Search, Zap } from 'lucide-react';

const SystemAlertsPanel = React.memo(({ 
  realtimeMetrics, 
  showAlerts, 
  setShowAlerts,
  runPredictiveAnalysis,
  executeRootCauseAnalysis,
  executeAutoHealing,
  rcaInProgress,
  autoHealingInProgress,
  healingProgress
}) => {
  // Use ref to store previous alerts and only update if meaningfully different
  const prevAlertsRef = React.useRef([]);
  
  const activeAlerts = useMemo(() => {
    if (!realtimeMetrics) return prevAlertsRef.current;
    const alerts = [];
    const thresholds = { cpu: 80, memory: 75, network: 85, dbConnections: 250 };
    
    realtimeMetrics.services.forEach(service => {
      if (service.cpu > thresholds.cpu) {
        alerts.push({ severity: 'critical', service: service.name, metric: 'CPU', value: service.cpu.toFixed(1), threshold: thresholds.cpu });
      }
      if (service.memory > thresholds.memory) {
        alerts.push({ severity: 'warning', service: service.name, metric: 'Memory', value: service.memory.toFixed(1), threshold: thresholds.memory });
      }
      if (service.network > thresholds.network) {
        alerts.push({ severity: 'warning', service: service.name, metric: 'Network I/O', value: service.network.toFixed(1), threshold: thresholds.network });
      }
      if (service.dbConnections > thresholds.dbConnections) {
        alerts.push({ severity: 'critical', service: service.name, metric: 'DB Connections', value: service.dbConnections, threshold: thresholds.dbConnections });
      }
    });
    
    // Only update if alert count or severity changed
    if (alerts.length !== prevAlertsRef.current.length || 
        JSON.stringify(alerts.map(a => a.severity)) !== JSON.stringify(prevAlertsRef.current.map(a => a.severity))) {
      prevAlertsRef.current = alerts;
    }
    
    return prevAlertsRef.current;
  }, [realtimeMetrics]);

  if (!showAlerts || activeAlerts.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-red-950/30 via-orange-950/30 to-red-950/30 border-red-500/50 shadow-xl shadow-red-500/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
              <div className="absolute inset-0 bg-red-400 blur-xl opacity-50 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-white font-black text-lg">Active System Alerts - AI Auto-Healing Enabled</h3>
              <p className="text-red-300 text-sm">{activeAlerts.length} threshold violation(s) detected</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={runPredictiveAnalysis} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Predict Future Issues
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          {activeAlerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${
              alert.severity === 'critical' 
                ? 'bg-red-900/30 border-red-500/50' 
                : 'bg-orange-900/30 border-orange-500/50'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <Badge className={alert.severity === 'critical' ? 'bg-red-600' : 'bg-orange-600'}>
                  {alert.severity.toUpperCase()}
                </Badge>
                <span className="text-white font-black text-lg">{alert.value}{alert.metric === 'DB Connections' ? '' : '%'}</span>
              </div>
              <p className="text-white font-bold mb-1">{alert.service}</p>
              <p className="text-slate-300 text-sm mb-3">{alert.metric} exceeds threshold of {alert.threshold}{alert.metric === 'DB Connections' ? '' : '%'}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => executeRootCauseAnalysis(alert)} 
                  size="sm" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={rcaInProgress}
                >
                  <Search className="w-3 h-3 mr-2" />
                  {rcaInProgress ? 'Analyzing...' : 'RCA + Auto-Fix'}
                </Button>
                <Button 
                  onClick={() => executeAutoHealing(alert)} 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={autoHealingInProgress}
                >
                  <Zap className="w-3 h-3 mr-2" />
                  {autoHealingInProgress ? 'Healing...' : 'Quick Heal'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {autoHealingInProgress && (
          <div className="space-y-2 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-300 font-bold">Auto-healing in progress...</span>
              <span className="text-green-400 font-black">{healingProgress}%</span>
            </div>
            <Progress value={healingProgress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SystemAlertsPanel.displayName = 'SystemAlertsPanel';

export default SystemAlertsPanel;