import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { TrendingUp, Plus, DollarSign, Target } from 'lucide-react';

export default function AdminPriceOptimization() {
  const queryClient = useQueryClient();

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

  const optimizedPrices = products.map(product => {
    const analytic = analytics.find(a => a.product_id === product.id);
    const conversionRate = analytic?.conversion_rate || 2;
    const avgRating = analytic?.avg_rating || 4;
    
    let suggestedPrice = product.price || 0;
    
    if (conversionRate < 1) {
      suggestedPrice *= 0.90;
    } else if (conversionRate > 5 && avgRating > 4.5) {
      suggestedPrice *= 1.15;
    }
    
    return {
      ...product,
      suggested_price: suggestedPrice,
      potential_revenue_increase: ((suggestedPrice - product.price) * (analytic?.units_sold || 10)),
      conversion_rate: conversionRate
    };
  }).sort((a, b) => b.potential_revenue_increase - a.potential_revenue_increase);

  const columns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Current Price', key: 'price', render: (val) => <span className="text-slate-300">${val?.toFixed(2)}</span> },
    { header: 'Suggested Price', key: 'suggested_price', render: (val) => <span className="text-cyan-400 font-bold">${val?.toFixed(2)}</span> },
    { header: 'Conv. Rate', key: 'conversion_rate', render: (val) => <span className="text-green-400">{val?.toFixed(1)}%</span> },
    { header: 'Potential +', key: 'potential_revenue_increase', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> }
  ];

  const totalPotentialIncrease = optimizedPrices.reduce((sum, p) => sum + (p.potential_revenue_increase || 0), 0);

  const priceDistribution = [
    { name: '$0-10', value: products.filter(p => p.price < 10).length },
    { name: '$10-20', value: products.filter(p => p.price >= 10 && p.price < 20).length },
    { name: '$20-30', value: products.filter(p => p.price >= 20 && p.price < 30).length },
    { name: '$30+', value: products.filter(p => p.price >= 30).length }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Price Optimization"
        subtitle="AI-powered pricing recommendations based on performance"
        icon={TrendingUp}
        badge="AI POWERED"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">${totalPotentialIncrease.toFixed(0)}</p>
            <p className="text-green-300 text-sm font-bold">Potential Revenue Increase</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{optimizedPrices.filter(p => p.suggested_price > p.price).length}</p>
            <p className="text-blue-300 text-sm font-bold">Products to Increase</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{optimizedPrices.filter(p => p.suggested_price < p.price).length}</p>
            <p className="text-purple-300 text-sm font-bold">Products to Decrease</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">
              ${(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toFixed(2)}
            </p>
            <p className="text-amber-300 text-sm font-bold">Average Price</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <EnterpriseChart
          title="Price Distribution"
          subtitle="Product count by price range"
          type="bar"
          data={priceDistribution}
          dataKey="value"
          color="cyan"
        />
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-white font-black text-xl mb-4">Optimization Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                <TrendingUp className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white font-bold">High Performers</p>
                  <p className="text-slate-300 text-sm">Products with conversion rate > 5% can support 10-15% price increase</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
                <Target className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white font-bold">Low Performers</p>
                  <p className="text-slate-300 text-sm">Products with conversion < 1% need 10% price reduction to boost sales</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                <DollarSign className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white font-bold">Market Positioning</p>
                  <p className="text-slate-300 text-sm">Premium products (4.5+ rating) can command 15-20% premium pricing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={optimizedPrices.slice(0, 20)}
      />
    </div>
  );
}