import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Download, CheckCircle, Shield, Globe, Lock,
  Calendar, Eye, AlertCircle, TrendingUp
} from "lucide-react";

export default function AdminComplianceReporting() {
  const reports = [
    { name: 'GDPR Compliance Report', generated: '2024-12-25', score: 98, status: 'passing' },
    { name: 'SOC 2 Audit Report', generated: '2024-12-20', score: 96, status: 'passing' },
    { name: 'HIPAA Compliance Check', generated: '2024-12-15', score: 94, status: 'passing' },
  ];

  const complianceMetrics = [
    { name: 'Data Protection', score: 98, color: 'green' },
    { name: 'Access Control', score: 95, color: 'green' },
    { name: 'Audit Logging', score: 100, color: 'green' },
    { name: 'Encryption', score: 97, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Compliance Reporting</h2>
          <p className="text-slate-400 font-semibold">Generate compliance reports for regulatory requirements</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Overall Compliance */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardContent className="p-8 text-center">
          <div className="inline-block">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-white text-5xl font-black">97</p>
                <p className="text-white text-sm font-bold">Score</p>
              </div>
            </div>
            <p className="text-green-300 font-bold text-xl mb-2">Excellent Compliance</p>
            <p className="text-green-200 text-sm">Meeting all regulatory standards</p>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Metrics */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Compliance Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {complianceMetrics.map((metric, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-white font-bold">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">{metric.score}%</Badge>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                <Progress value={metric.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports History */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Generated Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {reports.map((report, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-cyan-400" />
                      <div>
                        <h4 className="text-white font-bold">{report.name}</h4>
                        <p className="text-slate-400 text-sm">Generated: {report.generated}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500">Score: {report.score}%</Badge>
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}