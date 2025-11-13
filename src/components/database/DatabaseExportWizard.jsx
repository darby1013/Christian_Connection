import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download, FileCode, FileJson, FileSpreadsheet, FileText,
  CheckCircle, Clock, Database, Zap, Shield
} from "lucide-react";

export default function DatabaseExportWizard({ 
  tables, 
  onExport, 
  exporting, 
  progress 
}) {
  const [selectedFormat, setSelectedFormat] = useState('SQL');
  const [selectedTables, setSelectedTables] = useState([]);
  const [options, setOptions] = useState({
    includeSchema: true,
    includeData: true,
    includeIndexes: true,
    compression: false,
    batchSize: 1000
  });

  const formats = [
    { 
      id: 'SQL', 
      name: 'SQL Dump', 
      icon: FileCode, 
      color: 'cyan',
      description: 'Complete database backup with schema & data',
      fileExt: '.sql'
    },
    { 
      id: 'JSON', 
      name: 'JSON', 
      icon: FileJson, 
      color: 'green',
      description: 'Structured data for API integration',
      fileExt: '.json'
    },
    { 
      id: 'CSV', 
      name: 'CSV', 
      icon: FileSpreadsheet, 
      color: 'blue',
      description: 'Spreadsheet-compatible format',
      fileExt: '.csv'
    },
    { 
      id: 'XML', 
      name: 'XML', 
      icon: FileText, 
      color: 'purple',
      description: 'Hierarchical data structure',
      fileExt: '.xml'
    },
  ];

  const toggleTable = (tableName) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter(t => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  const handleExport = () => {
    onExport({
      format: selectedFormat,
      tables: selectedTables,
      options
    });
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Step 1: Choose Export Format</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {formats.map(format => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              return (
                <Card
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`w-8 h-8 text-${format.color}-400 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-bold">{format.name}</h4>
                          {isSelected && <CheckCircle className="w-5 h-5 text-cyan-400" />}
                        </div>
                        <p className="text-slate-400 text-xs mb-2">{format.description}</p>
                        <Badge className={`bg-${format.color}-500`}>{format.fileExt}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table Selection */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">Step 2: Select Tables</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => setSelectedTables(tables.map(t => t.name))}
                variant="outline" 
                className="border-slate-700"
              >
                Select All
              </Button>
              <Button 
                size="sm" 
                onClick={() => setSelectedTables([])}
                variant="outline" 
                className="border-slate-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-3">
            {tables.map(table => (
              <label
                key={table.name}
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-all"
              >
                <Checkbox
                  checked={selectedTables.includes(table.name)}
                  onCheckedChange={() => toggleTable(table.name)}
                />
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{table.name}</p>
                  <p className="text-slate-400 text-xs">{table.recordCount || 0} records</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Step 3: Configure Options</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-white font-bold">Export Content</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.includeSchema}
                  onCheckedChange={(checked) => setOptions({...options, includeSchema: checked})}
                />
                <span className="text-slate-300 text-sm">Include Schema (CREATE TABLE)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.includeData}
                  onCheckedChange={(checked) => setOptions({...options, includeData: checked})}
                />
                <span className="text-slate-300 text-sm">Include Data (INSERT INTO)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.includeIndexes}
                  onCheckedChange={(checked) => setOptions({...options, includeIndexes: checked})}
                />
                <span className="text-slate-300 text-sm">Include Indexes</span>
              </label>
            </div>

            <div className="space-y-3">
              <Label className="text-white font-bold">Performance</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.compression}
                  onCheckedChange={(checked) => setOptions({...options, compression: checked})}
                />
                <span className="text-slate-300 text-sm">Enable Compression (ZIP)</span>
              </label>
              
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Batch Size</Label>
                <Input
                  type="number"
                  value={options.batchSize}
                  onChange={(e) => setOptions({...options, batchSize: parseInt(e.target.value)})}
                  className="bg-slate-900 border-slate-700 text-white"
                  min={100}
                  max={10000}
                  step={100}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {exporting && (
        <Card className="bg-cyan-900/20 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-bold">Exporting database...</span>
              </div>
              <span className="text-cyan-200 font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex items-center gap-4 text-sm text-cyan-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Processing tables: {selectedTables.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure export</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={selectedTables.length === 0 || exporting}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-bold h-14 text-lg"
      >
        {exporting ? (
          <>
            <Zap className="w-5 h-5 mr-2 animate-pulse" />
            Exporting {selectedTables.length} Tables...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Export {selectedTables.length} Tables as {selectedFormat}
          </>
        )}
      </Button>
    </div>
  );
}