import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { BarChart3, TrendingUp, Eye, ShoppingCart } from 'lucide-react';

export default function AdminProductAnalytics() {
  const { data: products = [] } = useQuery({
    queryKey: ['analyticsProducts'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: productAnalytics = [] } = useQuery({
    queryKey: ['productAnalytics'],
    queryFn: () => base44.entities.ProductAnalytics.list('-views'),
    initialData: []
  });

  const topProducts = productAnalytics.slice(0, 10);
  const chartData = topProducts.map(p => ({
    name: p.product_name?.slice(0, 15) + '...',
    views: p.views || 0,
    sales: p.units_sold || 0
  }));

  const stats = {
    totalViews: productAnalytics.reduce((sum, p) => sum + (p.views || 0), 0),
    totalSales: productAnalytics.reduce((sum, p) => sum + (p.units_sold || 0), 0),
    avgConversion: (productAnalytics.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / (productAnalytics.length || 1)).toFixed(2)
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Analytics"
        subtitle="Deep insights into product performance"
        icon={BarChart3}
        badge="ANALYTICS"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalViews.toLocaleString()}</p>
            <p className="text-cyan-300 text-sm font-bold">Total Product Views</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.totalSales.toLocaleString()}</p>
            <p className="text-green-300 text-sm font-bold">Units Sold</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.avgConversion}%</p>
            <p className="text-purple-300 text-sm font-bold">Avg Conversion</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseChart
        title="Top 10 Products by Views"
        type="bar"
        data={chartData}
        dataKey="views"
        height={400}
      />

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">Product Performance</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-slate-600">#{idx + 1}</span>
                  <div>
                    <p className="text-white font-bold">{product.product_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-cyan-500">{product.views || 0} views</Badge>
                      <Badge className="bg-green-500">{product.units_sold || 0} sold</Badge>
                      <Badge className="bg-purple-500">{product.conversion_rate || 0}% CVR</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-black text-xl">${product.revenue?.toFixed(0) || '0'}</p>
                  <p className="text-slate-400 text-sm">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}