import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, GitBranch, Key, Link2, Database, Code,
  Copy, Download, Save, Eye, Layers, ArrowRight
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminSchemaGenerator() {
  const [schemaName, setSchemaName] = useState('MySchema');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [generatedDDL, setGeneratedDDL] = useState('');
  const [viewMode, setViewMode] = useState('builder'); // builder or code

  const dataTypes = [
    'string', 'integer', 'number', 'boolean', 'date', 'date-time',
    'email', 'url', 'text', 'json', 'array', 'object'
  ];

  const addTable = () => {
    const newTable = {
      id: Date.now(),
      name: `Table${tables.length + 1}`,
      columns: [
        { id: Date.now(), name: 'id', type: 'string', primaryKey: true, required: true, unique: true }
      ],
      description: ''
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable.id);
  };

  const updateTable = (tableId, field, value) => {
    setTables(tables.map(t => t.id === tableId ? { ...t, [field]: value } : t));
  };

  const deleteTable = (tableId) => {
    setTables(tables.filter(t => t.id !== tableId));
    if (selectedTable === tableId) {
      setSelectedTable(tables.length > 1 ? tables[0].id : null);
    }
  };

  const addColumn = (tableId) => {
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: [...t.columns, {
            id: Date.now(),
            name: `column${t.columns.length + 1}`,
            type: 'string',
            primaryKey: false,
            required: false,
            unique: false,
            defaultValue: '',
            description: ''
          }]
        };
      }
      return t;
    }));
  };

  const updateColumn = (tableId, columnId, field, value) => {
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: t.columns.map(c => 
            c.id === columnId ? { ...c, [field]: value } : c
          )
        };
      }
      return t;
    }));
  };

  const deleteColumn = (tableId, columnId) => {
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: t.columns.filter(c => c.id !== columnId)
        };
      }
      return t;
    }));
  };

  const generateDDL = () => {
    let ddl = `-- Database Schema: ${schemaName}\n`;
    ddl += `-- Generated on ${new Date().toLocaleString()}\n\n`;

    tables.forEach(table => {
      ddl += `-- Table: ${table.name}\n`;
      if (table.description) {
        ddl += `-- Description: ${table.description}\n`;
      }
      ddl += `CREATE TABLE ${table.name} (\n`;
      
      const columnDefs = table.columns.map((col, idx) => {
        let def = `  ${col.name} `;
        
        // Map to SQL types
        switch(col.type) {
          case 'string':
          case 'email':
          case 'url':
            def += 'VARCHAR(255)';
            break;
          case 'text':
            def += 'TEXT';
            break;
          case 'integer':
            def += 'INTEGER';
            break;
          case 'number':
            def += 'DECIMAL(10,2)';
            break;
          case 'boolean':
            def += 'BOOLEAN';
            break;
          case 'date':
            def += 'DATE';
            break;
          case 'date-time':
            def += 'TIMESTAMP';
            break;
          case 'json':
            def += 'JSON';
            break;
          default:
            def += 'VARCHAR(255)';
        }

        if (col.primaryKey) def += ' PRIMARY KEY';
        if (col.required) def += ' NOT NULL';
        if (col.unique && !col.primaryKey) def += ' UNIQUE';
        if (col.defaultValue) def += ` DEFAULT '${col.defaultValue}'`;
        
        return def;
      });

      ddl += columnDefs.join(',\n');
      ddl += '\n);\n\n';

      // Add indexes for unique columns
      table.columns.forEach(col => {
        if (col.unique && !col.primaryKey) {
          ddl += `CREATE INDEX idx_${table.name}_${col.name} ON ${table.name}(${col.name});\n`;
        }
      });

      ddl += '\n';
    });

    // Add foreign key relationships (simplified)
    tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.name.endsWith('_id') && col.name !== 'id') {
          const refTable = col.name.replace('_id', '');
          const foundTable = tables.find(t => t.name.toLowerCase() === refTable.toLowerCase());
          if (foundTable) {
            ddl += `ALTER TABLE ${table.name} ADD FOREIGN KEY (${col.name}) REFERENCES ${foundTable.name}(id);\n`;
          }
        }
      });
    });

    setGeneratedDDL(ddl);
    setViewMode('code');
  };

  const exportAsJSON = () => {
    const schema = {
      name: schemaName,
      version: '1.0',
      createdAt: new Date().toISOString(),
      tables: tables.map(t => ({
        name: t.name,
        description: t.description,
        columns: t.columns.map(c => ({
          name: c.name,
          type: c.type,
          primaryKey: c.primaryKey,
          required: c.required,
          unique: c.unique,
          defaultValue: c.defaultValue,
          description: c.description
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName}_schema.json`;
    a.click();
  };

  const exportAsDDL = () => {
    const blob = new Blob([generatedDDL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName}_schema.sql`;
    a.click();
  };

  const currentTable = tables.find(t => t.id === selectedTable);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Schema Generator</h2>
          <p className="text-slate-400 font-semibold">Visually design database schemas and generate SQL</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAsJSON} variant="outline" className="border-slate-700 text-slate-300">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={generateDDL} className="bg-green-500 hover:bg-green-600">
            <Code className="w-4 h-4 mr-2" />
            Generate DDL
          </Button>
        </div>
      </div>

      {/* Schema Name */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Database className="w-8 h-8 text-cyan-400" />
            <div className="flex-1">
              <Label className="text-white font-bold mb-2 block">Schema Name</Label>
              <Input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                placeholder="MyDatabaseSchema"
              />
            </div>
            <Badge className="bg-purple-500">
              {tables.length} Tables
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tables List */}
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-bold text-sm">Tables</CardTitle>
              <Button size="sm" onClick={addTable} className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {tables.map(table => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTable === table.id
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold text-sm">{table.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTable(table.id);
                      }}
                      className="h-6 w-6 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Badge className="bg-slate-700 text-xs">
                    {table.columns.length} columns
                  </Badge>
                </div>
              ))}

              {tables.length === 0 && (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm mb-3">No tables yet</p>
                  <Button size="sm" onClick={addTable} className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-3 h-3 mr-1" />
                    Add First Table
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Editor */}
        <div className="lg:col-span-3">
          {currentTable ? (
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-[#1a1f3a] border border-slate-700 mb-6">
                <TabsTrigger value="builder" className="data-[state=active]:bg-cyan-500">
                  <Layers className="w-4 h-4 mr-2" />
                  Visual Builder
                </TabsTrigger>
                <TabsTrigger value="code" className="data-[state=active]:bg-cyan-500">
                  <Code className="w-4 h-4 mr-2" />
                  Generated SQL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="space-y-6">
                {/* Table Details */}
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Table Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Table Name</Label>
                        <Input
                          value={currentTable.name}
                          onChange={(e) => updateTable(currentTable.id, 'name', e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-2 block">Description</Label>
                        <Input
                          value={currentTable.description}
                          onChange={(e) => updateTable(currentTable.id, 'description', e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white"
                          placeholder="Optional table description"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Columns */}
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-bold">Columns</CardTitle>
                      <Button size="sm" onClick={() => addColumn(currentTable.id)} className="bg-purple-500 hover:bg-purple-600">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Column
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {currentTable.columns.map((column, idx) => (
                        <Card key={column.id} className="bg-slate-900/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label className="text-white font-bold mb-2 block text-sm">Column Name</Label>
                                <Input
                                  value={column.name}
                                  onChange={(e) => updateColumn(currentTable.id, column.id, 'name', e.target.value)}
                                  className="bg-slate-900 border-slate-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-white font-bold mb-2 block text-sm">Data Type</Label>
                                <Select
                                  value={column.type}
                                  onValueChange={(v) => updateColumn(currentTable.id, column.id, 'type', v)}
                                >
                                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    {dataTypes.map(type => (
                                      <SelectItem key={type} value={type} className="text-white">
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <Input
                                placeholder="Default value (optional)"
                                value={column.defaultValue}
                                onChange={(e) => updateColumn(currentTable.id, column.id, 'defaultValue', e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white"
                              />
                              <Input
                                placeholder="Description (optional)"
                                value={column.description}
                                onChange={(e) => updateColumn(currentTable.id, column.id, 'description', e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={column.primaryKey}
                                    onCheckedChange={(checked) => updateColumn(currentTable.id, column.id, 'primaryKey', checked)}
                                  />
                                  <span className="text-slate-300 text-sm flex items-center gap-1">
                                    <Key className="w-3 h-3" />
                                    Primary Key
                                  </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={column.required}
                                    onCheckedChange={(checked) => updateColumn(currentTable.id, column.id, 'required', checked)}
                                  />
                                  <span className="text-slate-300 text-sm">Required</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={column.unique}
                                    onCheckedChange={(checked) => updateColumn(currentTable.id, column.id, 'unique', checked)}
                                  />
                                  <span className="text-slate-300 text-sm">Unique</span>
                                </label>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteColumn(currentTable.id, column.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-bold">Generated DDL Script</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(generatedDDL)}
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" onClick={exportAsDDL} className="bg-green-500 hover:bg-green-600">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {generatedDDL ? (
                      <pre className="bg-slate-900 p-6 text-cyan-400 text-sm overflow-x-auto max-h-[600px] overflow-y-auto">
                        {generatedDDL}
                      </pre>
                    ) : (
                      <div className="p-12 text-center">
                        <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">No DDL generated yet</p>
                        <Button onClick={generateDDL} className="bg-green-500 hover:bg-green-600">
                          <Code className="w-4 h-4 mr-2" />
                          Generate DDL
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">No Table Selected</h3>
                <p className="text-slate-400 mb-6">Create a table to start designing your schema</p>
                <Button onClick={addTable} className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Table
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}