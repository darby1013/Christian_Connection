import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Warehouse, AlertTriangle, TrendingUp, Package } from 'lucide-react';

export default function AdminInventoryManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['inventoryProducts'],
    queryFn: () => base44.entities.Product.list('-stock_quantity'),
    refetchInterval: 5000,
    initialData: []
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }) => base44.entities.Product.update(id, { stock_quantity: stock }),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventoryProducts']);
      setShowDialog(false);
      setStockAdjustment('');
    }
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => (p.stock_quantity || 0) > 0).length,
    lowStock: products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10).length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length
  };

  const columns = [
    {
      header: 'Product',
      key: 'name',
      render: (_, product) => {
        const images = Array.isArray(product.images) 
          ? product.images 
          : (product.images ? JSON.parse(product.images) : []);
        return (
          <div className="flex items-center gap-3">
            <img src={images[0] || '/placeholder.jpg'} alt="" className="w-12 h-12 object-cover rounded" />
            <div>
              <p className="text-white font-bold">{product.name}</p>
              <p className="text-slate-400 text-xs">{product.sku}</p>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Stock', 
      key: 'stock_quantity', 
      render: (val) => (
        <Badge className={
          val === 0 ? 'bg-red-500' :
          val < 10 ? 'bg-yellow-500' :
          'bg-green-500'
        }>
          {val || 0}
        </Badge>
      )
    },
    { header: 'Category', key: 'category', render: (val) => <span className="text-slate-300">{val || 'N/A'}</span> },
    { header: 'Price', key: 'price', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Inventory Management"
        subtitle="Real-time stock monitoring and control"
        icon={Warehouse}
        badge="LIVE"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.total}</p>
            <p className="text-blue-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.inStock}</p>
            <p className="text-green-300 text-sm font-bold">In Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.lowStock}</p>
            <p className="text-yellow-300 text-sm font-bold">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.outOfStock}</p>
            <p className="text-red-300 text-sm font-bold">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={products}
        onRowClick={(product) => {
          setSelectedProduct(product);
          setShowDialog(true);
        }}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              Adjust Stock: {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Current Stock</p>
                <p className="text-white font-black text-3xl">{selectedProduct.stock_quantity || 0}</p>
              </div>
              <div>
                <label className="text-white font-bold mb-2 block">New Stock Quantity</label>
                <Input
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(e.target.value)}
                  placeholder="Enter new stock quantity"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={() => updateStockMutation.mutate({ 
                  id: selectedProduct.id, 
                  stock: parseInt(stockAdjustment) 
                })}
                disabled={!stockAdjustment}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold h-12"
              >
                Update Stock
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}