import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, FileText, Users, CheckCircle, Lock, Globe,
  AlertCircle, Clock, Eye, Download
} from "lucide-react";

export default function AdminDataGovernance() {
  const complianceChecks = [
    { name: 'GDPR Compliance', status: 'passing', score: 98, items: 24 },
    { name: 'Data Retention Policy', status: 'passing', score: 100, items: 12 },
    { name: 'Privacy Controls', status: 'warning', score: 85, items: 18 },
    { name: 'Access Logging', status: 'passing', score: 95, items: 8 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Data Governance</h2>
        <p className="text-slate-400 font-semibold">Compliance, privacy, and data retention policies</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">94%</p>
            <p className="text-slate-400 text-sm">Compliance Score</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">256-bit</p>
            <p className="text-slate-400 text-sm">Encryption</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Clock className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">7 Years</p>
            <p className="text-slate-400 text-sm">Retention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Globe className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">EU/US</p>
            <p className="text-slate-400 text-sm">Data Regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checks */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {complianceChecks.map((check, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-bold">{check.name}</h4>
                    <Badge className={check.status === 'passing' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {check.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{check.score}%</span>
                    <span className="text-slate-400 text-sm">({check.items} checks)</span>
                  </div>
                </div>
                <Progress value={check.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Data Retention Policies</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[
              { entity: 'User Data', retention: '7 years', autoDelete: false },
              { entity: 'Audit Logs', retention: '7 years', autoDelete: false },
              { entity: 'Session Data', retention: '30 days', autoDelete: true },
              { entity: 'Temporary Files', retention: '7 days', autoDelete: true },
            ].map((policy, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-white font-bold">{policy.entity}</p>
                  <p className="text-slate-400 text-sm">Retention: {policy.retention}</p>
                </div>
                <Badge className={policy.autoDelete ? 'bg-cyan-500' : 'bg-slate-600'}>
                  {policy.autoDelete ? 'Auto-Delete' : 'Manual'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Compliance Report */}
      <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-14">
        <Download className="w-5 h-5 mr-2" />
        Export Compliance Report
      </Button>
    </div>
  );
}