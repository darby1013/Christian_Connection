import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity, User, Filter, Search, Calendar, AlertTriangle,
  CheckCircle, Settings, ShoppingBag, FileText, Shield,
  Database, Eye, Download, RefreshCw, TrendingUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminActivityFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const { data: activities = [], refetch } = useQuery({
    queryKey: ['allActivities'],
    queryFn: () => base44.entities.UserActivity.list('-created_date', 500),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const actionTypes = [
    'content_created', 'content_updated', 'content_deleted',
    'user_created', 'user_updated', 'user_deleted',
    'role_assigned', 'role_unassigned',
    'order_placed', 'order_updated',
    'product_created', 'product_updated',
    'setting_changed', 'login', 'logout',
    'permission_changed', 'system_alert',
    'backup_created', 'database_query'
  ];

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    // Search filter
    if (searchQuery && !activity.action_description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !activity.entity_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // User filter
    if (selectedUser !== 'all' && activity.user_id !== selectedUser) {
      return false;
    }

    // Action type filter
    if (selectedActionType !== 'all' && activity.action_type !== selectedActionType) {
      return false;
    }

    // Severity filter
    if (selectedSeverity !== 'all' && activity.severity !== selectedSeverity) {
      return false;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const activityDate = new Date(activity.created_date);
      const now = new Date();
      const diffTime = Math.abs(now - activityDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateRange === '1day' && diffDays > 1) return false;
      if (dateRange === '7days' && diffDays > 7) return false;
      if (dateRange === '30days' && diffDays > 30) return false;
    }

    return true;
  });

  const getActionIcon = (actionType) => {
    switch(actionType) {
      case 'content_created':
      case 'content_updated':
      case 'content_deleted': return <FileText className="w-4 h-4" />;
      case 'user_created':
      case 'user_updated':
      case 'user_deleted': return <User className="w-4 h-4" />;
      case 'role_assigned':
      case 'role_unassigned':
      case 'permission_changed': return <Shield className="w-4 h-4" />;
      case 'order_placed':
      case 'order_updated': return <ShoppingBag className="w-4 h-4" />;
      case 'product_created':
      case 'product_updated': return <ShoppingBag className="w-4 h-4" />;
      case 'setting_changed': return <Settings className="w-4 h-4" />;
      case 'system_alert': return <AlertTriangle className="w-4 h-4" />;
      case 'backup_created': return <Database className="w-4 h-4" />;
      case 'database_query': return <Database className="w-4 h-4" />;
      case 'login':
      case 'logout': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType) => {
    switch(actionType) {
      case 'content_created':
      case 'user_created':
      case 'product_created': return 'bg-green-500';
      case 'content_updated':
      case 'user_updated':
      case 'order_updated': return 'bg-blue-500';
      case 'content_deleted':
      case 'user_deleted': return 'bg-red-500';
      case 'role_assigned':
      case 'role_unassigned': return 'bg-purple-500';
      case 'order_placed': return 'bg-cyan-500';
      case 'setting_changed':
      case 'permission_changed': return 'bg-amber-500';
      case 'system_alert': return 'bg-red-600';
      case 'login': return 'bg-green-500';
      case 'logout': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const exportToCSV = () => {
    const csvData = filteredActivities.map(activity => ({
      Date: new Date(activity.created_date).toLocaleString(),
      User: activity.user_name,
      Email: activity.user_email,
      Action: activity.action_type,
      Description: activity.action_description,
      Entity: activity.entity_type,
      Severity: activity.severity,
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-feed-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedUser('all');
    setSelectedActionType('all');
    setSelectedSeverity('all');
    setDateRange('all');
  };

  const activeFiltersCount = [
    searchQuery,
    selectedUser !== 'all',
    selectedActionType !== 'all',
    selectedSeverity !== 'all',
    dateRange !== 'all'
  ].filter(Boolean).length;

  // Statistics
  const todayActivities = activities.filter(a => {
    const activityDate = new Date(a.created_date);
    const today = new Date();
    return activityDate.toDateString() === today.toDateString();
  }).length;

  const criticalActivities = activities.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const uniqueUsers = [...new Set(activities.map(a => a.user_id))].length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Activity Feed</h2>
          <p className="text-slate-400 font-semibold">Monitor all user actions and system events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" className="border-slate-700 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} className="bg-green-500 hover:bg-green-600">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{filteredActivities.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{filteredActivities.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Activities</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{todayActivities}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{todayActivities}</p>
            <p className="text-slate-400 text-sm font-semibold">Today</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <Badge className="bg-red-500">{criticalActivities}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{criticalActivities}</p>
            <p className="text-slate-400 text-sm font-semibold">Critical/High</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <User className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{uniqueUsers}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{uniqueUsers}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button size="sm" onClick={clearFilters} variant="outline" className="border-red-500/30 text-red-400">
                Clear All ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <Label className="text-white font-bold mb-2 block text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block text-sm">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="text-white">
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block text-sm">Action Type</Label>
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Actions</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type} className="text-white">
                      {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block text-sm">Severity</Label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Levels</SelectItem>
                  <SelectItem value="low" className="text-white">Low</SelectItem>
                  <SelectItem value="medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="high" className="text-white">High</SelectItem>
                  <SelectItem value="critical" className="text-white">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block text-sm">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Time</SelectItem>
                  <SelectItem value="1day" className="text-white">Last 24 Hours</SelectItem>
                  <SelectItem value="7days" className="text-white">Last 7 Days</SelectItem>
                  <SelectItem value="30days" className="text-white">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">
            Activity Log ({filteredActivities.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No Activities Found</h3>
              <p className="text-slate-400 mb-6">No activities match your current filters</p>
              <Button onClick={clearFilters} className="bg-cyan-500 hover:bg-cyan-600">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${getActionColor(activity.action_type)} flex items-center justify-center text-white flex-shrink-0`}>
                      {getActionIcon(activity.action_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getActionColor(activity.action_type)}>
                          {activity.action_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Badge>
                        <Badge className={getSeverityColor(activity.severity)}>
                          {activity.severity?.toUpperCase()}
                        </Badge>
                        {activity.entity_type && (
                          <Badge className="bg-slate-600">
                            {activity.entity_type}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-white font-semibold mb-1">{activity.action_description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.user_name}
                        </span>
                        {activity.entity_name && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {activity.entity_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(activity.created_date).toLocaleString()}
                        </span>
                      </div>
                      
                      {activity.changes?.fields_changed && activity.changes.fields_changed.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {activity.changes.fields_changed.map((field, idx) => (
                            <Badge key={idx} className="bg-blue-900/30 text-blue-300 text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}