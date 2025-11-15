import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Upload, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminBulkProductManager() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const queryClient = useQueryClient();

  const handleCSVImport = async (file) => {
    setImporting(true);
    setImportResult(null);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            stock_quantity: { type: 'number' },
            category: { type: 'string' },
            sku: { type: 'string' }
          }
        }
      });

      if (result.status === 'success' && result.output) {
        const products = Array.isArray(result.output) ? result.output : [result.output];
        await base44.entities.Product.bulkCreate(products);
        
        setImportResult({
          success: true,
          count: products.length,
          message: `Successfully imported ${products.length} products`
        });
        
        queryClient.invalidateQueries(['products']);
      } else {
        setImportResult({
          success: false,
          message: result.details || 'Import failed'
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const exportToCSV = async () => {
    const products = await base44.entities.Product.list();
    const csvData = products.map(p => ({
      name: p.name,
      description: p.description,
      price: p.price,
      stock_quantity: p.stock_quantity,
      category: p.category,
      sku: p.sku
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_export.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Bulk Product Manager"
        subtitle="Import and export products in bulk"
        icon={Upload}
        badge="BULK OPS"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-xl">Import Products</h3>
                <p className="text-blue-300 text-sm">Upload CSV file</p>
              </div>
            </div>
            
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCSVImport(file);
              }}
              disabled={importing}
              className="bg-slate-900 border-slate-700 text-white mb-4"
            />

            {importing && (
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing products...</span>
              </div>
            )}

            {importResult && (
              <div className={`flex items-start gap-2 p-4 rounded-lg ${
                importResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {importResult.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <div>
                  <p className="font-bold">{importResult.success ? 'Success!' : 'Error'}</p>
                  <p className="text-sm">{importResult.message}</p>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
              <p className="text-slate-300 text-sm font-bold mb-2">CSV Format:</p>
              <code className="text-xs text-slate-400">
                name,description,price,stock_quantity,category,sku
              </code>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-xl">Export Products</h3>
                <p className="text-green-300 text-sm">Download as CSV</p>
              </div>
            </div>

            <Button
              onClick={exportToCSV}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-bold h-12 mb-6"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Products
            </Button>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300 text-sm">Products</span>
                <Badge className="bg-green-500">All</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300 text-sm">Format</span>
                <Badge className="bg-blue-500">CSV</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300 text-sm">Includes</span>
                <Badge className="bg-purple-500">All Fields</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-8">
          <h3 className="text-white font-black text-xl mb-4">Quick Tips</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Ensure your CSV file has headers matching the required format</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Price and stock_quantity should be numeric values</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Export products first to see the correct format</span>
            </li>
            <li className="flex items-start gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>SKU should be unique for each product</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}