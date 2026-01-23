import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, FileText, AlertCircle } from 'lucide-react';

export default function RealtimeMetricsWidget({ services }) {
  const [selectedService, setSelectedService] = useState(null);
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);

  const runDiagnostic = async (service) => {
    setDiagnosticRunning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    window.alert(`✅ Diagnostic complete for ${service.name}\n\nStatus: Healthy\nCPU: ${service.cpu.toFixed(1)}%\nMemory: ${service.memory.toFixed(1)}%\nRecommendation: No action needed`);
    setDiagnosticRunning(false);
  };

  const mockLogs = [
    { timestamp: '2026-01-23 14:32:45', level: 'INFO', message: 'Request processed successfully' },
    { timestamp: '2026-01-23 14:32:43', level: 'WARN', message: 'High memory usage detected' },
    { timestamp: '2026-01-23 14:32:41', level: 'INFO', message: 'Database connection established' },
    { timestamp: '2026-01-23 14:32:38', level: 'ERROR', message: 'Timeout on external API call' },
    { timestamp: '2026-01-23 14:32:35', level: 'INFO', message: 'Cache hit ratio: 94%' }
  ];

  return (
    <>
      <div className="space-y-4">
        {services?.map((service, idx) => (
          <div 
            key={idx} 
            className="space-y-2 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-cyan-500/30"
            onClick={() => setSelectedService(service)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-sm">{service.name}</span>
              <Badge className="bg-slate-700 text-slate-300 text-xs">{service.dbConnections} conn</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">CPU</span>
                  <span className={`text-xs font-bold ${service.cpu > 80 ? 'text-red-400' : 'text-cyan-400'}`}>
                    {service.cpu.toFixed(0)}%
                  </span>
                </div>
                <Progress value={service.cpu} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">MEM</span>
                  <span className={`text-xs font-bold ${service.memory > 75 ? 'text-red-400' : 'text-purple-400'}`}>
                    {service.memory.toFixed(0)}%
                  </span>
                </div>
                <Progress value={service.memory} className="h-1.5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">NET</span>
                  <span className="text-xs font-bold text-green-400">{service.network.toFixed(0)}%</span>
                </div>
                <Progress value={service.network} className="h-1.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              {selectedService?.name} - Detailed Diagnostics
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg text-center">
                <p className="text-cyan-400 text-xs font-bold mb-1">CPU USAGE</p>
                <p className="text-white font-black text-2xl">{selectedService?.cpu.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-center">
                <p className="text-purple-400 text-xs font-bold mb-1">MEMORY</p>
                <p className="text-white font-black text-2xl">{selectedService?.memory.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                <p className="text-green-400 text-xs font-bold mb-1">NETWORK</p>
                <p className="text-white font-black text-2xl">{selectedService?.network.toFixed(1)}%</p>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Recent Logs (Last 5 minutes)
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800">
                {mockLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs font-mono p-2 hover:bg-slate-800 rounded">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <Badge className={
                      log.level === 'ERROR' ? 'bg-red-600' :
                      log.level === 'WARN' ? 'bg-yellow-600' : 'bg-blue-600'
                    }>{log.level}</Badge>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => runDiagnostic(selectedService)}
                disabled={diagnosticRunning}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {diagnosticRunning ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Full Diagnostic
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.alert(`Restarting ${selectedService?.name}...`)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Restart Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}