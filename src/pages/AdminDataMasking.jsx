import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye, EyeOff, Shield, Lock, Users, Settings, CheckCircle
} from "lucide-react";

export default function AdminDataMasking() {
  const [maskingRules] = useState([
    { field: 'User.email', maskType: 'Email', example: 'j***@gmail.com', enabled: true },
    { field: 'User.phone', maskType: 'Phone', example: '***-***-1234', enabled: true },
    { field: 'Order.credit_card', maskType: 'Card', example: '****-****-****-1234', enabled: true },
    { field: 'User.ssn', maskType: 'SSN', example: '***-**-1234', enabled: true },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Data Masking</h2>
        <p className="text-slate-400 font-semibold">Protect sensitive data with field-level masking</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <EyeOff className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{maskingRules.filter(r => r.enabled).length}</p>
            <p className="text-slate-400 text-sm">Active Rules</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">100%</p>
            <p className="text-slate-400 text-sm">Protected</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">4</p>
            <p className="text-slate-400 text-sm">Sensitive Fields</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Users className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">12</p>
            <p className="text-slate-400 text-sm">Authorized Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Masking Rules */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Masking Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {maskingRules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <EyeOff className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h4 className="text-white font-bold">{rule.field}</h4>
                    <p className="text-slate-400 text-sm">{rule.maskType} masking: {rule.example}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={rule.enabled ? 'bg-green-500' : 'bg-slate-500'}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Checkbox checked={rule.enabled} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}