import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserX, Shield, Eye, CheckCircle, Database, Lock, Settings
} from "lucide-react";

export default function AdminDataAnonymization() {
  const anonymizationRules = [
    { field: 'User.full_name', method: 'Replace with ID', example: 'User_12345', enabled: false },
    { field: 'User.email', method: 'Hash', example: 'a9b2c3d...', enabled: false },
    { field: 'User.phone', method: 'Truncate', example: '***-***-****', enabled: false },
    { field: 'Order.customer_name', method: 'Pseudonymize', example: 'Customer_789', enabled: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Data Anonymization</h2>
        <p className="text-slate-400 font-semibold">GDPR-compliant data anonymization for privacy protection</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <UserX className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{anonymizationRules.length}</p>
            <p className="text-slate-400 text-sm">Anonymization Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">0</p>
            <p className="text-slate-400 text-sm">Records Anonymized</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">100%</p>
            <p className="text-slate-400 text-sm">GDPR Compliant</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">4</p>
            <p className="text-slate-400 text-sm">Protected Fields</p>
          </CardContent>
        </Card>
      </div>

      {/* Anonymization Rules */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Anonymization Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {anonymizationRules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <UserX className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h4 className="text-white font-bold">{rule.field}</h4>
                    <p className="text-slate-400 text-sm">Method: {rule.method} → {rule.example}</p>
                  </div>
                </div>
                <Checkbox checked={rule.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GDPR Tools */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardHeader className="border-b border-blue-500/30">
          <CardTitle className="text-blue-300 font-bold">GDPR Compliance Tools</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Button className="bg-cyan-500 hover:bg-cyan-600 h-16">
              <UserX className="w-5 h-5 mr-2" />
              Right to be Forgotten
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 h-16">
              <Eye className="w-5 h-5 mr-2" />
              Data Export Request
            </Button>
            <Button className="bg-purple-500 hover:bg-purple-600 h-16">
              <Settings className="w-5 h-5 mr-2" />
              Privacy Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}