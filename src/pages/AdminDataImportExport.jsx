import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload, Download, FileSpreadsheet, FileJson, Database,
  CheckCircle, AlertCircle, RefreshCw, File, Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDataImportExport() {
  const [selectedEntity, setSelectedEntity] = useState("Product");
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const queryClient = useQueryClient();

  const entities = [
    'Product', 'Order', 'CustomerLoyalty', 'ProductBundle',
    'Coupon', 'GiftCard', 'Inventory', 'ProductReview'
  ];

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    setImporting(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: importFile });

      // Extract data from file
      const schema = await base44.entities[selectedEntity].schema();
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === 'success' && result.output) {
        // Bulk create
        const records = Array.isArray(result.output) ? result.output : [result.output];
        
        for (const record of records) {
          await base44.entities[selectedEntity].create(record);
        }

        setImportResults({
          success: true,
          count: records.length,
          message: `Successfully imported ${records.length} records`
        });

        queryClient.invalidateQueries();
      } else {
        setImportResults({
          success: false,
          message: result.details || 'Import failed'
        });
      }

    } catch (error) {
      setImportResults({
        success: false,
        message: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format = 'json') => {
    setExporting(true);
    try {
      const data = await base44.entities[selectedEntity].list();
      
      let content, mimeType, extension;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).map(v => 
          typeof v === 'string' ? `"${v}"` : v
        ).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEntity}_export_${Date.now()}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`✅ Exported ${data.length} records!`);
    } catch (error) {
      alert('Export error: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Import / Export Manager</h2>
        <p className="text-slate-400 font-semibold">Bulk data import and export tools</p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="import" className="data-[state=active]:bg-cyan-500">
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyan-500">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Bulk Import</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Target Entity</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {entities.map(entity => (
                      <SelectItem key={entity} value={entity} className="text-white">
                        {entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Upload File (CSV or JSON)</Label>
                <Input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0])}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {importFile && (
                <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <File className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-cyan-300 font-bold text-sm">{importFile.name}</p>
                      <p className="text-cyan-200 text-xs">{(importFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold h-12"
              >
                {importing ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Importing...</>
                ) : (
                  <><Upload className="w-5 h-5 mr-2" />Import Data</>
                )}
              </Button>

              {importResults && (
                <Card className={importResults.success ? 
                  "bg-green-900/20 border-green-500/30" : 
                  "bg-red-900/20 border-red-500/30"
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {importResults.success ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <h4 className={importResults.success ? "text-green-300 font-bold mb-1" : "text-red-300 font-bold mb-1"}>
                          {importResults.success ? 'Import Successful!' : 'Import Failed'}
                        </h4>
                        <p className={importResults.success ? "text-green-200 text-sm" : "text-red-200 text-sm"}>
                          {importResults.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Export Data</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Select Entity</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {entities.map(entity => (
                      <SelectItem key={entity} value={entity} className="text-white">
                        {entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="bg-purple-500 hover:bg-purple-600 h-16"
                >
                  <FileJson className="w-6 h-6 mr-2" />
                  Export as JSON
                </Button>
                <Button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="bg-green-500 hover:bg-green-600 h-16"
                >
                  <FileSpreadsheet className="w-6 h-6 mr-2" />
                  Export as CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}