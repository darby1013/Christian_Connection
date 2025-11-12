import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Package,
  Eye, Heart, BarChart3, PieChart, Calendar, ArrowUpRight,
  ArrowDownRight, Target, Zap, Award, AlertTriangle
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format, subDays } from "date-fns";

export default function AdminStoreAnalytics() {
  const [dateRange, setDateRange] = useState(30);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ['abandonedCarts'],
    queryFn: () => base44.entities.AbandonedCart.list('-abandoned_at'),
    initialData: [],
  });

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  const topProducts = products
    .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
    .slice(0, 5);

  const revenueByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + (product.total_revenue || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(revenueByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // Last 7 days revenue
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOrders = orders.filter(o => 
      format(new Date(o.created_date), 'yyyy-MM-dd') === dateStr
    );
    return {
      date: format(date, 'MMM dd'),
      revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      orders: dayOrders.length
    };
  });

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const totalAbandoned = abandonedCarts.reduce((sum, c) => sum + c.cart_value, 0);
  const recoveredCarts = abandonedCarts.filter(c => c.recovered).length;
  const recoveryRate = abandonedCarts.length > 0 ? (recoveredCarts / abandonedCarts.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Store Analytics</h2>
        <p className="text-slate-400 font-semibold">Comprehensive sales and performance insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">${totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{totalOrders}</Badge>
            </div>
            <p className="text-3xl font-black text-white mb-1">{totalOrders}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">${avgOrderValue.toFixed(2)}</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Order Value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">{conversionRate.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm font-semibold">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} name="Revenue ($)" />
                <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={3} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Top Performing Products
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {topProducts.map((product, idx) => (
            <div key={product.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black">
                {idx + 1}
              </div>
              <div className="w-16 h-16 rounded overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold">{product.name}</h4>
                <p className="text-slate-400 text-sm">{product.total_sales || 0} sold</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-400 font-black text-xl">${(product.total_revenue || 0).toFixed(2)}</p>
                <p className="text-slate-400 text-xs">Revenue</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cart Abandonment */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Cart Abandonment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-white mb-2">{abandonedCarts.length}</p>
              <p className="text-slate-400 text-sm">Abandoned Carts</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-amber-400 mb-2">${totalAbandoned.toFixed(2)}</p>
              <p className="text-slate-400 text-sm">Potential Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-green-400 mb-2">{recoveryRate.toFixed(1)}%</p>
              <p className="text-slate-400 text-sm">Recovery Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}