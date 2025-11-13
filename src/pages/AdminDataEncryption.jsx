import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Lock, Shield, Key, CheckCircle, Eye, Settings, Database
} from "lucide-react";

export default function AdminDataEncryption() {
  const encryptedFields = [
    { table: 'User', field: 'password', algorithm: 'bcrypt', status: 'encrypted' },
    { table: 'User', field: 'ssn', algorithm: 'AES-256', status: 'encrypted' },
    { table: 'Order', field: 'credit_card', algorithm: 'AES-256', status: 'encrypted' },
    { table: 'User', field: 'api_token', algorithm: 'SHA-256', status: 'encrypted' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Data Encryption</h2>
        <p className="text-slate-400 font-semibold">Manage field-level and database encryption</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">256-bit</p>
            <p className="text-slate-400 text-sm">AES Encryption</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{encryptedFields.length}</p>
            <p className="text-slate-400 text-sm">Encrypted Fields</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Key className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">3</p>
            <p className="text-slate-400 text-sm">Active Keys</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">100%</p>
            <p className="text-slate-400 text-sm">Coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Encrypted Fields */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Encrypted Fields</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {encryptedFields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Lock className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h4 className="text-white font-bold">{field.table}.{field.field}</h4>
                    <p className="text-slate-400 text-sm">Algorithm: {field.algorithm}</p>
                  </div>
                </div>
                <Badge className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {field.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encryption Settings */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Encryption Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">Encrypt Data at Rest</span>
            <Checkbox defaultChecked />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">Encrypt Data in Transit (TLS)</span>
            <Checkbox defaultChecked />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span className="text-white">Auto-rotate Encryption Keys (90 days)</span>
            <Checkbox defaultChecked />
          </label>
          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 mt-4">
            <Settings className="w-4 h-4 mr-2" />
            Update Encryption Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}