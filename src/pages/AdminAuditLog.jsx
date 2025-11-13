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
  Calendar, BarChart3, Zap, RefreshCw, AlertTriangle, RotateCcw
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

export default function AdminAuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: auditLogs = [], refetch } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 1000),
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

  const filterByDateRange = (log) => {
    const logDate = new Date(log.created_date);
    const today = new Date();

    switch(dateFilter) {
      case 'today':
        return isWithinInterval(logDate, { start: startOfDay(today), end: endOfDay(today) });
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return isWithinInterval(logDate, { start: startOfDay(yesterday), end: endOfDay(yesterday) });
      case 'last7days':
        return isWithinInterval(logDate, { start: subDays(today, 7), end: today });
      case 'last30days':
        return isWithinInterval(logDate, { start: subDays(today, 30), end: today });
      case 'last90days':
        return isWithinInterval(logDate, { start: subDays(today, 90), end: today });
      case 'custom':
        if (customStartDate && customEndDate) {
          return isWithinInterval(logDate, {
            start: startOfDay(new Date(customStartDate)),
            end: endOfDay(new Date(customEndDate))
          });
        }
        return true;
      default:
        return true;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery && !log.action_description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.user_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (selectedAction !== 'all' && log.action_type !== selectedAction) return false;
    if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
    if (selectedUser !== 'all' && log.user_id !== selectedUser) return false;
    if (entityIdFilter && log.entity_id !== entityIdFilter) return false;
    if (!filterByDateRange(log)) return false;

    return true;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedAction("all");
    setSelectedSeverity("all");
    setSelectedStatus("all");
    setSelectedUser("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setEntityIdFilter("");
  };

  const stats = {
    total: auditLogs.length,
    filtered: filteredLogs.length,
    today: auditLogs.filter(log => {
      const logDate = new Date(log.created_date);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    criticalEvents: auditLogs.filter(log => log.severity === 'critical').length,
    failedActions: auditLogs.filter(log => log.status === 'failure').length,
    uniqueUsers: new Set(auditLogs.map(log => log.user_id)).size,
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Comprehensive Audit Log</h2>
          <p className="text-slate-400 font-semibold">Complete system activity tracking with advanced filtering and compliance support</p>
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

      {/* Statistics */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <History className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">Total</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.total}</p>
            <p className="text-slate-400 text-sm font-semibold">All Events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Filter className="w-10 h-10 text-blue-400" />
              <Badge className="bg-blue-500">Filtered</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.filtered}</p>
            <p className="text-slate-400 text-sm font-semibold">Showing</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Today</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.today}</p>
            <p className="text-slate-400 text-sm font-semibold">Today's Activity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <Badge className="bg-red-500">Critical</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.criticalEvents}</p>
            <p className="text-slate-400 text-sm font-semibold">Critical Events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-10 h-10 text-orange-400" />
              <Badge className="bg-orange-500">Failed</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.failedActions}</p>
            <p className="text-slate-400 text-sm font-semibold">Failed Actions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <User className="w-10 h-10 text-purple-400" />
              <Badge className="bg-purple-500">Active</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.uniqueUsers}</p>
            <p className="text-slate-400 text-sm font-semibold">Unique Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
            <Button onClick={resetFilters} size="sm" variant="outline" className="border-slate-700">
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label className="text-white font-bold mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Action Type</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
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

              <div>
                <Label className="text-white font-bold mb-2 block">Severity</Label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
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
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
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

              <div>
                <Label className="text-white font-bold mb-2 block">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
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

              <div>
                <Label className="text-white font-bold mb-2 block">Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">All Time</SelectItem>
                    <SelectItem value="today" className="text-white">Today</SelectItem>
                    <SelectItem value="yesterday" className="text-white">Yesterday</SelectItem>
                    <SelectItem value="last7days" className="text-white">Last 7 Days</SelectItem>
                    <SelectItem value="last30days" className="text-white">Last 30 Days</SelectItem>
                    <SelectItem value="last90days" className="text-white">Last 90 Days</SelectItem>
                    <SelectItem value="custom" className="text-white">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Entity ID</Label>
                <Input
                  placeholder="Filter by entity ID..."
                  value={entityIdFilter}
                  onChange={(e) => setEntityIdFilter(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div>
                  <Label className="text-white font-bold mb-2 block">Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rest of existing audit log table code... */}
      {/* Audit Log Table */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">
              Activity Log ({filteredLogs.length} {filteredLogs.length !== stats.total ? `of ${stats.total}` : ''} entries)
            </CardTitle>
          </div>
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
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action_type);
                const StatusIcon = getStatusIcon(log.status);
                const actionColor = getActionColor(log.action_type);
                
                return (
                  <div 
                    key={log.id} 
                    className="p-6 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl bg-${actionColor}-500/20 border border-${actionColor}-500/30 flex items-center justify-center flex-shrink-0`}>
                          <ActionIcon className={`w-6 h-6 text-${actionColor}-400`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-white font-bold text-base">{log.action_description}</h4>
                            <StatusIcon className={`w-4 h-4 ${getStatusColor(log.status)}`} />
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                            {log.is_automated && (
                              <Badge className="bg-purple-500">
                                <Zap className="w-3 h-3 mr-1" />
                                Automated
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{log.user_name || log.user_email}</span>
                            </div>
                            
                            {log.entity_type && (
                              <div className="flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                <span>{log.entity_type}</span>
                                {log.entity_name && <span className="text-cyan-400">• {log.entity_name}</span>}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(log.created_date), 'PPpp')}</span>
                            </div>
                            
                            {log.ip_address && (
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>{log.ip_address}</span>
                              </div>
                            )}

                            {log.response_time && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{log.response_time}ms</span>
                              </div>
                            )}
                          </div>

                          {log.changes?.fields_changed && log.changes.fields_changed.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {log.changes.fields_changed.map(field => (
                                <Badge key={field} className="bg-slate-700 text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {log.tags && log.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {log.tags.map(tag => (
                                <Badge key={tag} className="bg-blue-500/20 text-blue-300 text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {log.error_message && (
                            <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-xs">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
        <CardHeader className="border-b border-blue-500/30">
          <CardTitle className="text-blue-300 font-bold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-white font-bold">GDPR Compliant</p>
              <p className="text-blue-200 text-xs mt-1">Data protection ready</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-white font-bold">SOC 2 Ready</p>
              <p className="text-blue-200 text-xs mt-1">Security controls</p>
            </div>
            <div className="text-center">
              <Lock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-bold">Encrypted Logs</p>
              <p className="text-blue-200 text-xs mt-1">256-bit encryption</p>
            </div>
            <div className="text-center">
              <History className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-white font-bold">7-Year Retention</p>
              <p className="text-blue-200 text-xs mt-1">Complete history</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Log Modal */}
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
                    <p className="text-white font-bold">{format(new Date(selectedLog.created_date), 'PPpp')}</p>
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