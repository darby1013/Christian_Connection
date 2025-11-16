import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { BarChart3, DollarSign, TrendingUp, Users, Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSalesReports() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: orders = [] } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const filteredOrders = orders.filter(order => {
    if (!dateRange.start || !dateRange.end) return true;
    const orderDate = new Date(order.created_date);
    return orderDate >= new Date(dateRange.start) && orderDate <= new Date(dateRange.end);
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const totalOrders = filteredOrders.length;

  const dailySales = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.created_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + order.total_amount;
    return acc;
  }, {});

  const salesChartData = Object.entries(dailySales).map(([date, amount]) => ({
    name: date,
    sales: amount
  })).slice(-30);

  const productSales = products.map(product => ({
    name: product.name,
    sales: product.total_sales || 0,
    revenue: product.total_revenue || 0
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const customerSegments = [
    { name: 'VIP', count: customers.filter(c => (c.lifetime_spend || 0) > 1000).length, color: '#facc15' },
    { name: 'Regular', count: customers.filter(c => (c.lifetime_spend || 0) > 100 && (c.lifetime_spend || 0) <= 1000).length, color: '#06b6d4' },
    { name: 'New', count: customers.filter(c => (c.lifetime_spend || 0) <= 100).length, color: '#a855f7' }
  ];

  const topProductsColumns = [
    { header: 'Product', key: 'name', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Units Sold', key: 'sales', render: (val) => <span className="text-cyan-400">{val}</span> },
    { header: 'Revenue', key: 'revenue', render: (val) => <span className="text-green-400 font-bold">${val?.toFixed(2)}</span> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Sales Reports & Analytics"
        subtitle="Comprehensive insights into your business performance"
        icon={BarChart3}
        badge="ANALYTICS"
        actions={[
          { label: 'Export Report', icon: Download, onClick: () => {} }
        ]}
      />

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-white">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-3xl font-black text-white">${totalRevenue.toFixed(0)}</p>
            <p className="text-green-300 text-sm font-bold">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white">{totalOrders}</p>
            <p className="text-blue-300 text-sm font-bold">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">${avgOrderValue.toFixed(2)}</p>
            <p className="text-purple-300 text-sm font-bold">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseChart
        title="Sales Over Time"
        subtitle="Daily revenue trends"
        type="area"
        data={salesChartData}
        dataKey="sales"
        height={400}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <EnterpriseChart
          title="Top Selling Products"
          type="bar"
          data={productSales}
          dataKey="revenue"
          height={350}
        />

        <EnterpriseChart
          title="Customer Segmentation"
          type="pie"
          data={customerSegments}
          height={350}
        />
      </div>

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-black text-xl mb-4">Top Products</h3>
          <EnterpriseTable columns={topProductsColumns} data={productSales} />
        </CardContent>
      </Card>
    </div>
  );
}