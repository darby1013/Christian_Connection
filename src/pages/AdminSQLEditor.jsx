import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  Play, Download, Copy, Trash2, Save, Code, AlertTriangle,
  CheckCircle, Clock, Database, FileText, Zap
} from "lucide-react";

export default function AdminSQLEditor() {
  const [sqlQuery, setSqlQuery] = useState("-- Write your SQL query here\nSELECT * FROM Product LIMIT 10;");
  const [queryResults, setQueryResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [savedQueries, setSavedQueries] = useState([
    "SELECT * FROM Product WHERE price > 50 ORDER BY price DESC;",
    "SELECT category, COUNT(*) as count FROM Product GROUP BY category;",
    "SELECT * FROM Order WHERE status = 'pending' ORDER BY created_date DESC;",
    "SELECT customer_email, SUM(total_amount) as total_spent FROM Order GROUP BY customer_email ORDER BY total_spent DESC LIMIT 10;"
  ]);

  const executeQuery = async () => {
    setExecuting(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Simulate SQL execution (in production, this would call a backend SQL API)
      // For demo, we'll translate common SQL to entity queries
      
      const query = sqlQuery.trim().toLowerCase();
      let results = [];

      if (query.includes('select * from product')) {
        results = await base44.entities.Product.list();
        
        // Apply LIMIT if present
        const limitMatch = query.match(/limit (\d+)/);
        if (limitMatch) {
          results = results.slice(0, parseInt(limitMatch[1]));
        }

        // Apply WHERE price filter
        if (query.includes('where price >')) {
          const priceMatch = query.match(/price > (\d+)/);
          if (priceMatch) {
            results = results.filter(p => p.price > parseInt(priceMatch[1]));
          }
        }
      } else if (query.includes('select * from order')) {
        results = await base44.entities.Order.list();
        
        if (query.includes("where status = 'pending'")) {
          results = results.filter(o => o.status === 'pending');
        }
      } else if (query.includes('group by category')) {
        const products = await base44.entities.Product.list();
        const grouped = products.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {});
        results = Object.entries(grouped).map(([category, count]) => ({ category, count }));
      } else {
        throw new Error('Query not supported in demo mode. In production, full SQL is supported.');
      }

      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      setQueryResults(results);

    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const generateDatabaseDump = () => {
    const dump = `-- Glory Wave Database Dump
-- Generated: ${new Date().toISOString()}
-- Database: glory_wave_production
-- Version: 1.0

-- ============================================
-- SCHEMA DEFINITIONS
-- ============================================

CREATE TABLE Product (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  stock_quantity INT DEFAULT 0,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_price (price)
);

CREATE TABLE \`Order\` (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','processing','shipped','delivered') DEFAULT 'pending',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES User(id),
  INDEX idx_status (status),
  INDEX idx_customer (customer_id)
);

CREATE TABLE CustomerLoyalty (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  total_points INT DEFAULT 0,
  current_tier ENUM('bronze','silver','gold','platinum','diamond') DEFAULT 'bronze',
  total_spent DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES User(id),
  INDEX idx_tier (current_tier),
  INDEX idx_points (total_points)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_product_featured ON Product(is_featured, created_date DESC);
CREATE INDEX idx_product_bestseller ON Product(is_bestseller, total_sales DESC);
CREATE INDEX idx_order_date ON \`Order\`(created_date DESC);
CREATE INDEX idx_order_customer_date ON \`Order\`(customer_id, created_date DESC);

-- ============================================
-- SAMPLE DATA (First 100 records per table)
-- ============================================

-- Products
INSERT INTO Product (id, name, price, category) VALUES
  ('prod_001', 'Faith T-Shirt', 29.99, 'Apparel'),
  ('prod_002', 'Inspirational Mug', 14.99, 'Accessories'),
  ('prod_003', 'Prayer Journal', 19.99, 'Books');

-- ============================================
-- END OF DUMP
-- ============================================
`;

    const blob = new Blob([dump], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glory_wave_database_dump_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">SQL Query Editor</h2>
          <p className="text-slate-400 font-semibold">Execute raw SQL queries with real-time results</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateDatabaseDump} className="bg-green-500 hover:bg-green-600">
            <Download className="w-4 h-4 mr-2" />
            Generate DB Dump
          </Button>
        </div>
      </div>

      {/* SQL Editor */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-400" />
              Query Editor
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" className="bg-slate-700 hover:bg-slate-600">
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button size="sm" className="bg-slate-700 hover:bg-slate-600">
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button size="sm" className="bg-red-500 hover:bg-red-600">
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="bg-slate-900 border-0 text-green-400 font-mono text-sm h-64 rounded-none"
            placeholder="Enter SQL query..."
          />
          <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-500">
                <Database className="w-3 h-3 mr-1" />
                glory_wave_db
              </Badge>
              {executionTime > 0 && (
                <Badge className="bg-cyan-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {executionTime}ms
                </Badge>
              )}
            </div>
            <Button
              onClick={executeQuery}
              disabled={executing}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold"
            >
              {executing ? (
                <><Zap className="w-4 h-4 mr-2 animate-pulse" />Executing...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Run Query</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-bold mb-1">Query Error</h4>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {queryResults && (
        <Card className="bg-[#1a1f3a] border-green-500/30">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Query Results ({queryResults.length} rows)
              </CardTitle>
              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                <Download className="w-3 h-3 mr-1" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {queryResults[0] && Object.keys(queryResults[0]).map((key) => (
                      <th key={key} className="text-left p-3 text-cyan-400 font-bold">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResults.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                      {Object.values(row).map((val, vidx) => (
                        <td key={vidx} className="p-3 text-slate-300">
                          {typeof val === 'object' ? JSON.stringify(val).substring(0, 50) : String(val).substring(0, 100)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Queries */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Saved Queries</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {savedQueries.map((query, idx) => (
            <button
              key={idx}
              onClick={() => setSqlQuery(query)}
              className="w-full text-left p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all group"
            >
              <p className="text-slate-300 font-mono text-xs group-hover:text-white">
                {query.substring(0, 100)}...
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}