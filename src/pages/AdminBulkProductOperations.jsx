import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Zap, Upload, Download, Copy, DollarSign, Tag, Archive } from 'lucide-react';

export default function AdminBulkProductOperations() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [operation, setOperation] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }) => {
      await Promise.all(productIds.map(id => base44.entities.Product.update(id, updates)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      alert('✅ Bulk update completed!');
      setSelectedProducts([]);
    }
  });

  const executeBulkOperation = () => {
    if (selectedProducts.length === 0) {
      alert('Select products first');
      return;
    }

    let updates = {};
    
    switch(operation) {
      case 'price_increase':
        const increasePercent = parseFloat(bulkValue);
        selectedProducts.forEach(id => {
          const product = products.find(p => p.id === id);
          if (product) {
            updates = { price: product.price * (1 + increasePercent / 100) };
            base44.entities.Product.update(id, updates);
          }
        });
        break;
      case 'price_decrease':
        const decreasePercent = parseFloat(bulkValue);
        selectedProducts.forEach(id => {
          const product = products.find(p => p.id === id);
          if (product) {
            updates = { price: product.price * (1 - decreasePercent / 100) };
            base44.entities.Product.update(id, updates);
          }
        });
        break;
      case 'add_tag':
        updates = { tags: bulkValue };
        bulkUpdateMutation.mutate({ productIds: selectedProducts, updates });
        break;
      case 'change_category':
        updates = { category: bulkValue };
        bulkUpdateMutation.mutate({ productIds: selectedProducts, updates });
        break;
      case 'archive':
        updates = { status: 'archived' };
        bulkUpdateMutation.mutate({ productIds: selectedProducts, updates });
        break;
      case 'activate':
        updates = { status: 'active' };
        bulkUpdateMutation.mutate({ productIds: selectedProducts, updates });
        break;
      default:
        alert('Select an operation');
    }
    
    if (operation.includes('price')) {
      queryClient.invalidateQueries(['products']);
      alert('✅ Bulk price update completed!');
      setSelectedProducts([]);
    }
  };

  const toggleProduct = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedProducts(products.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const exportProducts = () => {
    const csv = [
      ['Name', 'SKU', 'Price', 'Category', 'Stock'].join(','),
      ...products.map(p => [p.name, p.sku, p.price, p.category, p.stock_quantity].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-export.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Bulk Product Operations"
        subtitle="Perform actions on multiple products at once"
        icon={Zap}
        badge="ENTERPRISE"
        actions={[
          { label: 'Export CSV', icon: Download, onClick: exportProducts }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{products.length}</p>
            <p className="text-purple-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{selectedProducts.length}</p>
            <p className="text-cyan-300 text-sm font-bold">Selected</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <Button onClick={selectAll} className="w-full bg-green-600 hover:bg-green-700 font-bold">
              Select All
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <Button onClick={clearSelection} className="w-full bg-red-600 hover:bg-red-700 font-bold">
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">Bulk Operations</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label className="text-white mb-2 block">Operation Type</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="price_increase">Price Increase (%)</SelectItem>
                  <SelectItem value="price_decrease">Price Decrease (%)</SelectItem>
                  <SelectItem value="add_tag">Add Tag</SelectItem>
                  <SelectItem value="change_category">Change Category</SelectItem>
                  <SelectItem value="archive">Archive Products</SelectItem>
                  <SelectItem value="activate">Activate Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white mb-2 block">Value</Label>
              <Input
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Enter value..."
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">&nbsp;</Label>
              <Button onClick={executeBulkOperation} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 h-10 font-bold">
                <Zap className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">Select Products</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {products.map(product => (
              <Card 
                key={product.id}
                className={`cursor-pointer transition-all ${
                  selectedProducts.includes(product.id) 
                    ? 'bg-cyan-900/30 border-cyan-500' 
                    : 'bg-slate-900/30 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{product.name}</p>
                      <p className="text-slate-400 text-xs">${product.price?.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}