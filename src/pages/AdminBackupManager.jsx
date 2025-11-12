import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Archive, Download, RefreshCw, Clock, Database,
  CheckCircle, AlertTriangle, Play, Trash2, Copy,
  Settings, Calendar, CloudUpload, HardDrive, Shield,
  Upload, RotateCcw, Zap, Server, CloudDownload
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function AdminBackupManager() {
  const [backups, setBackups] = useState([
    {
      id: 'bak_001',
      name: 'Auto Backup - Daily',
      type: 'automatic',
      size: '456.8 MB',
      records: 15420,
      created_date: new Date(2025, 0, 28, 3, 0),
      status: 'completed',
      location: 'aws_s3',
      retention_days: 30
    },
    {
      id: 'bak_002',
      name: 'Pre-Migration Backup',
      type: 'manual',
      size: '452.1 MB',
      records: 15200,
      created_date: new Date(2025, 0, 27, 14, 30),
      status: 'completed',
      location: 'local',
      retention_days: 90
    },
    {
      id: 'bak_003',
      name: 'Weekly Full Backup',
      type: 'scheduled',
      size: '458.9 MB',
      records: 15650,
      created_date: new Date(2025, 0, 26, 2, 0),
      status: 'completed',
      location: 'google_cloud',
      retention_days: 60
    }
  ]);

  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: true,
    frequency: 'daily',
    time: '03:00',
    retention_days: 30,
    destination: 'aws_s3',
    backup_type: 'full',
    compress: true,
    encrypt: true
  });

  const [offsiteConfig, setOffsiteConfig] = useState({
    aws_s3_enabled: true,
    aws_s3_bucket: 'glorywave-backups-prod',
    aws_s3_region: 'us-east-1',
    google_cloud_enabled: false,
    google_cloud_bucket: '',
    azure_enabled: false,
    azure_container: ''
  });

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showOffsiteDialog, setShowOffsiteDialog] = useState(false);
  const [showRestoreWizard, setShowRestoreWizard] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreStep, setRestoreStep] = useState(1);
  const [restoreOptions, setRestoreOptions] = useState({
    restore_schema: true,
    restore_data: true,
    restore_indexes: true,
    restore_constraints: true,
    create_pre_restore_backup: true
  });
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  const createManualBackup = () => {
    const newBackup = {
      id: `bak_${Date.now()}`,
      name: `Manual Backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      type: 'manual',
      size: '459.2 MB',
      records: 15680,
      created_date: new Date(),
      status: 'completed',
      location: scheduleConfig.destination,
      retention_days: 90
    };
    setBackups([newBackup, ...backups]);
    alert('✅ Manual backup created successfully!');
  };

  const downloadBackup = (backup) => {
    const sql = generateBackupSQL(backup);
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glorywave_backup_${backup.id}_${format(backup.created_date, 'yyyy-MM-dd')}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startRestore = (backup) => {
    setSelectedBackup(backup);
    setRestoreStep(1);
    setShowRestoreWizard(true);
  };

  const executeRestore = () => {
    setRestoring(true);
    setRestoreProgress(0);

    // Simulate restore progress
    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setRestoring(false);
            setShowRestoreWizard(false);
            setRestoreStep(1);
            alert('✅ Database restored successfully!');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const deleteBackup = (id) => {
    if (confirm('Delete this backup? This cannot be undone.')) {
      setBackups(backups.filter(b => b.id !== id));
      alert('✅ Backup deleted');
    }
  };

  const saveScheduleConfig = () => {
    alert('✅ Backup schedule saved successfully!');
    setShowScheduleDialog(false);
  };

  const saveOffsiteConfig = () => {
    alert('✅ Offsite backup configuration saved!');
    setShowOffsiteDialog(false);
  };

  const getLocationIcon = (location) => {
    switch(location) {
      case 'aws_s3': return <CloudUpload className="w-4 h-4 text-orange-400" />;
      case 'google_cloud': return <CloudUpload className="w-4 h-4 text-blue-400" />;
      case 'azure': return <CloudUpload className="w-4 h-4 text-cyan-400" />;
      case 'local': return <HardDrive className="w-4 h-4 text-slate-400" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getLocationBadgeClass = (location) => {
    switch(location) {
      case 'aws_s3': return 'bg-orange-500';
      case 'google_cloud': return 'bg-blue-500';
      case 'azure': return 'bg-cyan-500';
      case 'local': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Backup Manager</h2>
          <p className="text-slate-400 font-semibold">Enterprise-grade backup & restore system</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowOffsiteDialog(true)} variant="outline" className="border-slate-700 text-slate-300">
            <CloudUpload className="w-4 h-4 mr-2" />
            Offsite Config
          </Button>
          <Button onClick={() => setShowScheduleDialog(true)} className="bg-purple-500 hover:bg-purple-600">
            <Settings className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button onClick={createManualBackup} className="bg-cyan-500 hover:bg-cyan-600">
            <Archive className="w-4 h-4 mr-2" />
            Backup Now
          </Button>
        </div>
      </div>

      {/* Backup Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Archive className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{backups.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{backups.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Backups</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">Storage</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">1.37 GB</p>
            <p className="text-slate-400 text-sm font-semibold">Total Size</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CloudUpload className="w-8 h-8 text-orange-400" />
              <Badge className="bg-orange-500">AWS S3</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">2</p>
            <p className="text-slate-400 text-sm font-semibold">Offsite Backups</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Next</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">03:00</p>
            <p className="text-slate-400 text-sm font-semibold">Tomorrow</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Schedule Status */}
      {scheduleConfig.enabled && (
        <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-lg mb-1">Automated Backups Active</h3>
                <p className="text-green-200 text-sm">
                  {scheduleConfig.frequency.charAt(0).toUpperCase() + scheduleConfig.frequency.slice(1)} backups at {scheduleConfig.time} 
                  • Retention: {scheduleConfig.retention_days} days
                  • Destination: {scheduleConfig.destination.toUpperCase().replace('_', ' ')}
                </p>
              </div>
              <Button size="sm" onClick={() => setShowScheduleDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Settings className="w-3 h-3 mr-1" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backups List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Backup History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {backups.map((backup) => (
              <div key={backup.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{backup.name}</h3>
                      <Badge className={`${backup.type === 'automatic' ? 'bg-green-500' : backup.type === 'manual' ? 'bg-cyan-500' : 'bg-purple-500'}`}>
                        {backup.type}
                      </Badge>
                      <Badge className={getLocationBadgeClass(backup.location)}>
                        {getLocationIcon(backup.location)}
                        <span className="ml-1">{backup.location.toUpperCase().replace('_', ' ')}</span>
                      </Badge>
                      {backup.status === 'completed' && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Database className="w-4 h-4" />
                        {backup.size}
                      </span>
                      <span>{backup.records.toLocaleString()} records</span>
                      <span>{format(backup.created_date, 'MMM d, yyyy HH:mm')}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Expires: {format(new Date(backup.created_date.getTime() + backup.retention_days * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {backup.location !== 'local' && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge className="bg-blue-500/20 text-blue-300">
                          <CloudUpload className="w-3 h-3 mr-1" />
                          Offsite Storage
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-300">
                          <Shield className="w-3 h-3 mr-1" />
                          Encrypted
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => downloadBackup(backup)} className="bg-cyan-500 hover:bg-cyan-600">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" onClick={() => startRestore(backup)} className="bg-green-500 hover:bg-green-600">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                    <Button size="sm" onClick={() => deleteBackup(backup.id)} variant="outline" className="border-red-500/30 text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Automated Backup Schedule
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure automatic backup frequency and retention policies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div>
                <Label className="text-white font-bold mb-1 block">Automated Backups</Label>
                <p className="text-slate-400 text-sm">Enable scheduled automatic backups</p>
              </div>
              <Checkbox
                checked={scheduleConfig.enabled}
                onCheckedChange={(checked) => setScheduleConfig({...scheduleConfig, enabled: checked})}
              />
            </div>

            {scheduleConfig.enabled && (
              <>
                {/* Frequency */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Backup Frequency</Label>
                  <Select value={scheduleConfig.frequency} onValueChange={(value) => setScheduleConfig({...scheduleConfig, frequency: value})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="hourly" className="text-white">Hourly</SelectItem>
                      <SelectItem value="daily" className="text-white">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-white">Weekly (Sunday)</SelectItem>
                      <SelectItem value="monthly" className="text-white">Monthly (1st of month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Backup Time (24-hour format)</Label>
                  <Input
                    type="time"
                    value={scheduleConfig.time}
                    onChange={(e) => setScheduleConfig({...scheduleConfig, time: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                {/* Retention Policy */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Retention Policy (days)</Label>
                  <Select value={scheduleConfig.retention_days.toString()} onValueChange={(value) => setScheduleConfig({...scheduleConfig, retention_days: parseInt(value)})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="7" className="text-white">7 days</SelectItem>
                      <SelectItem value="14" className="text-white">14 days</SelectItem>
                      <SelectItem value="30" className="text-white">30 days (Recommended)</SelectItem>
                      <SelectItem value="60" className="text-white">60 days</SelectItem>
                      <SelectItem value="90" className="text-white">90 days</SelectItem>
                      <SelectItem value="180" className="text-white">180 days</SelectItem>
                      <SelectItem value="365" className="text-white">365 days (1 year)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-slate-500 text-xs mt-1">Backups older than this will be automatically deleted</p>
                </div>

                {/* Destination */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Backup Destination</Label>
                  <Select value={scheduleConfig.destination} onValueChange={(value) => setScheduleConfig({...scheduleConfig, destination: value})}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="local" className="text-white">Local Server</SelectItem>
                      <SelectItem value="aws_s3" className="text-white">AWS S3</SelectItem>
                      <SelectItem value="google_cloud" className="text-white">Google Cloud Storage</SelectItem>
                      <SelectItem value="azure" className="text-white">Azure Blob Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Backup Options */}
                <div className="space-y-3">
                  <Label className="text-white font-bold block">Backup Options</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={scheduleConfig.compress} onCheckedChange={(checked) => setScheduleConfig({...scheduleConfig, compress: checked})} />
                      <span className="text-slate-300 text-sm">Compress backups (reduces size by 60-70%)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={scheduleConfig.encrypt} onCheckedChange={(checked) => setScheduleConfig({...scheduleConfig, encrypt: checked})} />
                      <span className="text-slate-300 text-sm">Encrypt backups (AES-256)</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={saveScheduleConfig} className="bg-purple-500 hover:bg-purple-600">
              <Save className="w-4 h-4 mr-2" />
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offsite Configuration Dialog */}
      <Dialog open={showOffsiteDialog} onOpenChange={setShowOffsiteDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <CloudUpload className="w-6 h-6 text-orange-400" />
              Offsite Backup Configuration
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure cloud storage for automatic offsite backups
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* AWS S3 */}
            <Card className="bg-slate-900/50 border-orange-500/30">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                    <CloudUpload className="w-5 h-5 text-orange-400" />
                    AWS S3
                  </CardTitle>
                  <Checkbox
                    checked={offsiteConfig.aws_s3_enabled}
                    onCheckedChange={(checked) => setOffsiteConfig({...offsiteConfig, aws_s3_enabled: checked})}
                  />
                </div>
              </CardHeader>
              {offsiteConfig.aws_s3_enabled && (
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-white font-bold mb-2 block text-sm">S3 Bucket Name</Label>
                    <Input
                      placeholder="my-backup-bucket"
                      value={offsiteConfig.aws_s3_bucket}
                      onChange={(e) => setOffsiteConfig({...offsiteConfig, aws_s3_bucket: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold mb-2 block text-sm">AWS Region</Label>
                    <Select value={offsiteConfig.aws_s3_region} onValueChange={(value) => setOffsiteConfig({...offsiteConfig, aws_s3_region: value})}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="us-east-1" className="text-white">US East (N. Virginia)</SelectItem>
                        <SelectItem value="us-west-2" className="text-white">US West (Oregon)</SelectItem>
                        <SelectItem value="eu-west-1" className="text-white">EU (Ireland)</SelectItem>
                        <SelectItem value="ap-southeast-1" className="text-white">Asia Pacific (Singapore)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded">
                    <p className="text-orange-300 text-xs">
                      💡 AWS credentials should be configured in environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Google Cloud Storage */}
            <Card className="bg-slate-900/50 border-blue-500/30">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                    <CloudUpload className="w-5 h-5 text-blue-400" />
                    Google Cloud Storage
                  </CardTitle>
                  <Checkbox
                    checked={offsiteConfig.google_cloud_enabled}
                    onCheckedChange={(checked) => setOffsiteConfig({...offsiteConfig, google_cloud_enabled: checked})}
                  />
                </div>
              </CardHeader>
              {offsiteConfig.google_cloud_enabled && (
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-white font-bold mb-2 block text-sm">GCS Bucket Name</Label>
                    <Input
                      placeholder="glorywave-backups"
                      value={offsiteConfig.google_cloud_bucket}
                      onChange={(e) => setOffsiteConfig({...offsiteConfig, google_cloud_bucket: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                    <p className="text-blue-300 text-xs">
                      💡 Service account JSON key should be configured in GOOGLE_APPLICATION_CREDENTIALS
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Azure Blob Storage */}
            <Card className="bg-slate-900/50 border-cyan-500/30">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                    <CloudUpload className="w-5 h-5 text-cyan-400" />
                    Azure Blob Storage
                  </CardTitle>
                  <Checkbox
                    checked={offsiteConfig.azure_enabled}
                    onCheckedChange={(checked) => setOffsiteConfig({...offsiteConfig, azure_enabled: checked})}
                  />
                </div>
              </CardHeader>
              {offsiteConfig.azure_enabled && (
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-white font-bold mb-2 block text-sm">Container Name</Label>
                    <Input
                      placeholder="backups"
                      value={offsiteConfig.azure_container}
                      onChange={(e) => setOffsiteConfig({...offsiteConfig, azure_container: e.target.value})}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded">
                    <p className="text-cyan-300 text-xs">
                      💡 Azure connection string should be in AZURE_STORAGE_CONNECTION_STRING
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOffsiteDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={saveOffsiteConfig} className="bg-cyan-500 hover:bg-cyan-600">
              <CloudUpload className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Wizard Dialog */}
      <Dialog open={showRestoreWizard} onOpenChange={setShowRestoreWizard}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-green-400" />
              Database Restore Wizard
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedBackup?.name} - {selectedBackup?.size}
            </DialogDescription>
          </DialogHeader>

          {!restoring ? (
            <div className="py-4">
              {/* Step Indicators */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      restoreStep >= step ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${restoreStep > step ? 'bg-green-500' : 'bg-slate-700'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              {restoreStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg mb-4">Step 1: Select Restore Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <Checkbox
                        checked={restoreOptions.restore_schema}
                        onCheckedChange={(checked) => setRestoreOptions({...restoreOptions, restore_schema: checked})}
                      />
                      <div>
                        <p className="text-white font-semibold">Restore Schema</p>
                        <p className="text-slate-400 text-xs">Tables, columns, data types</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <Checkbox
                        checked={restoreOptions.restore_data}
                        onCheckedChange={(checked) => setRestoreOptions({...restoreOptions, restore_data: checked})}
                      />
                      <div>
                        <p className="text-white font-semibold">Restore Data</p>
                        <p className="text-slate-400 text-xs">All records and content</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <Checkbox
                        checked={restoreOptions.restore_indexes}
                        onCheckedChange={(checked) => setRestoreOptions({...restoreOptions, restore_indexes: checked})}
                      />
                      <div>
                        <p className="text-white font-semibold">Restore Indexes</p>
                        <p className="text-slate-400 text-xs">Performance indexes</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <Checkbox
                        checked={restoreOptions.restore_constraints}
                        onCheckedChange={(checked) => setRestoreOptions({...restoreOptions, restore_constraints: checked})}
                      />
                      <div>
                        <p className="text-white font-semibold">Restore Constraints</p>
                        <p className="text-slate-400 text-xs">Foreign keys, unique constraints</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {restoreStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg mb-4">Step 2: Safety Precautions</h3>
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                      <div>
                        <h4 className="text-red-300 font-bold mb-1">Warning: This will overwrite existing data</h4>
                        <p className="text-red-200 text-sm">
                          Restoring this backup will replace your current database. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg cursor-pointer">
                    <Checkbox
                      checked={restoreOptions.create_pre_restore_backup}
                      onCheckedChange={(checked) => setRestoreOptions({...restoreOptions, create_pre_restore_backup: checked})}
                    />
                    <div>
                      <p className="text-green-300 font-semibold">Create Pre-Restore Backup (Recommended)</p>
                      <p className="text-green-200 text-xs">Automatically backup current database before restoring</p>
                    </div>
                  </label>
                </div>
              )}

              {restoreStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg mb-4">Step 3: Confirm Restore</h3>
                  <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                    <h4 className="text-white font-bold mb-4">Restore Summary:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Backup:</span>
                        <span className="text-white font-semibold">{selectedBackup?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Size:</span>
                        <span className="text-white font-semibold">{selectedBackup?.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Records:</span>
                        <span className="text-white font-semibold">{selectedBackup?.records.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-white font-semibold">{selectedBackup && format(selectedBackup.created_date, 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 my-4" />
                    <h4 className="text-white font-bold mb-3">Will Restore:</h4>
                    <div className="space-y-2">
                      {restoreOptions.restore_schema && (
                        <div className="flex items-center gap-2 text-green-300 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Database schema
                        </div>
                      )}
                      {restoreOptions.restore_data && (
                        <div className="flex items-center gap-2 text-green-300 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          All data records
                        </div>
                      )}
                      {restoreOptions.restore_indexes && (
                        <div className="flex items-center gap-2 text-green-300 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Performance indexes
                        </div>
                      )}
                      {restoreOptions.restore_constraints && (
                        <div className="flex items-center gap-2 text-green-300 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Foreign key constraints
                        </div>
                      )}
                      {restoreOptions.create_pre_restore_backup && (
                        <div className="flex items-center gap-2 text-cyan-300 text-sm">
                          <Archive className="w-4 h-4" />
                          Create pre-restore backup first
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8">
              <div className="text-center mb-6">
                <RefreshCw className="w-16 h-16 text-green-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-white font-bold text-xl mb-2">Restoring Database...</h3>
                <p className="text-slate-400">Please do not close this window</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white font-bold">{restoreProgress}%</span>
                </div>
                <Progress value={restoreProgress} className="h-3" />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-2 rounded ${restoreProgress >= 25 ? 'bg-green-900/20 text-green-300' : 'bg-slate-800 text-slate-500'}`}>
                    {restoreProgress >= 25 ? '✓' : '○'} Schema restored
                  </div>
                  <div className={`p-2 rounded ${restoreProgress >= 50 ? 'bg-green-900/20 text-green-300' : 'bg-slate-800 text-slate-500'}`}>
                    {restoreProgress >= 50 ? '✓' : '○'} Data imported
                  </div>
                  <div className={`p-2 rounded ${restoreProgress >= 75 ? 'bg-green-900/20 text-green-300' : 'bg-slate-800 text-slate-500'}`}>
                    {restoreProgress >= 75 ? '✓' : '○'} Indexes rebuilt
                  </div>
                  <div className={`p-2 rounded ${restoreProgress >= 100 ? 'bg-green-900/20 text-green-300' : 'bg-slate-800 text-slate-500'}`}>
                    {restoreProgress >= 100 ? '✓' : '○'} Constraints applied
                  </div>
                </div>
              </div>
            </div>
          )}

          {!restoring && (
            <DialogFooter>
              {restoreStep > 1 && (
                <Button variant="outline" onClick={() => setRestoreStep(restoreStep - 1)} className="border-slate-700">
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={() => { setShowRestoreWizard(false); setRestoreStep(1); }} className="border-slate-700">
                Cancel
              </Button>
              {restoreStep < 3 ? (
                <Button onClick={() => setRestoreStep(restoreStep + 1)} className="bg-cyan-500 hover:bg-cyan-600">
                  Next Step
                </Button>
              ) : (
                <Button onClick={executeRestore} className="bg-green-500 hover:bg-green-600">
                  <Play className="w-4 h-4 mr-2" />
                  Start Restore
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function generateBackupSQL(backup) {
  return `-- Glory Wave Database Backup
-- Backup ID: ${backup.id}
-- Created: ${format(backup.created_date, 'PPpp')}
-- Type: ${backup.type}
-- Records: ${backup.records}
-- Location: ${backup.location}

-- Full SQL content would be here...
-- This is a simplified version for demo purposes

SET FOREIGN_KEY_CHECKS=0;

-- Table schemas, data, indexes, constraints...

SET FOREIGN_KEY_CHECKS=1;
`;
}