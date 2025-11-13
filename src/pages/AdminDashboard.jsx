import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Video, Radio, FileText, Users, ShoppingBag, DollarSign,
  TrendingUp, Eye, Heart, Calendar, MessageSquare, Activity,
  Shield, Settings, Database, BarChart3, Podcast, Crown,
  Gift, Package, Tag, AlertCircle
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ActivityFeedWidget from "../components/activity/ActivityFeedWidget";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  RecentActivityWidget,
  CriticalAlertsWidget,
  SystemHealthWidget,
  ActiveConnectionsWidget,
  PerformanceMetricsWidget,
  QuickStatsWidget
} from "../components/dashboard/RealtimeWidgets";

export default function AdminDashboard() {
  const { data: liveStreams = [] } = useQuery({
    queryKey: ['adminLiveStreams'],
    queryFn: () => base44.entities.LiveStream.list('-created_date', 100),
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['adminVideos'],
    queryFn: () => base44.entities.Video.list('-created_date', 100),
    initialData: [],
  });

  const { data: podcasts = [] } = useQuery({
    queryKey: ['adminPodcasts'],
    queryFn: () => base44.entities.Podcast.list('-created_date', 100),
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['adminBlogPosts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 100),
    initialData: [],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['adminGroups'],
    queryFn: () => base44.entities.Group.list('-created_date', 100),
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => base44.entities.Event.list('-created_date', 100),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
    initialData: [],
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['adminDonations'],
    queryFn: () => base44.entities.Donation.list('-created_date', 100),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    initialData: [],
  });

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) +
                       donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10)).length;

  const statsCards = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      trend: "+12.5%",
      link: createPageUrl("AdminUsers"),
    },
    {
      title: "Live Streams",
      value: liveStreams.length,
      icon: Video,
      color: "from-purple-500 to-pink-500",
      trend: "+8.2%",
      link: createPageUrl("AdminLiveStreams"),
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: "+23.1%",
      link: createPageUrl("AdminStoreAnalytics"),
    },
    {
      title: "Active Groups",
      value: groups.length,
      icon: Users,
      color: "from-orange-500 to-amber-500",
      trend: "+5.4%",
      link: createPageUrl("AdminGroups"),
    },
    {
      title: "Blog Posts",
      value: blogPosts.length,
      icon: FileText,
      color: "from-indigo-500 to-blue-500",
      trend: "+15.3%",
      link: createPageUrl("AdminBlog"),
    },
    {
      title: "Products",
      value: products.length,
      icon: ShoppingBag,
      color: "from-pink-500 to-rose-500",
      trend: "+7.8%",
      link: createPageUrl("AdminProducts"),
    }
  ];

  const quickLinks = [
    { title: "Content Management", icon: FileText, color: "bg-blue-500", links: [
      { name: "Podcasts", url: createPageUrl("AdminPodcasts") },
      { name: "Videos", url: createPageUrl("AdminVideos") },
      { name: "Blog Posts", url: createPageUrl("AdminBlog") },
      { name: "Courses", url: createPageUrl("AdminCourses") },
    ]},
    { title: "E-Commerce", icon: ShoppingBag, color: "bg-green-500", links: [
      { name: "Products", url: createPageUrl("AdminProducts") },
      { name: "Orders", url: createPageUrl("AdminOrders") },
      { name: "Inventory", url: createPageUrl("AdminInventoryManagement") },
      { name: "Coupons", url: createPageUrl("AdminCouponManager") },
    ]},
    { title: "Community", icon: Users, color: "bg-purple-500", links: [
      { name: "Groups", url: createPageUrl("AdminGroups") },
      { name: "Forums", url: createPageUrl("AdminForum") },
      { name: "Events", url: createPageUrl("AdminEvents") },
      { name: "Users", url: createPageUrl("AdminUsers") },
    ]},
    { title: "System", icon: Settings, color: "bg-amber-500", links: [
      { name: "Site Settings", url: createPageUrl("AdminSiteSettings") },
      { name: "Roles & Permissions", url: createPageUrl("AdminRoles") },
      { name: "Database", url: createPageUrl("AdminDatabaseCenter") },
      { name: "Analytics", url: createPageUrl("AdminAnalytics") },
    ]},
  ];

  const contentStats = [
    { name: 'Videos', value: videos.length, color: '#6366f1' },
    { name: 'Podcasts', value: podcasts.length, color: '#8b5cf6' },
    { name: 'Blog Posts', value: blogPosts.length, color: '#06b6d4' },
    { name: 'Events', value: events.length, color: '#f59e0b' }
  ];

  const monthlyData = [
    { month: 'Jan', streams: 24, donations: 3200, orders: 18 },
    { month: 'Feb', streams: 28, donations: 4100, orders: 22 },
    { month: 'Mar', streams: 32, donations: 3800, orders: 25 },
    { month: 'Apr', streams: 35, donations: 5200, orders: 30 },
    { month: 'May', streams: 38, donations: 4900, orders: 28 },
    { month: 'Jun', streams: 42, donations: 6100, orders: 35 }
  ];

  return (
    <div className="space-y-6">
      {/* System Alerts */}
      {(pendingOrders > 0 || lowStockProducts > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {pendingOrders > 0 && (
            <Card className="bg-amber-900/20 border-amber-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-amber-300 font-bold">{pendingOrders} Pending Orders</p>
                    <p className="text-amber-200 text-sm">Require attention</p>
                  </div>
                </div>
                <Link to={createPageUrl("AdminOrders")}>
                  <Button className="bg-amber-500 hover:bg-amber-600">View Orders</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {lowStockProducts > 0 && (
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-red-300 font-bold">{lowStockProducts} Low Stock Products</p>
                    <p className="text-red-200 text-sm">Need restocking</p>
                  </div>
                </div>
                <Link to={createPageUrl("AdminInventoryManagement")}>
                  <Button className="bg-red-500 hover:bg-red-600">View Inventory</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Real-time Widgets */}
      <div className="grid lg:grid-cols-3 gap-4">
        <RecentActivityWidget />
        <SystemHealthWidget />
        <ActiveConnectionsWidget />
        <CriticalAlertsWidget />
        <PerformanceMetricsWidget />
        <QuickStatsWidget />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card className="bg-[#1a1f3a] border-0 overflow-hidden relative group hover:shadow-2xl hover:shadow-cyan-500/20 transition-all cursor-pointer">
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-xs text-slate-400 mb-1 font-medium">{stat.title}</h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid lg:grid-cols-4 gap-4">
        {quickLinks.map((section, idx) => (
          <Card key={idx} className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700 pb-3">
              <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${section.color} flex items-center justify-center`}>
                  <section.icon className="w-4 h-4 text-white" />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1">
                {section.links.map((link, linkIdx) => (
                  <Link key={linkIdx} to={link.url}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 h-9 text-sm"
                    >
                      {link.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-[#1a1f3a] border-0 lg:col-span-2">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base font-bold">
              <Activity className="w-5 h-5 text-cyan-400" />
              Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: '600' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="streams" stroke="#22d3ee" strokeWidth={2} name="Live Streams" dot={{ fill: '#22d3ee', r: 4 }} />
                <Line type="monotone" dataKey="orders" stroke="#a855f7" strokeWidth={2} name="Orders" dot={{ fill: '#a855f7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed Widget */}
        <ActivityFeedWidget limit={8} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-0">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base font-bold">
              <FileText className="w-5 h-5 text-purple-400" />
              Content Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentStats.map((entry, index) => (
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

        <Card className="bg-[#1a1f3a] border-0">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base font-bold">
              <DollarSign className="w-5 h-5 text-green-400" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: '600' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="donations" fill="#10b981" name="Donations ($)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="orders" fill="#a855f7" name="Orders ($)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1f3a] border-0">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base font-bold">
              <Video className="w-5 h-5 text-red-400" />
              Recent Live Streams
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {liveStreams.slice(0, 5).map((stream) => (
                <div key={stream.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{stream.title}</h4>
                    <p className="text-xs text-slate-400">{stream.host_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                      {stream.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Eye className="w-3 h-3" />
                      {stream.viewer_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base font-bold">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{order.order_number || order.id.slice(0, 8)}</h4>
                    <p className="text-xs text-slate-400">{order.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-400">${order.total_amount?.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                      order.status === 'shipped' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}