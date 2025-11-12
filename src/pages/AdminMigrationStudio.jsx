
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  GitBranch, Play, CheckCircle, AlertCircle, Clock,
  Plus, Trash2, Save, Code, RefreshCw, Database
} from "lucide-react";
import { format } from "date-fns";

export default function AdminMigrationStudio() {
  const [migrations, setMigrations] = useState([
    {
      id: 'mig_001',
      version: '1.0.0',
      name: 'Initial Schema',
      status: 'completed',
      sql: 'CREATE TABLE Product (...);',
      created_date: new Date(2025, 0, 1),
      executed_date: new Date(2025, 0, 1)
    },
    {
      id: 'mig_002',
      version: '1.1.0',
      name: 'Add Loyalty Program',
      status: 'completed',
      sql: 'CREATE TABLE CustomerLoyalty (...);',
      created_date: new Date(2025, 0, 15),
      executed_date: new Date(2025, 0, 15)
    },
    {
      id: 'mig_003',
      version: '1.2.0',
      name: 'Add SEO Fields to Product',
      status: 'pending',
      sql: 'ALTER TABLE Product ADD COLUMN seo_title VARCHAR(60);',
      created_date: new Date(2025, 0, 28)
    }
  ]);

  const [newMigration, setNewMigration] = useState({
    version: '',
    name: '',
    sql: ''
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-amber-500';
      case 'failed': return 'bg-red-500';
      case 'rolling_back': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Migration Studio</h2>
          <p className="text-slate-400 font-semibold">Database schema version control & migrations</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          New Migration
        </Button>
      </div>

      {/* Migration Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <GitBranch className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">v1.2.0</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">3</p>
            <p className="text-slate-400 text-sm font-semibold">Total Migrations</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Success</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">2</p>
            <p className="text-slate-400 text-sm font-semibold">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">Pending</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">1</p>
            <p className="text-slate-400 text-sm font-semibold">Pending</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <Badge className="bg-red-500">Error</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">0</p>
            <p className="text-slate-400 text-sm font-semibold">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Migrations List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Migration History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {migrations.map((migration) => (
              <div key={migration.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor(migration.status)}>
                        {getStatusIcon(migration.status)}
                        <span className="ml-1">{migration.status}</span>
                      </Badge>
                      <Badge className="bg-purple-500">{migration.version}</Badge>
                      <h3 className="text-white font-bold text-lg">{migration.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>Created: {format(migration.created_date, 'MMM d, yyyy')}</span>
                      {migration.executed_date && (
                        <span>Executed: {format(migration.executed_date, 'MMM d, yyyy HH:mm')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {migration.status === 'pending' && (
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                    )}
                    {migration.status === 'completed' && (
                      <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <pre className="text-green-400 font-mono text-xs overflow-x-auto">
                    {migration.sql}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Migration */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Create New Migration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white font-bold mb-2 block text-sm">Version</label>
              <Input
                placeholder="1.3.0"
                value={newMigration.version}
                onChange={(e) => setNewMigration({...newMigration, version: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-white font-bold mb-2 block text-sm">Migration Name</label>
              <Input
                placeholder="Add new feature..."
                value={newMigration.name}
                onChange={(e) => setNewMigration({...newMigration, name: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-white font-bold mb-2 block text-sm">SQL Statement</label>
            <Textarea
              placeholder="ALTER TABLE Product ADD COLUMN new_field VARCHAR(255);"
              value={newMigration.sql}
              onChange={(e) => setNewMigration({...newMigration, sql: e.target.value})}
              className="bg-slate-900 border-slate-700 text-white h-32 font-mono text-sm"
            />
          </div>
          <Button className="bg-cyan-500 hover:bg-cyan-600">
            <Save className="w-4 h-4 mr-2" />
            Save Migration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
