import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch, Clock, CheckCircle, AlertTriangle, Code,
  Database, ArrowRight, RefreshCw, Download
} from "lucide-react";

export default function AdminDatabaseVersioning() {
  const migrations = [
    {
      version: 'v2.5.0',
      date: '2024-12-25',
      description: 'Added CustomerLoyalty table with indexes',
      changes: 8,
      status: 'applied',
      rollback: true
    },
    {
      version: 'v2.4.0',
      date: '2024-12-15',
      description: 'Enhanced Product schema with variants support',
      changes: 12,
      status: 'applied',
      rollback: true
    },
    {
      version: 'v2.3.0',
      date: '2024-12-01',
      description: 'Added audit logging infrastructure',
      changes: 6,
      status: 'applied',
      rollback: false
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Database Versioning</h2>
          <p className="text-slate-400 font-semibold">Track schema changes and manage migrations</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <GitBranch className="w-4 h-4 mr-2" />
          Create Migration
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <GitBranch className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">v2.5.0</p>
            <p className="text-slate-400 text-sm">Current Version</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{migrations.length}</p>
            <p className="text-slate-400 text-sm">Migrations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{migrations.reduce((sum, m) => sum + m.changes, 0)}</p>
            <p className="text-slate-400 text-sm">Total Changes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <RefreshCw className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{migrations.filter(m => m.rollback).length}</p>
            <p className="text-slate-400 text-sm">Rollback Ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Migration History */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Migration History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {migrations.map((migration, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-bold">{migration.version}</h4>
                          <Badge className="bg-green-500">{migration.status}</Badge>
                          {migration.rollback && (
                            <Badge className="bg-amber-500">Rollback Available</Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-1">{migration.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{migration.date}</span>
                          <span>{migration.changes} changes</span>
                        </div>
                      </div>
                    </div>
                    {migration.rollback && (
                      <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Rollback
                      </Button>
                    )}
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