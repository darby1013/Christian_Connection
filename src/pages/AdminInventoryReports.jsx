import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Warehouse, AlertTriangle, TrendingDown, Package } from 'lucide-react';

export default function AdminInventoryReports() {
  const { data: products = [] } = useQuery({
    queryKey: ['inventoryProducts'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < (p.low_stock_threshold || 10));
  const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0);

  const stockLevels = products.map(p => ({
    name: p.name?.slice(0, 20) || 'Product',
    stock: p.stock_quantity || 0
  })).sort((a, b) => a.stock - b.stock).slice(0, 15);

  const categoryStock = products.reduce((acc, p) => {
    const cat = p.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + (p.stock_quantity || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(categoryStock).map(([name, count]) => ({
    name,
    value: count
  }));

  const columns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Category', key: 'category', render: (val) => <Badge className="bg-purple-500">{val || 'N/A'}</Badge> },
    { header: 'Stock', key: 'stock_quantity', render: (val) => (
      <Badge className={val === 0 ? 'bg-red-500' : val < 10 ? 'bg-yellow-500' : 'bg-green-500'}>
        {val || 0}
      </Badge>
    )},
    { header: 'Value', key: 'stock_quantity', render: (val, product) => (
      <span className="text-green-400 font-bold">${((val || 0) * (product.price || 0)).toFixed(2)}</span>
    )}
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Inventory Reports"
        subtitle="Real-time stock level monitoring and analytics"
        icon={Warehouse}
        badge="LIVE"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <Package className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-3xl font-black text-white">{products.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-3xl font-black text-white">{lowStockProducts.length}</p>
            <p className="text-yellow-300 text-sm font-bold">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <TrendingDown className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-3xl font-black text-white">{outOfStock.length}</p>
            <p className="text-red-300 text-sm font-bold">Out of Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <Package className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-3xl font-black text-white">${totalValue.toFixed(0)}</p>
            <p className="text-green-300 text-sm font-bold">Inventory Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <EnterpriseChart
          title="Stock Levels by Product"
          type="bar"
          data={stockLevels}
          dataKey="stock"
          height={400}
        />

        <EnterpriseChart
          title="Stock by Category"
          type="pie"
          data={categoryData}
          height={400}
        />
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">All Products Inventory</h3>
          <EnterpriseTable columns={columns} data={products} />
        </CardContent>
      </Card>
    </div>
  );
}