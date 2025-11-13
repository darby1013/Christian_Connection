
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History, Search, Filter, Download, Eye, AlertCircle, CheckCircle,
  XCircle, Clock, User, Database, Lock, LogOut, Upload, Settings,
  Shield, FileText, Trash2, Edit2, Plus, Activity, TrendingUp,
  Calendar, BarChart3, Zap, RefreshCw, AlertTriangle, RotateCcw,
  Users, Sparkles, Brain // Added new icons from outline
} from "lucide-react";
// Removed date-fns imports as date filtering logic is now handled manually for simplicity
import AIAnomalyDetector from "../components/ai/AIAnomalyDetector";

export default function AdminAuditLog() {
  // State variables adapted to the new filtering paradigm from the outline
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterEntityId, setFilterEntityId] = useState('');
  const [selectedLog, setSelectedLog] = useState(null); // Kept for the detailed log modal

  const { data: auditLogs = [], refetch } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 1000), // Original fetch limit
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const actionTypes = [
    { value: 'create', label: 'Create', icon: Plus, color: 'green' },
    { value: 'update', label: 'Update', icon: Edit2, color: 'blue' },
    { value: 'delete', label: 'Delete', icon: Trash2, color: 'red' },
    { value: 'login', label: 'Login', icon: LogOut, color: 'cyan' },
    { value: 'logout', label: 'Logout', icon: LogOut, color: 'slate' },
    { value: 'export', label: 'Export', icon: Download, color: 'purple' },
    { value: 'import', label: 'Import', icon: Upload, color: 'amber' },
    { value: 'permission_change', label: 'Permission Change', icon: Lock, color: 'red' },
    { value: 'role_assign', label: 'Role Assigned', icon: Shield, color: 'green' },
    { value: 'role_remove', label: 'Role Removed', icon: Shield, color: 'red' },
    { value: 'password_change', label: 'Password Change', icon: Lock, color: 'amber' },
    { value: 'settings_change', label: 'Settings Change', icon: Settings, color: 'blue' },
    { value: 'backup_create', label: 'Backup Created', icon: Database, color: 'green' },
    { value: 'backup_restore', label: 'Backup Restored', icon: RefreshCw, color: 'amber' },
    { value: 'query_execute', label: 'Query Executed', icon: Database, color: 'cyan' },
    { value: 'schema_change', label: 'Schema Change', icon: Database, color: 'red' },
    { value: 'security_event', label: 'Security Event', icon: Shield, color: 'red' },
    { value: 'access_denied', label: 'Access Denied', icon: XCircle, color: 'red' },
  ];

  const getActionIcon = (actionType) => {
    const action = actionTypes.find(a => a.value === actionType);
    if (!action) return Activity;
    return action.icon;
  };

  const getActionColor = (actionType) => {
    const action = actionTypes.find(a => a.value === actionType);
    return action?.color || 'slate';
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'text-green-400';
      case 'failure': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'partial': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return CheckCircle;
      case 'failure': return XCircle;
      case 'warning': return AlertTriangle;
      case 'partial': return AlertCircle;
      default: return Activity;
    }
  };

  // Filter logic integrated from outline, adapted to use user_id for consistency with Select
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      log.action_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUser = filterUser === 'all' || log.user_id === filterUser;
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesEntityId = filterEntityId === '' || log.entity_id === filterEntityId;

    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const logDate = new Date(log.created_date);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize 'now' to start of today for comparison

      logDate.setHours(0, 0, 0, 0); // Normalize logDate to start of its day

      if (filterDateRange === 'today') {
        matchesDate = logDate.getTime() === now.getTime();
      } else if (filterDateRange === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        matchesDate = logDate.getTime() === yesterday.getTime();
      } else if (filterDateRange === 'last_7_days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6); // Includes today + 6 previous days
        matchesDate = logDate >= sevenDaysAgo;
      } else if (filterDateRange === 'last_30_days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 29); // Includes today + 29 previous days
        matchesDate = logDate >= thirtyDaysAgo;
      } else if (filterDateRange === 'last_90_days') {
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 89); // Includes today + 89 previous days
        matchesDate = logDate >= ninetyDaysAgo;
      }
    }

    return matchesSearch && matchesUser && matchesAction && matchesSeverity && matchesStatus && matchesDate && matchesEntityId;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setFilterAction("all");
    setFilterSeverity("all");
    setFilterStatus("all");
    setFilterUser("all");
    setFilterDateRange("all");
    setFilterEntityId("");
  };

  // Simplified stats calculation as per outline, also keeping uniqueUsersCount
  const totalLogs = auditLogs.length;
  const todayLogs = auditLogs.filter(log => {
    const logDate = new Date(log.created_date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;
  const criticalLogs = auditLogs.filter(log => log.severity === 'critical' || log.severity === 'high').length;
  const failedLogs = auditLogs.filter(log => log.status === 'failure').length;
  const uniqueUsersCount = new Set(auditLogs.map(log => log.user_id)).size;

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity', 'Status', 'Severity', 'IP Address', 'Description'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_date).toISOString(),
        log.user_name || log.user_email,
        log.action_type,
        log.entity_type || 'N/A',
        log.status,
        log.severity,
        log.ip_address || 'N/A',
        `"${log.action_description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header - Updated title and description as per outline */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Audit Log & AI Security Analysis</h2>
          <p className="text-slate-400 font-semibold">Track system activity and detect security anomalies with AI</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" className="border-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLogs} className="bg-cyan-500 hover:bg-cyan-600">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics - Updated to outline's simplified cards. Using filteredLogs.length for the 'filtered' count. */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <Eye className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{filteredLogs.length}</p>
            <p className="text-slate-400 text-sm">Filtered Logs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{todayLogs}</p>
            <p className="text-slate-400 text-sm">Today's Activity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <AlertCircle className="w-10 h-10 text-orange-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{criticalLogs}</p>
            <p className="text-slate-400 text-sm">Critical/High</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <XCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{failedLogs}</p>
            <p className="text-slate-400 text-sm">Failed Actions</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Anomaly Detector - Added as per outline */}
      <AIAnomalyDetector data={filteredLogs} dataType="audit" />

      {/* Enhanced Filters - Replaced with outline's simplified version, but retaining more filters from original */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Audit Logs
            </CardTitle>
            <Button onClick={resetFilters} size="sm" variant="outline" className="border-slate-700">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4"> {/* Adjusted grid columns to accommodate more filters */}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {/* Date Range */}
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">All Time</SelectItem>
                <SelectItem value="today" className="text-white">Today</SelectItem>
                <SelectItem value="yesterday" className="text-white">Yesterday</SelectItem>
                <SelectItem value="last_7_days" className="text-white">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days" className="text-white">Last 30 Days</SelectItem>
                <SelectItem value="last_90_days" className="text-white">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Type - Using the comprehensive actionTypes from original code */}
            <div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                  <SelectItem value="all" className="text-white">All Actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action.value} value={action.value} className="text-white">
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity - Kept from original filters for full functionality */}
            <div>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Severity</SelectItem>
                  <SelectItem value="critical" className="text-white">Critical</SelectItem>
                  <SelectItem value="high" className="text-white">High</SelectItem>
                  <SelectItem value="medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="low" className="text-white">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status - Kept from original filters for full functionality */}
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  <SelectItem value="success" className="text-white">Success</SelectItem>
                  <SelectItem value="failure" className="text-white">Failure</SelectItem>
                  <SelectItem value="warning" className="text-white">Warning</SelectItem>
                  <SelectItem value="partial" className="text-white">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User - Kept from original filters for full functionality */}
            <div>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                  <SelectItem value="all" className="text-white">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="text-white">
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity ID - Kept from original filters for full functionality */}
            <div>
              <Input
                placeholder="Filter by entity ID..."
                value={filterEntityId}
                onChange={(e) => setFilterEntityId(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table - Replaced with outline's simplified version, but adding back onClick for modal */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Audit Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No Audit Logs Found</h3>
              <p className="text-slate-400 mb-4">Try adjusting your filters or search criteria</p>
              <Button onClick={resetFilters} className="bg-cyan-500 hover:bg-cyan-600">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {/* Added slice(0, 50) as seen in the outline for a truncated list, if desired */}
              {filteredLogs.slice(0, 50).map(log => {
                const ActionIcon = getActionIcon(log.action_type);
                const actionColor = getActionColor(log.action_type);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)} // Re-added to trigger the detailed log modal
                  >
                    <ActionIcon className={`w-5 h-5 text-${actionColor}-400 flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-sm">{log.action_description}</p>
                        {/* Dynamic badge color based on action type */}
                        <Badge className={`bg-${actionColor}-500 text-xs`}>{log.action_type}</Badge>
                        {log.severity && (
                          <Badge className={`${getSeverityColor(log.severity)} text-xs`}>
                            {log.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">
                        <User className="inline-block w-3 h-3 mr-1 align-middle" /> {log.user_name || log.user_email} •
                        <Clock className="inline-block w-3 h-3 ml-2 mr-1 align-middle" /> {new Date(log.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Notice - Removed as it was not present in the outline's JSX */}

      {/* Detailed Log Modal - Kept for full functionality, triggered by clicking log items */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <Card className="bg-[#1a1f3a] border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold flex items-center justify-between">
                <span>Audit Log Details</span>
                <Button size="sm" variant="ghost" onClick={() => setSelectedLog(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Action Type</Label>
                    <p className="text-white font-bold">{selectedLog.action_type}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Status</Label>
                    <p className="text-white font-bold">{selectedLog.status}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">User</Label>
                    <p className="text-white font-bold">{selectedLog.user_name} ({selectedLog.user_email})</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Timestamp</Label>
                    <p className="text-white font-bold">{new Date(selectedLog.created_date).toLocaleString()}</p>
                  </div>
                  {selectedLog.entity_type && (
                    <>
                      <div>
                        <Label className="text-slate-400 text-sm">Entity Type</Label>
                        <p className="text-white font-bold">{selectedLog.entity_type}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Entity ID</Label>
                        <p className="text-white font-mono text-sm">{selectedLog.entity_id}</p>
                      </div>
                    </>
                  )}
                  {selectedLog.ip_address && (
                    <div>
                      <Label className="text-slate-400 text-sm">IP Address</Label>
                      <p className="text-white font-mono text-sm">{selectedLog.ip_address}</p>
                    </div>
                  )}
                  {selectedLog.response_time && (
                    <div>
                      <Label className="text-slate-400 text-sm">Response Time</Label>
                      <p className="text-white font-bold">{selectedLog.response_time}ms</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label className="text-slate-400 text-sm mb-2 block">Description</Label>
                  <p className="text-white bg-slate-900/50 p-4 rounded-lg">{selectedLog.action_description}</p>
                </div>

                {/* Changes */}
                {selectedLog.changes && (
                  <div>
                    <Label className="text-slate-400 text-sm mb-2 block">Changes Made</Label>
                    <pre className="text-white bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && (
                  <div>
                    <Label className="text-slate-400 text-sm mb-2 block">Additional Metadata</Label>
                    <pre className="text-white bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
