import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminProductImportExport() {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const exportCSV = () => {
    const headers = ['Name', 'SKU', 'Price', 'Category', 'Stock', 'Brand', 'Description'];
    const rows = products.map(p => [
      p.name, p.sku, p.price, p.category, p.stock_quantity, p.brand, p.description
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const data = JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = async (file) => {
    setImporting(true);
    try {
      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: await base44.integrations.Core.UploadFile({ file }).then(res => res.file_url),
        json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  category: { type: "string" },
                  stock_quantity: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (extractedData.status === 'success') {
        const productsToImport = extractedData.output.products || [];
        await base44.entities.Product.bulkCreate(productsToImport);
        setImportResults({ success: productsToImport.length, failed: 0 });
        queryClient.invalidateQueries(['products']);
      }
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Import/Export"
        subtitle="Bulk import and export product data"
        icon={FileText}
        badge="ENTERPRISE"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-black text-xl">Export Products</h3>
            </div>
            <p className="text-slate-300 mb-6">Download your product catalog in various formats</p>
            <div className="space-y-3">
              <Button onClick={exportCSV} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold">
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button onClick={exportJSON} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </Button>
            </div>
            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">
                <strong className="text-white">Ready to export:</strong> {products.length} products
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-cyan-400" />
              <h3 className="text-white font-black text-xl">Import Products</h3>
            </div>
            <p className="text-slate-300 mb-6">Upload CSV or JSON files to bulk import products</p>
            <Input
              type="file"
              accept=".csv,.json"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
              className="bg-slate-900 border-slate-700 text-white mb-4"
              disabled={importing}
            />
            {importing && (
              <div className="p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                <p className="text-cyan-400 font-bold">Importing products...</p>
              </div>
            )}
            {importResults && (
              <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-bold">Import Complete</p>
                </div>
                <p className="text-slate-300 text-sm">
                  ✅ {importResults.success} products imported successfully
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}