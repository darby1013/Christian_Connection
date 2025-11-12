import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, X, Play, Download, Code, Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminQueryBuilder() {
  const [selectedEntity, setSelectedEntity] = useState("Product");
  const [fields, setFields] = useState(['*']);
  const [filters, setFilters] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [limit, setLimit] = useState(100);
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);

  const entities = ['Product', 'Order', 'User', 'CustomerLoyalty', 'Inventory'];

  const fieldOptions = {
    Product: ['*', 'name', 'price', 'category', 'stock_quantity', 'rating'],
    Order: ['*', 'order_number', 'customer_email', 'total_amount', 'status'],
    User: ['*', 'email', 'full_name', 'role'],
    CustomerLoyalty: ['*', 'user_email', 'total_points', 'current_tier'],
    Inventory: ['*', 'sku', 'quantity_available', 'warehouse_location']
  };

  const addFilter = () => {
    setFilters([...filters, { field: 'price', operator: '>', value: '' }]);
  };

  const removeFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const executeQuery = async () => {
    setExecuting(true);
    try {
      let data = await base44.entities[selectedEntity].list();

      // Apply filters
      filters.forEach(filter => {
        if (filter.value) {
          data = data.filter(record => {
            const fieldValue = record[filter.field];
            switch(filter.operator) {
              case '>': return fieldValue > parseFloat(filter.value);
              case '<': return fieldValue < parseFloat(filter.value);
              case '=': return fieldValue == filter.value;
              case 'contains': return String(fieldValue).toLowerCase().includes(filter.value.toLowerCase());
              default: return true;
            }
          });
        }
      });

      // Apply limit
      data = data.slice(0, limit);

      setResults(data);
    } catch (error) {
      alert('Query error: ' + error.message);
    } finally {
      setExecuting(false);
    }
  };

  const generatedSQL = `SELECT ${fields.join(', ')}
FROM ${selectedEntity}
${filters.length > 0 ? `WHERE ${filters.map(f => `${f.field} ${f.operator} '${f.value}'`).join(' AND ')}` : ''}
${sortBy ? `ORDER BY ${sortBy}` : ''}
LIMIT ${limit};`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Visual Query Builder</h2>
        <p className="text-slate-400 font-semibold">Build complex queries without writing SQL</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Query Builder */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Build Query</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">SELECT FROM</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {entities.map(entity => (
                      <SelectItem key={entity} value={entity} className="text-white">{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white font-bold">WHERE Conditions</Label>
                  <Button size="sm" onClick={addFilter} className="bg-purple-500 hover:bg-purple-600">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Filter
                  </Button>
                </div>
                <div className="space-y-2">
                  {filters.map((filter, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Select
                        value={filter.field}
                        onValueChange={(value) => {
                          const newFilters = [...filters];
                          newFilters[idx].field = value;
                          setFilters(newFilters);
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {(fieldOptions[selectedEntity] || []).map(field => (
                            <SelectItem key={field} value={field} className="text-white">{field}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => {
                          const newFilters = [...filters];
                          newFilters[idx].operator = value;
                          setFilters(newFilters);
                        }}
                      >
                        <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="=" className="text-white">Equals</SelectItem>
                          <SelectItem value=">" className="text-white">Greater Than</SelectItem>
                          <SelectItem value="<" className="text-white">Less Than</SelectItem>
                          <SelectItem value="contains" className="text-white">Contains</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) => {
                          const newFilters = [...filters];
                          newFilters[idx].value = e.target.value;
                          setFilters(newFilters);
                        }}
                        className="flex-1 bg-slate-900 border-slate-700 text-white"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFilter(idx)}
                        className="text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">LIMIT</Label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">ORDER BY</Label>
                  <Input
                    placeholder="e.g., created_date"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={executeQuery}
                disabled={executing}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold h-12"
              >
                {executing ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Executing...</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" />Run Query</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card className="bg-[#1a1f3a] border-green-500/30">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold">Results ({results.length} rows)</CardTitle>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {results[0] && Object.keys(results[0]).slice(0, 6).map((key) => (
                          <th key={key} className="text-left p-2 text-cyan-400 font-bold">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                          {Object.values(row).slice(0, 6).map((val, vidx) => (
                            <td key={vidx} className="p-2 text-slate-300">
                              {typeof val === 'object' ? JSON.stringify(val).substring(0, 30) : String(val).substring(0, 50)}
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
        </div>

        {/* Generated SQL Preview */}
        <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Code className="w-5 h-5 text-green-400" />
              Generated SQL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <pre className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-green-400 font-mono text-xs overflow-x-auto">
              {generatedSQL}
            </pre>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(generatedSQL);
                alert('SQL copied!');
              }}
              className="w-full mt-3 bg-green-500 hover:bg-green-600"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy SQL
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}