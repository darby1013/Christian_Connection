import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock, Play, Pause, Trash2, Plus, CheckCircle, XCircle,
  Activity, Calendar, Zap, AlertCircle, RefreshCw
} from "lucide-react";

export default function AdminScheduledJobs() {
  const [jobs] = useState([
    {
      id: '1',
      name: 'Daily Database Backup',
      schedule: '0 2 * * *',
      nextRun: '2024-12-26 02:00',
      lastRun: '2024-12-25 02:00',
      status: 'active',
      executions: 365,
      successRate: 99.7
    },
    {
      id: '2',
      name: 'Weekly Analytics Report',
      schedule: '0 9 * * 1',
      nextRun: '2024-12-30 09:00',
      lastRun: '2024-12-23 09:00',
      status: 'active',
      executions: 52,
      successRate: 100
    },
    {
      id: '3',
      name: 'Hourly Cache Cleanup',
      schedule: '0 * * * *',
      nextRun: '2024-12-25 16:00',
      lastRun: '2024-12-25 15:00',
      status: 'active',
      executions: 8760,
      successRate: 98.1
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Scheduled Jobs</h2>
          <p className="text-slate-400 font-semibold">Manage automated tasks and cron jobs</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Clock className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{jobs.length}</p>
            <p className="text-slate-400 text-sm">Total Jobs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{jobs.filter(j => j.status === 'active').length}</p>
            <p className="text-slate-400 text-sm">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">99.3%</p>
            <p className="text-slate-400 text-sm">Success Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Zap className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {jobs.reduce((sum, j) => sum + j.executions, 0).toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm">Total Executions</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {jobs.map(job => (
              <Card key={job.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold">{job.name}</h4>
                        <Badge className={job.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-400">
                        <p>Schedule: <code className="text-cyan-400 font-mono">{job.schedule}</code></p>
                        <p>Success Rate: <span className="text-green-400 font-bold">{job.successRate}%</span></p>
                        <p>Next Run: <span className="text-white">{job.nextRun}</span></p>
                        <p>Last Run: <span className="text-slate-300">{job.lastRun}</span></p>
                        <p>Executions: <span className="text-purple-400 font-bold">{job.executions}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-700">
                        <Pause className="w-3 h-3" />
                      </Button>
                    </div>
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