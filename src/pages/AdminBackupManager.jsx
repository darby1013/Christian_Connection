import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Archive, Download, RefreshCw, Clock, Database,
  CheckCircle, AlertTriangle, Play, Trash2, Copy
} from "lucide-react";
import { format } from "date-fns";

export default function AdminBackupManager() {
  const [creating, setCreating] = useState(false);
  const [backupName, setBackupName] = useState('');
  
  const [backups] = useState([
    {
      id: 1,
      name: 'Auto Backup - Daily',
      type: 'automatic',
      size: '245 MB',
      records: 15234,
      created_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: 2,
      name: 'Pre-Migration Backup',
      type: 'manual',
      size: '238 MB',
      records: 14891,
      created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: 3,
      name: 'Monthly Archive',
      type: 'scheduled',
      size: '250 MB',
      records: 15456,
      created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'completed'
    }
  ]);

  const createBackup = () => {
    setCreating(true);
    setTimeout(() => {
      alert('✅ Backup created successfully!');
      setCreating(false);
      setBackupName('');
    }, 3000);
  };

  const downloadBackup = (backup) => {
    const dumpContent = `-- Glory Wave Database Backup
-- Backup: ${backup.name}
-- Created: ${format(backup.created_date, 'yyyy-MM-dd HH:mm:ss')}
-- Total Records: ${backup.records}

-- ============================================
-- FULL DATABASE DUMP
-- ============================================

-- Products
INSERT INTO Product VALUES (...);

-- Orders  
INSERT INTO \`Order\` VALUES (...);

-- Customers
INSERT INTO CustomerLoyalty VALUES (...);

-- ============================================
-- END OF BACKUP
-- ============================================
`;

    const blob = new Blob([dumpContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.name.replace(/\s/g, '_')}_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeBadge = (type) => {
    const badges = {
      automatic: <Badge className="bg-blue-500">Auto</Badge>,
      manual: <Badge className="bg-purple-500">Manual</Badge>,
      scheduled: <Badge className="bg-green-500">Scheduled</Badge>
    };
    return badges[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Backup Manager</h2>
          <p className="text-slate-400 font-semibold">Database backup, restore, and version control</p>
        </div>
      </div>

      {/* Create Backup */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-purple-500/30">
        <CardHeader className="border-b border-purple-500/30">
          <CardTitle className="text-white font-bold">Create New Backup</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-white font-bold mb-2 block">Backup Name (Optional)</Label>
            <Input
              placeholder="e.g., Before Major Update"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <Button
            onClick={createBackup}
            disabled={creating}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold h-12"
          >
            {creating ? (
              <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Creating Backup...</>
            ) : (
              <><Archive className="w-5 h-5 mr-2" />Create Full Database Backup</>
            )}
          </Button>

          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-center">
            <p className="text-blue-300 text-sm">
              <Clock className="w-4 h-4 inline mr-1" />
              Automatic backups run daily at 3:00 AM
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {backups.map((backup) => (
            <Card key={backup.id} className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-bold text-lg">{backup.name}</h4>
                      {getTypeBadge(backup.type)}
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {backup.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Size</p>
                        <p className="text-white font-bold">{backup.size}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Records</p>
                        <p className="text-white font-bold">{backup.records.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Created</p>
                        <p className="text-white font-bold">{format(backup.created_date, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadBackup(backup)}
                      className="bg-cyan-500 hover:bg-cyan-600"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}