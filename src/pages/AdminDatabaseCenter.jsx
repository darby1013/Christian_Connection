import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Database, Sparkles, Search, GitBranch, Code, Upload, Archive,
  Download, Activity, Zap, Shield, Link2, TrendingUp, Server,
  FileText, CheckCircle, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDatabaseCenter() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalTables: 0,
    databaseSize: 0,
    uptime: 99.98
  });
  const [selectedTables, setSelectedTables] = useState([]);
  const [exportFormat, setExportFormat] = useState('SQL Dump');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
    
    // Simulate fetching database stats
    setStats({
      totalRecords: 30,
      totalTables: 14,
      databaseSize: 75.00,
      uptime: 99.98
    });
  }, []);

  const availableTables = [
    'User', 'Transaction', 'Goal', 'Bill', 'Debt', 'Investment',
    'Portfolio', 'Budget', 'Subscription', 'Activity', 'Note', 'Receipt',
    'BankAccount', 'PaymentSchedule'
  ];

  const toggleTable = (table) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const selectAll = () => {
    setSelectedTables(availableTables);
  };

  const clearAll = () => {
    setSelectedTables([]);
  };

  const handleExport = () => {
    alert(`Exporting ${selectedTables.length} tables in ${exportFormat} format...`);
  };

  const databaseTools = [
    {
      title: 'AI SQL Script Generator',
      description: 'Generate complete database scripts with AI',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      url: createPageUrl('AdminSQLScriptGenerator'),
      badge: 'AI-Powered'
    },
    {
      title: 'Advanced Query Builder',
      description: 'Visual query construction without SQL',
      icon: <Search className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      url: createPageUrl('AdminAdvancedQueryBuilder'),
      badge: 'Visual'
    },
    {
      title: 'Schema Generator',
      description: 'Design database schemas visually',
      icon: <GitBranch className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      url: createPageUrl('AdminSchemaGenerator'),
      badge: 'Design'
    },
    {
      title: 'SQL Editor',
      description: 'Execute custom SQL queries',
      icon: <Code className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
      url: createPageUrl('AdminSQLEditor'),
      badge: 'Pro'
    },
    {
      title: 'Schema Viewer',
      description: 'Browse database structure',
      icon: <Database className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      url: createPageUrl('AdminSchemaViewer'),
      badge: 'Browser'
    },
    {
      title: 'Import/Export',
      description: 'Bulk data operations',
      icon: <Upload className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-500',
      url: createPageUrl('AdminDataImportExport'),
      badge: 'Bulk'
    },
    {
      title: 'Backup Manager',
      description: 'Automated backups and restore',
      icon: <Archive className="w-6 h-6" />,
      color: 'from-red-500 to-rose-500',
      url: createPageUrl('AdminBackupManager'),
      badge: 'Critical'
    },
    {
      title: 'Performance Monitor',
      description: 'Query performance analytics',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      url: createPageUrl('AdminPerformanceMonitor'),
      badge: 'Analytics'
    },
    {
      title: 'Migration Studio',
      description: 'Database schema migrations',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-amber-500',
      url: createPageUrl('AdminMigrationStudio'),
      badge: 'Advanced'
    },
    {
      title: 'Security Audit',
      description: 'Security and compliance checks',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-rose-500 to-red-500',
      url: createPageUrl('AdminSecurityAudit'),
      badge: 'Security'
    },
    {
      title: 'Relationship Mapper',
      description: 'Visualize table relationships',
      icon: <Link2 className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-500',
      url: createPageUrl('AdminRelationshipMapper'),
      badge: 'Visual'
    },
    {
      title: 'Data Integrity',
      description: 'Validate data consistency',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      url: createPageUrl('AdminDataIntegrity'),
      badge: 'Health'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Enterprise Database Tools</h2>
        <p className="text-slate-400 font-semibold">Professional database management and Glory Wave SQL generator</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Database className="w-10 h-10 text-cyan-400" />
              <Badge className="bg-cyan-500">Active</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.totalRecords}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Server className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.totalTables}</p>
            <p className="text-slate-400 text-sm font-semibold">Database Tables</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-10 h-10 text-purple-400" />
              <Badge className="bg-purple-500">Optimal</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">
              {stats.databaseSize.toFixed(2)}
              <span className="text-2xl ml-1">MB</span>
            </p>
            <p className="text-slate-400 text-sm font-semibold">Database Size</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-10 h-10 text-green-400" />
              <Badge className="bg-green-500">Live</Badge>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stats.uptime}%</p>
            <p className="text-slate-400 text-sm font-semibold">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="bg-[#1e293b] border border-slate-700 p-1">
          <TabsTrigger value="glory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
            Glory Wave
          </TabsTrigger>
          <TabsTrigger value="codegen" className="data-[state=active]:bg-cyan-500">
            Code Gen
          </TabsTrigger>
          <TabsTrigger value="schema" className="data-[state=active]:bg-cyan-500">
            Schema
          </TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-cyan-500">
            Queries
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyan-500">
            Export
          </TabsTrigger>
          <TabsTrigger value="import" className="data-[state=active]:bg-cyan-500">
            Import
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:bg-cyan-500">
            Tables
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-cyan-500">
            Backup
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-500">
            Performance
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-cyan-500">
            Advanced
          </TabsTrigger>
          <TabsTrigger value="enterprise" className="data-[state=active]:bg-cyan-500">
            Enterprise
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-6">
          <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Table Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Select Tables to Export</h3>
                  <div className="flex gap-2">
                    <Button onClick={selectAll} size="sm" variant="outline" className="border-slate-700 text-slate-300">
                      Select All
                    </Button>
                    <Button onClick={clearAll} size="sm" variant="outline" className="border-slate-700 text-slate-300">
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                  {availableTables.map((table) => (
                    <label
                      key={table}
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-3 rounded-lg transition-all"
                    >
                      <Checkbox
                        checked={selectedTables.includes(table)}
                        onCheckedChange={() => toggleTable(table)}
                      />
                      <span className="text-white font-medium">{table}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Format */}
              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-3">Export Format</h3>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 font-medium"
                >
                  <option value="SQL Dump">SQL Dump</option>
                  <option value="JSON">JSON</option>
                  <option value="CSV">CSV</option>
                  <option value="Excel">Excel (XLSX)</option>
                  <option value="XML">XML</option>
                </select>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={selectedTables.length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-6 text-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Export {selectedTables.length} Tables
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Glory Wave Tab - Tools Grid */}
        <TabsContent value="glory" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {databaseTools.map((tool, idx) => (
              <Link key={idx} to={tool.url}>
                <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg`}>
                        {tool.icon}
                      </div>
                      <Badge className="bg-cyan-500">{tool.badge}</Badge>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-slate-400 text-sm">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs - Coming Soon */}
        {['codegen', 'schema', 'queries', 'import', 'tables', 'backup', 'performance', 'advanced', 'enterprise'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">{tab.charAt(0).toUpperCase() + tab.slice(1)} Tools</h3>
                <p className="text-slate-400 mb-6">Advanced {tab} features coming soon</p>
                <Link to={createPageUrl('AdminDatabaseCenter')}>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    Explore Available Tools
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* System Health */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader className="border-b border-green-500/30">
          <CardTitle className="text-green-300 font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">100%</p>
              <p className="text-green-200 text-sm">API Operational</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">Fast</p>
              <p className="text-green-200 text-sm">Query Response</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">Secure</p>
              <p className="text-green-200 text-sm">Encrypted</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-2xl mb-1">Backed Up</p>
              <p className="text-green-200 text-sm">Auto-Save</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}