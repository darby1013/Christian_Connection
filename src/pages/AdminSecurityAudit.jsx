import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Lock, Eye, AlertTriangle, CheckCircle,
  UserX, Key, Database, Download, Search
} from "lucide-react";
import { format } from "date-fns";

export default function AdminSecurityAudit() {
  const [scanning, setScanning] = useState(false);

  const auditLog = [
    {
      id: 1,
      action: 'LOGIN_SUCCESS',
      user: 'admin@glorywave.com',
      ip: '192.168.1.100',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      risk: 'low',
      details: 'Successful admin login'
    },
    {
      id: 2,
      action: 'FAILED_LOGIN',
      user: 'unknown@test.com',
      ip: '45.123.45.67',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      risk: 'medium',
      details: '5 failed login attempts - IP temporarily blocked'
    },
    {
      id: 3,
      action: 'DATA_EXPORT',
      user: 'admin@glorywave.com',
      ip: '192.168.1.100',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      risk: 'low',
      details: 'Exported customer data (450 records)'
    },
    {
      id: 4,
      action: 'PERMISSION_CHANGE',
      user: 'admin@glorywave.com',
      ip: '192.168.1.100',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      risk: 'medium',
      details: 'Updated role permissions for moderator role'
    },
    {
      id: 5,
      action: 'BULK_DELETE',
      user: 'admin@glorywave.com',
      ip: '192.168.1.100',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      risk: 'high',
      details: 'Deleted 12 expired coupons'
    }
  ];

  const securityChecks = [
    { name: 'Password Strength', status: 'passed', score: 95 },
    { name: 'SQL Injection Protection', status: 'passed', score: 100 },
    { name: 'XSS Prevention', status: 'passed', score: 98 },
    { name: 'CSRF Protection', status: 'passed', score: 100 },
    { name: 'Rate Limiting', status: 'passed', score: 92 },
    { name: 'Data Encryption', status: 'passed', score: 100 },
    { name: 'API Authentication', status: 'passed', score: 100 },
    { name: 'Session Management', status: 'warning', score: 85 }
  ];

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-600';
      default: return 'bg-slate-500';
    }
  };

  const runSecurityScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      alert('✅ Security scan completed - All checks passed!');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Security Audit</h2>
          <p className="text-slate-400 font-semibold">Access logs, permissions & vulnerability scanning</p>
        </div>
        <Button onClick={runSecurityScan} disabled={scanning} className="bg-purple-500 hover:bg-purple-600">
          {scanning ? (
            <><Shield className="w-4 h-4 mr-2 animate-pulse" />Scanning...</>
          ) : (
            <><Shield className="w-4 h-4 mr-2" />Run Security Scan</>
          )}
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Secure</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">98%</p>
            <p className="text-slate-400 text-sm font-semibold">Security Score</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{auditLog.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{auditLog.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Recent Events</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <UserX className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">Medium</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">3</p>
            <p className="text-slate-400 text-sm font-semibold">Failed Logins (24h)</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-8 h-8 text-purple-400" />
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">AES-256</p>
            <p className="text-slate-400 text-sm font-semibold">Encryption Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Checks */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Security Checks</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {securityChecks.map((check, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {check.status === 'passed' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                    <span className="text-white font-semibold">{check.name}</span>
                  </div>
                  <Badge className={check.status === 'passed' ? 'bg-green-500' : 'bg-amber-500'}>
                    {check.score}%
                  </Badge>
                </div>
                <Progress value={check.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Security Audit Log
            </span>
            <Button size="sm" variant="outline" className="border-slate-700">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {auditLog.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getRiskColor(log.risk)}>
                        {log.risk.toUpperCase()}
                      </Badge>
                      <Badge className="bg-purple-500">{log.action}</Badge>
                      <span className="text-slate-400 text-sm">{format(log.timestamp, 'MMM d, HH:mm:ss')}</span>
                    </div>
                    <p className="text-white font-semibold mb-1">{log.details}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>User: {log.user}</span>
                      <span>IP: {log.ip}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}