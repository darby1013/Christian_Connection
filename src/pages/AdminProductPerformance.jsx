import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import EnterpriseStats from '../components/admin/EnterpriseStats';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminProductPerformance() {
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

  const performanceData = products.map(product => {
    const analytic = analytics.find(a => a.product_id === product.id);
    return {
      ...product,
      views: analytic?.views || 0,
      units_sold: analytic?.units_sold || 0,
      revenue: analytic?.revenue || 0,
      conversion_rate: analytic?.conversion_rate || 0,
      performance_score: ((analytic?.conversion_rate || 0) * 0.4) + ((analytic?.avg_rating || 0) * 10) + ((analytic?.units_sold || 0) * 0.1)
    };
  }).sort((a, b) => b.performance_score - a.performance_score);

  const topPerformers = performanceData.slice(0, 10);
  const lowPerformers = performanceData.slice(-10).reverse();

  const stats = [
    {
      title: 'Top Performer Revenue',
      value: `$${topPerformers.reduce((sum, p) => sum + (p.revenue || 0), 0).toFixed(0)}`,
      icon: DollarSign,
      trend: 'up',
      trendValue: '+25%',
      color: 'green'
    },
    {
      title: 'Avg Conversion Rate',
      value: `${(performanceData.reduce((sum, p) => sum + p.conversion_rate, 0) / performanceData.length).toFixed(2)}%`,
      icon: TrendingUp,
      color: 'cyan'
    },
    {
      title: 'Total Views',
      value: performanceData.reduce((sum, p) => sum + p.views, 0).toLocaleString(),
      icon: BarChart3,
      color: 'purple'
    },
    {
      title: 'Total Units Sold',
      value: performanceData.reduce((sum, p) => sum + p.units_sold, 0).toLocaleString(),
      icon: TrendingUp,
      color: 'blue'
    }
  ];

  const columns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Views', key: 'views', render: (val) => <span className="text-cyan-400">{val}</span> },
    { header: 'Sold', key: 'units_sold', render: (val) => <span className="text-green-400">{val}</span> },
    { header: 'Revenue', key: 'revenue', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(0)}</span> },
    { header: 'Conv. Rate', key: 'conversion_rate', render: (val) => <Badge className={val > 3 ? 'bg-green-500' : 'bg-amber-500'}>{val?.toFixed(2)}%</Badge> },
    { header: 'Score', key: 'performance_score', render: (val) => <span className="text-purple-400 font-bold">{val?.toFixed(1)}</span> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Performance"
        subtitle="Analyze product metrics and identify top performers"
        icon={BarChart3}
        badge="ANALYTICS"
      />

      <EnterpriseStats stats={stats} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-black text-xl">Top 10 Performers</h3>
            </div>
            <div className="space-y-2">
              {topPerformers.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-500">#{i + 1}</Badge>
                    <span className="text-white font-bold text-sm">{p.name}</span>
                  </div>
                  <span className="text-green-400 font-bold">${p.revenue?.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-6 h-6 text-red-400" />
              <h3 className="text-white font-black text-xl">Needs Attention</h3>
            </div>
            <div className="space-y-2">
              {lowPerformers.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-500">Low</Badge>
                    <span className="text-white font-bold text-sm">{p.name}</span>
                  </div>
                  <span className="text-red-400">{p.conversion_rate?.toFixed(2)}% conv</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={performanceData.slice(0, 50)}
      />
    </div>
  );
}