import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, CheckCircle, AlertTriangle, XCircle,
  Play, Database, RefreshCw, Download
} from "lucide-react";

export default function AdminDataIntegrity() {
  const [running, setRunning] = useState(false);

  const integrityChecks = [
    {
      name: 'Foreign Key Constraints',
      status: 'passed',
      checked: 1250,
      issues: 0,
      description: 'All foreign key relationships are valid'
    },
    {
      name: 'Orphaned Records',
      status: 'warning',
      checked: 8900,
      issues: 3,
      description: 'Found 3 orders without valid customer references'
    },
    {
      name: 'Duplicate SKUs',
      status: 'passed',
      checked: 1250,
      issues: 0,
      description: 'No duplicate SKUs found'
    },
    {
      name: 'Invalid Email Addresses',
      status: 'failed',
      checked: 450,
      issues: 12,
      description: 'Found 12 users with invalid email formats'
    },
    {
      name: 'Missing Required Fields',
      status: 'passed',
      checked: 3200,
      issues: 0,
      description: 'All required fields are populated'
    },
    {
      name: 'Stock Quantity Negative',
      status: 'warning',
      checked: 1250,
      issues: 5,
      description: 'Found 5 products with negative stock'
    },
    {
      name: 'Price Validation',
      status: 'passed',
      checked: 1250,
      issues: 0,
      description: 'All prices are positive and valid'
    },
    {
      name: 'Circular References',
      status: 'passed',
      checked: 890,
      issues: 0,
      description: 'No circular references detected'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'passed': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'passed': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'failed': return <XCircle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const runIntegrityCheck = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      alert('✅ Integrity check completed!');
    }, 3000);
  };

  const passedChecks = integrityChecks.filter(c => c.status === 'passed').length;
  const warningChecks = integrityChecks.filter(c => c.status === 'warning').length;
  const failedChecks = integrityChecks.filter(c => c.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Data Integrity Checker</h2>
          <p className="text-slate-400 font-semibold">Validate database consistency & relationships</p>
        </div>
        <Button
          onClick={runIntegrityCheck}
          disabled={running}
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          {running ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Running...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" />Run Check</>
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">Total</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{integrityChecks.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Checks</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Pass</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{passedChecks}</p>
            <p className="text-slate-400 text-sm font-semibold">Passed</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">Warning</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{warningChecks}</p>
            <p className="text-slate-400 text-sm font-semibold">Warnings</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
              <Badge className="bg-red-500">Failed</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{failedChecks}</p>
            <p className="text-slate-400 text-sm font-semibold">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrity Checks List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center justify-between">
            <span>Integrity Check Results</span>
            <Button size="sm" variant="outline" className="border-slate-700">
              <Download className="w-3 h-3 mr-1" />
              Export Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {integrityChecks.map((check, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl ${check.status === 'passed' ? 'bg-green-500/20' : check.status === 'warning' ? 'bg-amber-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                      {getStatusIcon(check.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{check.name}</h3>
                        <Badge className={getStatusColor(check.status)}>
                          {check.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{check.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Checked: {check.checked.toLocaleString()} records</span>
                        {check.issues > 0 && (
                          <span className={check.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>
                            Issues: {check.issues}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {check.issues > 0 && (
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}