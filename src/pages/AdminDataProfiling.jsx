import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, Database, TrendingUp, Eye, Activity, Package
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDataProfiling() {
  const profileData = {
    Product: {
      totalRecords: 1247,
      nullValues: 47,
      uniqueValues: 1200,
      duplicates: 0,
      dataTypes: { string: 892, number: 355 }
    },
    User: {
      totalRecords: 5842,
      nullValues: 124,
      uniqueValues: 5842,
      duplicates: 0,
      dataTypes: { string: 4210, number: 1632 }
    }
  };

  const distributionData = [
    { category: 'Books', count: 342 },
    { category: 'Electronics', count: 287 },
    { category: 'Clothing', count: 418 },
    { category: 'Home', count: 200 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Data Profiling</h2>
        <p className="text-slate-400 font-semibold">Statistical analysis and data distribution insights</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">2</p>
            <p className="text-slate-400 text-sm">Tables Profiled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Package className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">7,089</p>
            <p className="text-slate-400 text-sm">Records Analyzed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">171</p>
            <p className="text-slate-400 text-sm">Null Values</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Eye className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">0</p>
            <p className="text-slate-400 text-sm">Duplicates</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Profiles */}
      {Object.entries(profileData).map(([table, data]) => (
        <Card key={table} className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">{table} Table Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Total Records</p>
                <p className="text-white font-black text-2xl">{data.totalRecords.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Null Values</p>
                <p className="text-yellow-400 font-black text-2xl">{data.nullValues}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Unique Values</p>
                <p className="text-cyan-400 font-black text-2xl">{data.uniqueValues.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Duplicates</p>
                <p className="text-green-400 font-black text-2xl">{data.duplicates}</p>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Data Type Distribution</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-sm">String</span>
                    <span className="text-white font-bold">{data.dataTypes.string}</span>
                  </div>
                  <Progress value={(data.dataTypes.string / data.totalRecords) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-sm">Number</span>
                    <span className="text-white font-bold">{data.dataTypes.number}</span>
                  </div>
                  <Progress value={(data.dataTypes.number / data.totalRecords) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Category Distribution */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Product Category Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}