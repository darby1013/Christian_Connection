import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminSalesAnalytics() {
  const { data: orders = [] } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    refetchInterval: 10000,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const analytics = useMemo(() => {
    const last30Days = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return orderDate >= thirtyDaysAgo;
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const last30Revenue = last30Days.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_date);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      salesByDay.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        orders: dayOrders.length
      });
    }

    const productPerformance = products.map(p => ({
      name: p.name,
      stock: p.stock_quantity || 0,
      price: p.price || 0
    })).slice(0, 10);

    return {
      totalRevenue,
      last30Revenue,
      avgOrderValue,
      totalOrders: orders.length,
      salesByDay,
      productPerformance
    };
  }, [orders, products]);

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Sales Analytics"
        subtitle="Comprehensive sales insights and trends"
        icon={BarChart3}
        badge="INSIGHTS"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">All Time</Badge>
            </div>
            <p className="text-3xl font-black text-white">${analytics.totalRevenue.toFixed(0)}</p>
            <p className="text-green-300 text-sm font-bold">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">30 Days</Badge>
            </div>
            <p className="text-3xl font-black text-white">${analytics.last30Revenue.toFixed(0)}</p>
            <p className="text-blue-300 text-sm font-bold">Recent Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">{analytics.totalOrders}</p>
            <p className="text-purple-300 text-sm font-bold">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">${analytics.avgOrderValue.toFixed(2)}</p>
            <p className="text-amber-300 text-sm font-bold">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-white font-black text-xl mb-6">Sales Trend (7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-white font-black text-xl mb-6">Top Products by Stock</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.productPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="stock" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}