import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Database, Code, GitBranch, Download, Upload, Table, Archive,
  TrendingUp, Shield, Zap, Activity, Server, HardDrive, Clock,
  CheckCircle, AlertCircle, Search, FileText, Settings, Layers
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();

    // Simulate fetching database stats
    const fetchStats = async () => {
      // In a real implementation, these would come from actual database queries
      setStats({
        totalRecords: 1247,
        totalTables: 42,
        databaseSize: 156.8,
        uptime: 99.98
      });
    };
    fetchStats();
  }, []);

  const tools = [
    {
      title: "SQL Script Generator",
      description: "Generate complete website scripts with AI",
      icon: Code,
      color: "from-blue-500 to-cyan-500",
      url: createPageUrl("AdminSQLScriptGenerator"),
      badge: "AI-Powered"
    },
    {
      title: "Advanced Query Builder",
      description: "Build complex queries visually",
      icon: Search,
      color: "from-purple-500 to-pink-500",
      url: createPageUrl("AdminAdvancedQueryBuilder"),
      badge: "Visual"
    },
    {
      title: "Schema Generator",
      description: "Design database schemas visually",
      icon: GitBranch,
      color: "from-green-500 to-emerald-500",
      url: createPageUrl("AdminSchemaGenerator"),
      badge: "Designer"
    },
    {
      title: "Data Export Manager",
      description: "Export data in multiple formats",
      icon: Download,
      color: "from-amber-500 to-orange-500",
      url: createPageUrl("AdminDataExportManager"),
      badge: "Multi-Format"
    },
    {
      title: "Data Import Wizard",
      description: "Import from CSV, JSON, SQL dumps",
      icon: Upload,
      color: "from-indigo-500 to-purple-500",
      url: createPageUrl("AdminDataImportWizard"),
      badge: "Wizard"
    },
    {
      title: "Table Manager",
      description: "Browse, edit, and manage tables",
      icon: Table,
      color: "from-pink-500 to-rose-500",
      url: createPageUrl("AdminTableManager"),
      badge: "CRUD"
    },
    {
      title: "Backup & Restore",
      description: "Automated backups and restoration",
      icon: Archive,
      color: "from-cyan-500 to-blue-500",
      url: createPageUrl("AdminBackupRestore"),
      badge: "Automated"
    },
    {
      title: "Performance Monitor",
      description: "Real-time query and index optimization",
      icon: TrendingUp,
      color: "from-red-500 to-pink-500",
      url: createPageUrl("AdminPerformanceMonitor"),
      badge: "Real-time"
    },
    {
      title: "Security Audit",
      description: "Security vulnerabilities and compliance",
      icon: Shield,
      color: "from-yellow-500 to-amber-500",
      url: createPageUrl("AdminSecurityAudit"),
      badge: "Enterprise"
    },
    {
      title: "Query Optimizer",
      description: "Analyze and optimize slow queries",
      icon: Zap,
      color: "from-violet-500 to-purple-500",
      url: createPageUrl("AdminQueryOptimizer"),
      badge: "Optimizer"
    },
    {
      title: "Migration Studio",
      description: "Database migrations and versioning",
      icon: GitBranch,
      color: "from-teal-500 to-cyan-500",
      url: createPageUrl("AdminMigrationStudio"),
      badge: "Version Control"
    },
    {
      title: "Replication Manager",
      description: "Multi-region database replication",
      icon: Server,
      color: "from-lime-500 to-green-500",
      url: createPageUrl("AdminReplicationManager"),
      badge: "Multi-Region"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Enterprise Database Center</h2>
        <p className="text-slate-400 font-semibold">Complete database management and optimization suite</p>
      </div>

      {/* Database Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">Active</Badge>
            </div>
            <p className="text-3xl font-black text-white mb-1">{stats.totalRecords}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Records</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Table className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">Healthy</Badge>
            </div>
            <p className="text-3xl font-black text-white mb-1">{stats.totalTables}</p>
            <p className="text-slate-400 text-sm font-semibold">Database Tables</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">Optimal</Badge>
            </div>
            <p className="text-3xl font-black text-white mb-1">{stats.databaseSize.toFixed(2)}</p>
            <p className="text-slate-400 text-sm font-semibold">Database Size (MB)</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">Live</Badge>
            </div>
            <p className="text-3xl font-black text-white mb-1">{stats.uptime}%</p>
            <p className="text-slate-400 text-sm font-semibold">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Zap className="w-8 h-8 text-cyan-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">Quick Actions</h3>
              <div className="grid md:grid-cols-4 gap-3">
                <Link to={createPageUrl("AdminSQLScriptGenerator")}>
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                    <Code className="w-4 h-4 mr-2" />
                    Generate Script
                  </Button>
                </Link>
                <Link to={createPageUrl("AdminAdvancedQueryBuilder")}>
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    <Search className="w-4 h-4 mr-2" />
                    Build Query
                  </Button>
                </Link>
                <Link to={createPageUrl("AdminBackupRestore")}>
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <Archive className="w-4 h-4 mr-2" />
                    Backup Now
                  </Button>
                </Link>
                <Link to={createPageUrl("AdminPerformanceMonitor")}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Monitor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Database Tools & Features
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool, idx) => (
            <Link key={idx} to={tool.url}>
              <Card className="bg-[#1a1f3a] border-slate-700 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all group cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-slate-700 text-slate-300 text-xs">
                      {tool.badge}
                    </Badge>
                  </div>
                  <h4 className="text-white font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                    {tool.title}
                  </h4>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* System Health */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Database Connectivity</span>
              </div>
              <Badge className="bg-green-500">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Query Performance</span>
              </div>
              <Badge className="bg-green-500">Optimal</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Backup Status</span>
              </div>
              <Badge className="bg-green-500">Up to Date</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Security</span>
              </div>
              <Badge className="bg-green-500">Secure</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}