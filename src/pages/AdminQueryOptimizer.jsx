import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Zap, TrendingUp, AlertTriangle, CheckCircle, Activity,
  Clock, Database, Eye, Settings, Code
} from "lucide-react";

export default function AdminQueryOptimizer() {
  const [query, setQuery] = useState("SELECT * FROM Product WHERE category = 'Books' AND price > 20 ORDER BY created_date DESC LIMIT 100");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeQuery = async () => {
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setAnalysis({
      executionTime: '45ms',
      rowsScanned: 2847,
      rowsReturned: 42,
      efficiency: 67,
      recommendations: [
        'Add composite index on (category, price, created_date)',
        'Consider using LIMIT with offset for pagination',
        'Use specific columns instead of SELECT *'
      ],
      optimizedQuery: `SELECT id, name, price, created_date 
FROM Product 
WHERE category = 'Books' AND price > 20 
ORDER BY created_date DESC 
LIMIT 100`
    });
    
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Query Optimizer</h2>
        <p className="text-slate-400 font-semibold">Analyze and optimize SQL queries for better performance</p>
      </div>

      {/* Query Input */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Query Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-900 border-slate-700 text-green-400 font-mono h-32"
            placeholder="Enter SQL query..."
          />
          <Button
            onClick={analyzeQuery}
            disabled={analyzing}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
          >
            {analyzing ? (
              <><Activity className="w-4 h-4 mr-2 animate-pulse" />Analyzing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Analyze Query</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <Clock className="w-8 h-8 text-cyan-400 mb-3" />
                <p className="text-3xl font-black text-white mb-1">{analysis.executionTime}</p>
                <p className="text-slate-400 text-sm">Execution Time</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <Database className="w-8 h-8 text-purple-400 mb-3" />
                <p className="text-3xl font-black text-white mb-1">{analysis.rowsScanned}</p>
                <p className="text-slate-400 text-sm">Rows Scanned</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <Eye className="w-8 h-8 text-green-400 mb-3" />
                <p className="text-3xl font-black text-white mb-1">{analysis.rowsReturned}</p>
                <p className="text-slate-400 text-sm">Rows Returned</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <TrendingUp className="w-8 h-8 text-yellow-400 mb-3" />
                <p className="text-3xl font-black text-white mb-1">{analysis.efficiency}%</p>
                <p className="text-slate-400 text-sm">Efficiency</p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-cyan-900/20 border-cyan-500/30">
            <CardHeader className="border-b border-cyan-500/30">
              <CardTitle className="text-cyan-300 font-bold">Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-cyan-200 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimized Query */}
          <Card className="bg-[#1a1f3a] border-green-500/30">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-green-300 font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Optimized Query
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <pre className="text-green-400 font-mono text-sm bg-slate-900 p-4 rounded-lg overflow-x-auto">
                {analysis.optimizedQuery}
              </pre>
              <Button className="mt-4 bg-green-500 hover:bg-green-600 w-full">
                Apply Optimization
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}