import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Database, Search, Tag, Users, FileText, Package,
  Eye, Settings, Lock, Activity
} from "lucide-react";

export default function AdminDataCatalog() {
  const [searchQuery, setSearchQuery] = useState("");

  const dataSources = [
    {
      name: 'Products',
      type: 'Table',
      records: 1247,
      owner: 'Admin',
      sensitivity: 'Public',
      tags: ['commerce', 'inventory'],
      description: 'Product catalog with pricing and stock information'
    },
    {
      name: 'Users',
      type: 'Table',
      records: 5842,
      owner: 'System',
      sensitivity: 'PII',
      tags: ['authentication', 'personal'],
      description: 'User accounts and profile information'
    },
    {
      name: 'Orders',
      type: 'Table',
      records: 3421,
      owner: 'Admin',
      sensitivity: 'Confidential',
      tags: ['commerce', 'transactions'],
      description: 'Customer orders and transaction history'
    },
  ];

  const filtered = dataSources.filter(ds =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Data Catalog</h2>
          <p className="text-slate-400 font-semibold">Discover and document your data assets</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Register Data Source
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Database className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{dataSources.length}</p>
            <p className="text-slate-400 text-sm">Data Sources</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <FileText className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {dataSources.reduce((sum, ds) => sum + ds.records, 0).toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm">Total Records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Lock className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">
              {dataSources.filter(ds => ds.sensitivity === 'PII' || ds.sensitivity === 'Confidential').length}
            </p>
            <p className="text-slate-400 text-sm">Sensitive Sources</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Tag className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">18</p>
            <p className="text-slate-400 text-sm">Tags</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search data sources by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-slate-900 border-slate-700 text-white h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Data Sources ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {filtered.map((source, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Database className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-bold">{source.name}</h4>
                          <Badge className="bg-slate-600">{source.type}</Badge>
                          <Badge className={
                            source.sensitivity === 'PII' ? 'bg-red-500' :
                            source.sensitivity === 'Confidential' ? 'bg-orange-500' :
                            'bg-green-500'
                          }>
                            {source.sensitivity}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{source.description}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{source.records.toLocaleString()} records</span>
                          <span>Owner: {source.owner}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {source.tags.map(tag => (
                            <Badge key={tag} className="bg-cyan-500/20 text-cyan-300 text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
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