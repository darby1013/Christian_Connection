import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, CheckCircle2, XCircle, AlertTriangle, Play, 
  Shield, Zap, Package, Clock, TrendingUp, Settings
} from 'lucide-react';
import EnterpriseTable from './EnterpriseTable';

export default function CICDIntegration() {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const deploymentHistory = [
    { 
      commit: 'a3f2b91', 
      branch: 'main', 
      status: 'passed', 
      timestamp: '2 hours ago',
      architectureScore: 94,
      risks: 0,
      warnings: 2,
      optimizations: 3
    },
    { 
      commit: '7d8e4c2', 
      branch: 'feature/new-api', 
      status: 'blocked', 
      timestamp: '5 hours ago',
      architectureScore: 67,
      risks: 3,
      warnings: 8,
      optimizations: 12
    },
    { 
      commit: 'b9c1f3e', 
      branch: 'main', 
      status: 'passed', 
      timestamp: '1 day ago',
      architectureScore: 91,
      risks: 0,
      warnings: 3,
      optimizations: 5
    }
  ];

  const architectureStandards = [
    { name: 'Entity Coupling', status: 'passing', threshold: '<5 deps', current: '3 deps' },
    { name: 'API Response Time', status: 'passing', threshold: '<200ms', current: '145ms' },
    { name: 'Security Vulnerabilities', status: 'warning', threshold: '0 critical', current: '2 medium' },
    { name: 'Code Complexity', status: 'passing', threshold: '<15', current: '12' },
    { name: 'Database Queries', status: 'passing', threshold: 'Optimized', current: 'Indexed' }
  ];

  const scanDeployment = async () => {
    setScanning(true);
    setScanProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setScanProgress(i);
    }
    
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-950/30 via-purple-950/30 to-blue-950/30 border-blue-500/40">
        <CardHeader className="border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3 text-2xl">
              <GitBranch className="w-7 h-7 text-blue-400" />
              CI/CD Pipeline Architecture Analyzer
            </CardTitle>
            <Button 
              onClick={scanDeployment} 
              disabled={scanning}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {scanning ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analyze Pre-Deployment
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {scanning && (
            <div className="space-y-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-300 font-bold">Analyzing architecture changes...</span>
                <span className="text-blue-400 font-black">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-3" />
              <p className="text-slate-400 text-sm">
                Checking dependencies, security policies, performance impact, and architectural standards...
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-white mb-2">247</p>
                <p className="text-green-300 font-bold">Successful Deployments</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30">
              <CardContent className="p-6 text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-white mb-2">12</p>
                <p className="text-red-300 font-bold">Blocked Deployments</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-4xl font-black text-white mb-2">156</p>
                <p className="text-yellow-300 font-bold">Risks Prevented</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Architectural Standards Compliance
            </h3>
            <div className="space-y-3">
              {architectureStandards.map((standard, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">{standard.name}</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">Threshold: <span className="text-cyan-400 font-semibold">{standard.threshold}</span></span>
                      <span className="text-slate-400">Current: <span className="text-white font-semibold">{standard.current}</span></span>
                    </div>
                  </div>
                  <Badge className={
                    standard.status === 'passing' ? 'bg-green-600' :
                    standard.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                  }>
                    {standard.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Recent Deployment History
            </h3>
            <EnterpriseTable
              columns={[
                { 
                  header: 'Commit', 
                  key: 'commit',
                  render: (val) => <code className="text-cyan-400 font-mono text-sm">{val}</code>
                },
                { 
                  header: 'Branch', 
                  key: 'branch',
                  render: (val) => <Badge className="bg-purple-500">{val}</Badge>
                },
                { 
                  header: 'Score', 
                  key: 'architectureScore',
                  render: (val) => (
                    <div className="flex items-center gap-2">
                      <Progress value={val} className="h-2 w-20" />
                      <span className="text-white font-bold">{val}</span>
                    </div>
                  )
                },
                { 
                  header: 'Risks', 
                  key: 'risks',
                  render: (val) => val > 0 ? <Badge className="bg-red-500">{val}</Badge> : <span className="text-green-400">✓</span>
                },
                { 
                  header: 'Warnings', 
                  key: 'warnings',
                  render: (val) => val > 0 ? <Badge className="bg-yellow-500">{val}</Badge> : <span className="text-green-400">✓</span>
                },
                { 
                  header: 'Optimizations', 
                  key: 'optimizations',
                  render: (val) => <Badge className="bg-blue-500">{val}</Badge>
                },
                { 
                  header: 'Status', 
                  key: 'status',
                  render: (val) => (
                    <Badge className={
                      val === 'passed' ? 'bg-green-600' :
                      val === 'blocked' ? 'bg-red-600' : 'bg-yellow-600'
                    }>
                      {val === 'passed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {val === 'blocked' && <XCircle className="w-3 h-3 mr-1" />}
                      {val.toUpperCase()}
                    </Badge>
                  )
                },
                { header: 'Time', key: 'timestamp' }
              ]}
              data={deploymentHistory}
            />
          </div>

          <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
            <CardContent className="p-6">
              <h4 className="text-cyan-400 font-bold text-lg mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Auto-Prevention Rules
              </h4>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Circular Dependency Detection</p>
                    <p className="text-sm text-slate-400">Prevents deployment if circular dependencies are detected between entities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Security Vulnerability Blocking</p>
                    <p className="text-sm text-slate-400">Blocks deployment if critical or high severity vulnerabilities found</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Performance Regression Guard</p>
                    <p className="text-sm text-slate-400">Prevents deployment if API response times exceed 300ms threshold</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Database Query Optimization Check</p>
                    <p className="text-sm text-slate-400">Requires proper indexing on high-complexity queries before deployment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}