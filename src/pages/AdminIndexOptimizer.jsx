import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, CheckCircle, AlertTriangle, Plus, Trash2,
  TrendingUp, Database, Code, Play, Download
} from "lucide-react";

export default function AdminIndexOptimizer() {
  const [analyzing, setAnalyzing] = useState(false);

  const indexRecommendations = [
    {
      table: 'Product',
      current_indexes: ['idx_category', 'idx_price', 'idx_featured'],
      recommended: 'CREATE INDEX idx_cat_price ON Product(category, price DESC);',
      reason: 'Query filtering by category and sorting by price (2,100 executions/day)',
      impact: 'High - Will improve 2,100 queries by 65%',
      estimated_improvement: '1.8s → 0.6s',
      priority: 'high'
    },
    {
      table: 'Order',
      current_indexes: ['idx_customer', 'idx_status', 'idx_date'],
      recommended: 'CREATE INDEX idx_customer_status_date ON Order(customer_id, status, created_date DESC);',
      reason: 'Customer order history queries with status filter',
      impact: 'Medium - Will improve 890 queries by 45%',
      estimated_improvement: '1.2s → 0.7s',
      priority: 'medium'
    },
    {
      table: 'ProductReview',
      current_indexes: ['idx_product', 'idx_approved'],
      recommended: 'CREATE INDEX idx_product_approved_date ON ProductReview(product_id, is_approved, created_date DESC);',
      reason: 'Product review listing with approval filter',
      impact: 'Critical - Will improve 5,600 queries by 80%',
      estimated_improvement: '2.5s → 0.5s',
      priority: 'critical'
    },
    {
      table: 'Inventory',
      current_indexes: ['idx_product', 'idx_sku'],
      recommended: 'CREATE INDEX idx_product_warehouse ON Inventory(product_id, warehouse_location);',
      reason: 'Multi-warehouse inventory lookups',
      impact: 'High - Will improve 1,800 queries by 55%',
      estimated_improvement: '1.5s → 0.7s',
      priority: 'high'
    }
  ];

  const existingIndexes = [
    {
      table: 'Product',
      name: 'idx_category',
      columns: 'category',
      type: 'BTREE',
      cardinality: 25,
      size: '2.1 MB',
      usage: 'High - 8,900 queries/day'
    },
    {
      table: 'Product',
      name: 'idx_featured',
      columns: 'is_featured, created_date DESC',
      type: 'BTREE',
      cardinality: 2,
      size: '1.8 MB',
      usage: 'Medium - 1,200 queries/day'
    },
    {
      table: 'Order',
      name: 'idx_customer',
      columns: 'customer_id',
      type: 'BTREE',
      cardinality: 450,
      size: '12.5 MB',
      usage: 'High - 6,700 queries/day'
    },
    {
      table: 'Order',
      name: 'idx_status',
      columns: 'status',
      type: 'BTREE',
      cardinality: 8,
      size: '3.2 MB',
      usage: 'Very High - 12,300 queries/day'
    }
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-amber-500';
      case 'medium': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const analyzeIndexes = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      alert('✅ Index analysis completed!');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Index Optimizer</h2>
          <p className="text-slate-400 font-semibold">AI-powered index recommendations & management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={analyzeIndexes} disabled={analyzing} className="bg-purple-500 hover:bg-purple-600">
            {analyzing ? (
              <><Database className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Analyze All</>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{existingIndexes.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{existingIndexes.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Indexes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{indexRecommendations.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{indexRecommendations.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Recommendations</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">+65%</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">65%</p>
            <p className="text-slate-400 text-sm font-semibold">Potential Speedup</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">19.6 MB</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">19.6</p>
            <p className="text-slate-400 text-sm font-semibold">Total Size (MB)</p>
          </CardContent>
        </Card>
      </div>

      {/* Index Recommendations */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            AI Index Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-700">
            {indexRecommendations.map((rec, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <Badge className="bg-cyan-500">{rec.table}</Badge>
                    </div>
                    <h4 className="text-white font-bold mb-2">{rec.reason}</h4>
                    <pre className="text-green-400 font-mono text-xs bg-slate-900 p-3 rounded border border-slate-700 overflow-x-auto mb-3">
                      {rec.recommended}
                    </pre>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded">
                        <p className="text-purple-300 text-xs font-bold mb-1">Impact:</p>
                        <p className="text-purple-200 text-xs">{rec.impact}</p>
                      </div>
                      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                        <p className="text-green-300 text-xs font-bold mb-1">Performance Gain:</p>
                        <p className="text-green-200 text-xs">{rec.estimated_improvement}</p>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 ml-4">
                    <Play className="w-3 h-3 mr-1" />
                    Create Index
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Indexes */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Existing Indexes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {existingIndexes.map((index, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-cyan-400 font-mono font-bold">{index.name}</code>
                      <Badge className="bg-purple-500 text-xs">{index.table}</Badge>
                      <Badge className="bg-slate-600 text-xs">{index.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">Columns: <code className="text-green-400">{index.columns}</code></span>
                      <span className="text-slate-400">Size: <span className="text-white">{index.size}</span></span>
                      <span className="text-slate-400">Cardinality: <span className="text-white">{index.cardinality}</span></span>
                    </div>
                    <p className="text-xs text-cyan-400 mt-2">{index.usage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}