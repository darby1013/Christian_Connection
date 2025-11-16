import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminInventoryForecasting() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['productAnalytics'],
    queryFn: () => base44.entities.ProductAnalytics.list(),
    initialData: []
  });

  const forecasts = products.map(product => {
    const analytic = analytics.find(a => a.product_id === product.id);
    const avgSalesPerMonth = (analytic?.units_sold || 0) / 3;
    const recommendedStock = Math.ceil(avgSalesPerMonth * 2);
    const daysUntilStockout = product.stock_quantity > 0 ? Math.floor(product.stock_quantity / (avgSalesPerMonth / 30)) : 0;
    
    return {
      ...product,
      avg_sales: avgSalesPerMonth,
      recommended_stock: recommendedStock,
      days_until_stockout: daysUntilStockout,
      needs_reorder: product.stock_quantity < recommendedStock * 0.3
    };
  }).sort((a, b) => a.days_until_stockout - b.days_until_stockout);

  const columns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Current Stock', key: 'stock_quantity', render: (val) => <span className="text-slate-300">{val || 0}</span> },
    { header: 'Avg Sales/Month', key: 'avg_sales', render: (val) => <span className="text-cyan-400">{val?.toFixed(1)}</span> },
    { header: 'Recommended', key: 'recommended_stock', render: (val) => <span className="text-green-400 font-bold">{val}</span> },
    { header: 'Days to Stockout', key: 'days_until_stockout', render: (val, row) => (
      <Badge className={val < 7 ? 'bg-red-500' : val < 30 ? 'bg-amber-500' : 'bg-green-500'}>
        {val} days
      </Badge>
    )}
  ];

  const criticalItems = forecasts.filter(f => f.days_until_stockout < 14);
  const needsReorder = forecasts.filter(f => f.needs_reorder);

  const forecastData = [
    { name: 'Critical (<7d)', value: forecasts.filter(f => f.days_until_stockout < 7).length },
    { name: 'Low (7-30d)', value: forecasts.filter(f => f.days_until_stockout >= 7 && f.days_until_stockout < 30).length },
    { name: 'Good (30-60d)', value: forecasts.filter(f => f.days_until_stockout >= 30 && f.days_until_stockout < 60).length },
    { name: 'Excellent (60d+)', value: forecasts.filter(f => f.days_until_stockout >= 60).length }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Inventory Forecasting"
        subtitle="AI-powered stock predictions and reorder recommendations"
        icon={TrendingUp}
        badge="AI POWERED"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{criticalItems.length}</p>
            <p className="text-red-300 text-sm font-bold">Critical Stock Items</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{needsReorder.length}</p>
            <p className="text-amber-300 text-sm font-bold">Needs Reorder</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{forecasts.filter(f => f.days_until_stockout >= 30).length}</p>
            <p className="text-green-300 text-sm font-bold">Well Stocked</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              ${forecasts.reduce((sum, f) => sum + (f.recommended_stock * (f.price || 0)), 0).toFixed(0)}
            </p>
            <p className="text-blue-300 text-sm font-bold">Reorder Investment</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseChart
        title="Stock Health Distribution"
        subtitle="Products by stockout timeline"
        type="bar"
        data={forecastData}
        dataKey="value"
        color="purple"
      />

      <EnterpriseTable
        columns={columns}
        data={forecasts.slice(0, 50)}
      />
    </div>
  );
}