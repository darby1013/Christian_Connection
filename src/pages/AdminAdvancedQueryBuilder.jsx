import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Play, Save, Trash2, Plus, X, GitBranch, Filter,
  ArrowUpDown, Layers, Database, Code, FileText, Download, Copy
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminAdvancedQueryBuilder() {
  const [queryName, setQueryName] = useState('');
  const [queryType, setQueryType] = useState('SELECT');
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [joins, setJoins] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [orderBy, setOrderBy] = useState([]);
  const [groupBy, setGroupBy] = useState([]);
  const [limit, setLimit] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [queryResults, setQueryResults] = useState(null);

  const queryClient = useQueryClient();

  // Mock available tables - in real implementation, fetch from schema
  const availableTables = [
    { name: 'User', columns: ['id', 'full_name', 'email', 'role', 'created_date'] },
    { name: 'Product', columns: ['id', 'name', 'price', 'stock_quantity', 'category', 'created_date'] },
    { name: 'Order', columns: ['id', 'customer_id', 'total_amount', 'status', 'created_date'] },
    { name: 'BlogPost', columns: ['id', 'title', 'content', 'author_name', 'status', 'published_date'] },
    { name: 'Podcast', columns: ['id', 'title', 'description', 'host_name', 'plays', 'created_date'] },
  ];

  const { data: savedQueries = [] } = useQuery({
    queryKey: ['savedQueries'],
    queryFn: async () => {
      // In real implementation, fetch from a SavedQuery entity
      return [];
    },
    initialData: [],
  });

  const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'];
  const logicalOperators = ['AND', 'OR'];
  const aggregateFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
  const joinTypes = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'];

  const addTable = (tableName) => {
    if (!selectedTables.includes(tableName)) {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  const removeTable = (tableName) => {
    setSelectedTables(selectedTables.filter(t => t !== tableName));
    setSelectedColumns(selectedColumns.filter(c => !c.startsWith(tableName + '.')));
  };

  const toggleColumn = (tableColumn) => {
    if (selectedColumns.includes(tableColumn)) {
      setSelectedColumns(selectedColumns.filter(c => c !== tableColumn));
    } else {
      setSelectedColumns([...selectedColumns, tableColumn]);
    }
  };

  const addJoin = () => {
    setJoins([...joins, { type: 'INNER JOIN', table: '', on: '' }]);
  };

  const updateJoin = (index, field, value) => {
    const newJoins = [...joins];
    newJoins[index][field] = value;
    setJoins(newJoins);
  };

  const removeJoin = (index) => {
    setJoins(joins.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    setConditions([...conditions, { column: '', operator: '=', value: '', logical: 'AND' }]);
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addOrderBy = () => {
    setOrderBy([...orderBy, { column: '', direction: 'ASC' }]);
  };

  const updateOrderBy = (index, field, value) => {
    const newOrderBy = [...orderBy];
    newOrderBy[index][field] = value;
    setOrderBy(newOrderBy);
  };

  const removeOrderBy = (index) => {
    setOrderBy(orderBy.filter((_, i) => i !== index));
  };

  const generateSQL = () => {
    let sql = '';

    if (queryType === 'SELECT') {
      // SELECT clause
      const columns = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
      sql = `SELECT ${columns}\n`;

      // FROM clause
      if (selectedTables.length > 0) {
        sql += `FROM ${selectedTables[0]}\n`;
      }

      // JOIN clauses
      joins.forEach(join => {
        if (join.table && join.on) {
          sql += `${join.type} ${join.table} ON ${join.on}\n`;
        }
      });

      // WHERE clause
      if (conditions.length > 0) {
        const whereConditions = conditions
          .map((cond, idx) => {
            const prefix = idx > 0 ? cond.logical + ' ' : '';
            return `${prefix}${cond.column} ${cond.operator} '${cond.value}'`;
          })
          .join('\n  ');
        sql += `WHERE ${whereConditions}\n`;
      }

      // GROUP BY clause
      if (groupBy.length > 0) {
        sql += `GROUP BY ${groupBy.join(', ')}\n`;
      }

      // ORDER BY clause
      if (orderBy.length > 0) {
        const orderClauses = orderBy.map(o => `${o.column} ${o.direction}`).join(', ');
        sql += `ORDER BY ${orderClauses}\n`;
      }

      // LIMIT clause
      if (limit) {
        sql += `LIMIT ${limit}`;
      }
    } else if (queryType === 'INSERT') {
      if (selectedTables.length > 0 && selectedColumns.length > 0) {
        sql = `INSERT INTO ${selectedTables[0]} (${selectedColumns.join(', ')})\nVALUES (/* values here */);`;
      }
    } else if (queryType === 'UPDATE') {
      if (selectedTables.length > 0) {
        sql = `UPDATE ${selectedTables[0]}\nSET /* column = value */\n`;
        if (conditions.length > 0) {
          const whereConditions = conditions
            .map((cond, idx) => {
              const prefix = idx > 0 ? cond.logical + ' ' : '';
              return `${prefix}${cond.column} ${cond.operator} '${cond.value}'`;
            })
            .join('\n  ');
          sql += `WHERE ${whereConditions}`;
        }
      }
    } else if (queryType === 'DELETE') {
      if (selectedTables.length > 0) {
        sql = `DELETE FROM ${selectedTables[0]}\n`;
        if (conditions.length > 0) {
          const whereConditions = conditions
            .map((cond, idx) => {
              const prefix = idx > 0 ? cond.logical + ' ' : '';
              return `${prefix}${cond.column} ${cond.operator} '${cond.value}'`;
            })
            .join('\n  ');
          sql += `WHERE ${whereConditions}`;
        }
      }
    }

    setGeneratedSQL(sql);
  };

  const executeQuery = async () => {
    if (!generatedSQL) {
      alert('Please generate a query first');
      return;
    }

    // In real implementation, this would execute the query
    alert('Query execution would happen here. For safety, this is a simulation.');
    
    // Simulate results
    setQueryResults({
      rowCount: 42,
      executionTime: '0.012s',
      affectedRows: queryType === 'SELECT' ? 42 : 1
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSQL);
    alert('SQL copied to clipboard!');
  };

  const resetQuery = () => {
    setQueryName('');
    setSelectedTables([]);
    setSelectedColumns([]);
    setJoins([]);
    setConditions([]);
    setOrderBy([]);
    setGroupBy([]);
    setLimit('');
    setGeneratedSQL('');
    setQueryResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Advanced Query Builder</h2>
          <p className="text-slate-400 font-semibold">Build complex SQL queries visually without coding</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetQuery} variant="outline" className="border-slate-700 text-slate-300">
            <Trash2 className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={generateSQL} className="bg-purple-500 hover:bg-purple-600">
            <Code className="w-4 h-4 mr-2" />
            Generate SQL
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Query Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query Type */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold text-sm">Query Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Query Name</Label>
                  <Input
                    placeholder="My Custom Query"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Query Type</Label>
                  <Select value={queryType} onValueChange={setQueryType}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="SELECT" className="text-white">SELECT</SelectItem>
                      <SelectItem value="INSERT" className="text-white">INSERT</SelectItem>
                      <SelectItem value="UPDATE" className="text-white">UPDATE</SelectItem>
                      <SelectItem value="DELETE" className="text-white">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Selection */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Select Tables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {availableTables.map(table => (
                  <div
                    key={table.name}
                    onClick={() => selectedTables.includes(table.name) ? removeTable(table.name) : addTable(table.name)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTables.includes(table.name)
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{table.name}</span>
                      <Badge className="bg-slate-700 text-xs">{table.columns.length} cols</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTables.length > 0 && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                  <Label className="text-white font-bold mb-2 block">Selected Tables</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTables.map(table => (
                      <Badge key={table} className="bg-cyan-500">
                        {table}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTable(table)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column Selection */}
          {selectedTables.length > 0 && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Select Columns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedTables.map(tableName => {
                  const table = availableTables.find(t => t.name === tableName);
                  return (
                    <div key={tableName} className="mb-4">
                      <Label className="text-cyan-400 font-bold mb-2 block">{tableName}</Label>
                      <div className="grid md:grid-cols-3 gap-2">
                        {table.columns.map(column => {
                          const fullColumn = `${tableName}.${column}`;
                          return (
                            <label key={column} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded">
                              <Checkbox
                                checked={selectedColumns.includes(fullColumn)}
                                onCheckedChange={() => toggleColumn(fullColumn)}
                              />
                              <span className="text-slate-300 text-sm">{column}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Joins */}
          {selectedTables.length > 1 && queryType === 'SELECT' && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Table Joins
                  </CardTitle>
                  <Button size="sm" onClick={addJoin} className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Join
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {joins.map((join, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-3 bg-slate-900/50 rounded-lg">
                      <Select value={join.type} onValueChange={(v) => updateJoin(idx, 'type', v)}>
                        <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {joinTypes.map(type => (
                            <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Table name"
                        value={join.table}
                        onChange={(e) => updateJoin(idx, 'table', e.target.value)}
                        className="flex-1 bg-slate-900 border-slate-700 text-white"
                      />
                      <span className="text-white">ON</span>
                      <Input
                        placeholder="table1.id = table2.foreign_id"
                        value={join.on}
                        onChange={(e) => updateJoin(idx, 'on', e.target.value)}
                        className="flex-1 bg-slate-900 border-slate-700 text-white"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeJoin(idx)} className="text-red-400">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conditions (WHERE) */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Conditions (WHERE)
                </CardTitle>
                <Button size="sm" onClick={addCondition} className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {conditions.map((condition, idx) => (
                  <div key={idx} className="flex gap-2 items-center p-3 bg-slate-900/50 rounded-lg">
                    {idx > 0 && (
                      <Select value={condition.logical} onValueChange={(v) => updateCondition(idx, 'logical', v)}>
                        <SelectTrigger className="w-20 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {logicalOperators.map(op => (
                            <SelectItem key={op} value={op} className="text-white">{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      placeholder="Column name"
                      value={condition.column}
                      onChange={(e) => updateCondition(idx, 'column', e.target.value)}
                      className="flex-1 bg-slate-900 border-slate-700 text-white"
                    />
                    <Select value={condition.operator} onValueChange={(v) => updateCondition(idx, 'operator', v)}>
                      <SelectTrigger className="w-24 bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {operators.map(op => (
                          <SelectItem key={op} value={op} className="text-white">{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                      className="flex-1 bg-slate-900 border-slate-700 text-white"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeCondition(idx)} className="text-red-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order By */}
          {queryType === 'SELECT' && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort Results (ORDER BY)
                  </CardTitle>
                  <Button size="sm" onClick={addOrderBy} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Sort
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {orderBy.map((order, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-3 bg-slate-900/50 rounded-lg">
                      <Input
                        placeholder="Column name"
                        value={order.column}
                        onChange={(e) => updateOrderBy(idx, 'column', e.target.value)}
                        className="flex-1 bg-slate-900 border-slate-700 text-white"
                      />
                      <Select value={order.direction} onValueChange={(v) => updateOrderBy(idx, 'direction', v)}>
                        <SelectTrigger className="w-24 bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="ASC" className="text-white">ASC</SelectItem>
                          <SelectItem value="DESC" className="text-white">DESC</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => removeOrderBy(idx)} className="text-red-400">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Label className="text-white font-bold mb-2 block">Limit Results</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-32 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generated SQL & Results */}
        <div className="space-y-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                Generated SQL
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {generatedSQL ? (
                <>
                  <pre className="bg-slate-900 p-4 rounded-lg text-cyan-400 text-sm overflow-x-auto mb-4">
                    {generatedSQL}
                  </pre>
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-300">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button onClick={executeQuery} size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                      <Play className="w-3 h-3 mr-1" />
                      Execute
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-center py-8 text-sm">
                  Build your query and click "Generate SQL"
                </p>
              )}
            </CardContent>
          </Card>

          {queryResults && (
            <Card className="bg-green-900/20 border-green-500/30">
              <CardHeader className="border-b border-green-500/30">
                <CardTitle className="text-green-300 font-bold text-sm flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Query Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-200">Rows:</span>
                    <span className="text-white font-bold">{queryResults.rowCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-200">Execution Time:</span>
                    <span className="text-white font-bold">{queryResults.executionTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-200">Affected:</span>
                    <span className="text-white font-bold">{queryResults.affectedRows}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardHeader className="border-b border-blue-500/30">
              <CardTitle className="text-blue-300 font-bold text-sm">💡 Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="text-blue-200 text-xs space-y-2">
                <li>• Select tables first to see available columns</li>
                <li>• Use joins to combine data from multiple tables</li>
                <li>• Add conditions to filter your results</li>
                <li>• Use ORDER BY to sort your data</li>
                <li>• Save frequently used queries for reuse</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}