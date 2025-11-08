import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Users, TrendingUp, Video, ShoppingBag, MessageSquare,
  Eye, Heart, Crown, Package, ArrowUp, ArrowDown, Activity
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch all data
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['analyticsSubscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['analyticsOrders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['analyticsDonations'],
    queryFn: () => base44.entities.Donation.list('-created_date'),
    initialData: [],
  });

  const { data: streamTips = [] } = useQuery({
    queryKey: ['analyticsStreamTips'],
    queryFn: () => base44.entities.StreamTip.list('-created_date'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['analyticsUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ['analyticsStreams'],
    queryFn: () => base44.entities.LiveStream.list('-created_date'),
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['analyticsVideos'],
    queryFn: () => base44.entities.Video.list('-created_date'),
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['analyticsBlogPosts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date'),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['analyticsProducts'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: [],
  });

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['analyticsDigitalProducts'],
    queryFn: () => base44.entities.DigitalProduct.list('-created_date'),
    initialData: [],
  });

  const { data: forumThreads = [] } = useQuery({
    queryKey: ['analyticsForumThreads'],
    queryFn: () => base44.entities.ForumThread.list('-created_date'),
    initialData: [],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['analyticsGroups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
    initialData: [],
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const subscriptionRevenue = subscriptions.reduce((sum, s) => sum + (s.price || 0), 0);
    const orderRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const donationRevenue = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const tipRevenue = streamTips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalRevenue = subscriptionRevenue + orderRevenue + donationRevenue + tipRevenue;

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const totalViews = [...liveStreams, ...videos].reduce((sum, v) => sum + (v.views || v.viewer_count || 0), 0);
    const totalLikes = [...blogPosts, ...videos].reduce((sum, v) => sum + (v.likes || 0), 0);
    const totalForumPosts = forumThreads.reduce((sum, t) => sum + (t.reply_count || 0), 0) + forumThreads.length;
    const totalGroupMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

    // Growth calculations (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentUsers = users.filter(u => new Date(u.created_date) > thirtyDaysAgo).length;
    const previousUsers = users.filter(u => {
      const date = new Date(u.created_date);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    }).length;
    const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers * 100) : 100;

    const recentRevenue = [...orders, ...donations].filter(item => new Date(item.created_date) > thirtyDaysAgo)
      .reduce((sum, item) => sum + (item.total_amount || item.amount || 0), 0);
    const previousRevenue = [...orders, ...donations].filter(item => {
      const date = new Date(item.created_date);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    }).reduce((sum, item) => sum + (item.total_amount || item.amount || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100) : 100;

    return {
      totalRevenue,
      subscriptionRevenue,
      orderRevenue,
      donationRevenue,
      tipRevenue,
      activeSubscriptions,
      totalUsers: users.length,
      totalViews,
      totalLikes,
      totalForumPosts,
      totalGroupMembers,
      userGrowth,
      revenueGrowth,
      avgOrderValue: orders.length > 0 ? orderRevenue / orders.length : 0
    };
  }, [subscriptions, orders, donations, streamTips, users, liveStreams, videos, blogPosts, groups, forumThreads]);

  // Revenue over time data
  const revenueOverTime = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_date);
        return d >= monthStart && d <= monthEnd;
      }).reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const monthDonations = donations.filter(d => {
        const date = new Date(d.created_date);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, d) => sum + (d.amount || 0), 0);
      
      const monthTips = streamTips.filter(t => {
        const date = new Date(t.created_date);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, t) => sum + (t.amount || 0), 0);

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        orders: monthOrders,
        donations: monthDonations,
        tips: monthTips,
        total: monthOrders + monthDonations + monthTips
      });
    }
    return last6Months;
  }, [orders, donations, streamTips]);

  // Top performing content
  const topContent = useMemo(() => {
    const allContent = [
      ...liveStreams.map(s => ({ ...s, type: 'stream', metric: s.viewer_count || 0 })),
      ...videos.map(v => ({ ...v, type: 'video', metric: v.views || 0 })),
      ...blogPosts.map(p => ({ ...p, type: 'post', metric: p.views || 0 })),
    ].sort((a, b) => b.metric - a.metric).slice(0, 10);
    return allContent;
  }, [liveStreams, videos, blogPosts]);

  // Top products
  const topProducts = useMemo(() => {
    const allProducts = [
      ...products.map(p => ({ ...p, type: 'physical' })),
      ...digitalProducts.map(p => ({ ...p, type: 'digital' }))
    ].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
    return allProducts;
  }, [products, digitalProducts]);

  // Revenue breakdown
  const revenueBreakdown = [
    { name: 'Orders', value: metrics.orderRevenue, color: '#22d3ee' },
    { name: 'Subscriptions', value: metrics.subscriptionRevenue, color: '#a855f7' },
    { name: 'Donations', value: metrics.donationRevenue, color: '#10b981' },
    { name: 'Tips', value: metrics.tipRevenue, color: '#f59e0b' }
  ];

  // User growth data
  const userGrowthData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthUsers = users.filter(u => {
        const d = new Date(u.created_date);
        return d >= monthStart && d <= monthEnd;
      }).length;

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        users: monthUsers
      });
    }
    return last6Months;
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Analytics Dashboard</h2>
          <p className="text-slate-400 font-semibold">Comprehensive business insights and metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7d" className="text-white">Last 7 days</SelectItem>
            <SelectItem value="30d" className="text-white">Last 30 days</SelectItem>
            <SelectItem value="90d" className="text-white">Last 90 days</SelectItem>
            <SelectItem value="1y" className="text-white">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge className={metrics.revenueGrowth >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {metrics.revenueGrowth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(metrics.revenueGrowth).toFixed(1)}%
              </Badge>
            </div>
            <h3 className="text-slate-400 text-sm font-semibold mb-1">Total Revenue</h3>
            <p className="text-3xl font-black text-white">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-2">From all sources</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <Badge className={metrics.userGrowth >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {metrics.userGrowth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(metrics.userGrowth).toFixed(1)}%
              </Badge>
            </div>
            <h3 className="text-slate-400 text-sm font-semibold mb-1">Total Users</h3>
            <p className="text-3xl font-black text-white">{metrics.totalUsers}</p>
            <p className="text-xs text-slate-500 mt-2">Registered members</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-purple-500/20 text-purple-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            <h3 className="text-slate-400 text-sm font-semibold mb-1">Subscriptions</h3>
            <p className="text-3xl font-black text-white">{metrics.activeSubscriptions}</p>
            <p className="text-xs text-slate-500 mt-2">${metrics.subscriptionRevenue.toFixed(2)} MRR</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-400">
                <Eye className="w-3 h-3 mr-1" />
                {metrics.totalViews}
              </Badge>
            </div>
            <h3 className="text-slate-400 text-sm font-semibold mb-1">Engagement</h3>
            <p className="text-3xl font-black text-white">{metrics.totalLikes}</p>
            <p className="text-xs text-slate-500 mt-2">Total likes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="revenue" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Content
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Products
          </TabsTrigger>
          <TabsTrigger value="community" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            Community
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-[#1a1f3a] border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white font-black">Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueOverTime}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="orders" stroke="#22d3ee" fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                    <Area type="monotone" dataKey="donations" stroke="#10b981" fillOpacity={1} fill="url(#colorDonations)" name="Donations" />
                    <Area type="monotone" dataKey="tips" stroke="#f59e0b" fillOpacity={1} fill="#f59e0b" name="Tips" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <ShoppingBag className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Order Revenue</p>
                <p className="text-2xl font-black text-white">${metrics.orderRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Donations</p>
                <p className="text-2xl font-black text-white">${metrics.donationRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Avg Order Value</p>
                <p className="text-2xl font-black text-white">${metrics.avgOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={3} name="New Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Total Users</p>
                <p className="text-2xl font-black text-white">{metrics.totalUsers}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <Crown className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Subscribers</p>
                <p className="text-2xl font-black text-white">{metrics.activeSubscriptions}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Growth Rate</p>
                <p className="text-2xl font-black text-white">{metrics.userGrowth.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Avg. Daily Users</p>
                <p className="text-2xl font-black text-white">{Math.floor(metrics.totalUsers / 30)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topContent.map((content, idx) => (
                  <div key={content.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl font-black text-slate-600">#{idx + 1}</span>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{content.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={
                            content.type === 'stream' ? 'bg-red-500' :
                            content.type === 'video' ? 'bg-blue-500' : 'bg-purple-500'
                          }>
                            {content.type}
                          </Badge>
                          <span className="text-xs text-slate-400">{content.host_name || content.author_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-cyan-400">{content.metric.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">
                        {content.type === 'stream' ? 'viewers' : 'views'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Top Rated Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                    <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.images?.[0] || product.thumbnail_url ? (
                        <img src={product.images?.[0] || product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={product.type === 'physical' ? 'bg-cyan-500' : 'bg-purple-500'}>
                          {product.type}
                        </Badge>
                        <span className="text-xs text-slate-400">⭐ {(product.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-lg font-black text-white">${product.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Forum Posts</p>
                <p className="text-2xl font-black text-white">{metrics.totalForumPosts}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Groups</p>
                <p className="text-2xl font-black text-white">{groups.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Group Members</p>
                <p className="text-2xl font-black text-white">{metrics.totalGroupMembers}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Most Active Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groups.slice(0, 5).map((group, idx) => (
                  <div key={group.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-slate-600">#{idx + 1}</span>
                      <div>
                        <h4 className="text-white font-semibold">{group.name}</h4>
                        <p className="text-xs text-slate-400">{group.creator_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-cyan-400">{group.member_count || 0}</p>
                      <p className="text-xs text-slate-400">members</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}