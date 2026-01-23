import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Video, Radio, FileText, Users, ShoppingBag, DollarSign,
  TrendingUp, Eye, Heart, Calendar, MessageSquare, Activity,
  Shield, Settings, Database, BarChart3, Podcast, Crown,
  Gift, Package, Tag, AlertCircle, LayoutDashboard, RefreshCw, Download
} from "lucide-react";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
import EnterpriseStats from '../components/admin/EnterpriseStats';
import EnterpriseCard from '../components/admin/EnterpriseCard';
import EnterpriseChart from '../components/admin/EnterpriseChart';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';

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

  const stats = [
    {
      title: 'Total Users',
      value: users.length.toLocaleString(),
      icon: Users,
      trend: 'up',
      trendValue: '+12.5%',
      subtitle: 'vs last month',
      color: 'cyan'
    },
    {
      title: 'Active Streams',
      value: liveStreams.filter(s => s.status === 'live').length,
      icon: Radio,
      trend: liveStreams.filter(s => s.status === 'live').length > 0 ? 'up' : 'neutral',
      trendValue: liveStreams.filter(s => s.status === 'live').length > 0 ? 'LIVE' : 'Offline',
      subtitle: 'Right now',
      color: 'red'
    },
    {
      title: 'Total Revenue',
      value: `$${(orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) + donations.reduce((sum, d) => sum + (d.amount || 0), 0)).toLocaleString()}`,
      icon: DollarSign,
      trend: 'up',
      trendValue: '+24.3%',
      subtitle: 'This month',
      color: 'green'
    },
    {
      title: 'Total Content',
      value: (videos.length + podcasts.length + blogPosts.length).toLocaleString(),
      icon: FileText,
      trend: 'up',
      trendValue: '+8.7%',
      subtitle: 'Videos, podcasts, blogs',
      color: 'purple'
    },
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

  const activityData = [
    { name: 'Mon', streams: 12, orders: 45 },
    { name: 'Tue', streams: 19, orders: 52 },
    { name: 'Wed', streams: 15, orders: 48 },
    { name: 'Thu', streams: 22, orders: 61 },
    { name: 'Fri', streams: 28, orders: 73 },
    { name: 'Sat', streams: 35, orders: 89 },
    { name: 'Sun', streams: 31, orders: 67 },
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Dashboard"
        subtitle="Enterprise Analytics & Insights"
        icon={LayoutDashboard}
        badge="LIVE"
        actions={[
          { label: 'Refresh', icon: RefreshCw, onClick: () => window.location.reload() },
          { label: 'Export Report', icon: Download, onClick: () => alert('Export feature') }
        ]}
      />

      <EnterpriseStats stats={stats} />

      {/* Main Charts area */}
      <div className="grid lg:grid-cols-2 gap-6">
        <EnterpriseChart
          title="Platform Activity"
          subtitle="Last 7 days"
          icon={Activity}
          type="area"
          data={activityData}
          dataKey="streams"
          xKey="name"
          colors={['primary']}
        />

        <EnterpriseChart
          title="Revenue Trend"
          subtitle="Weekly performance"
          icon={TrendingUp}
          type="bar"
          data={activityData}
          dataKey="orders"
          xKey="name"
          colors={['success']}
        />
      </div>

      {/* Real-time Widgets */}
      <div className="grid lg:grid-cols-3 gap-4">
        <RecentActivityWidget />
        <SystemHealthWidget />
        <ActiveConnectionsWidget />
        <CriticalAlertsWidget />
        <PerformanceMetricsWidget />
        <QuickStatsWidget />
      </div>

      {/* Quick Links - Wrapped in EnterpriseCard */}
      <EnterpriseCard
        title="Quick Links"
        icon={Settings}
        subtitle="Access frequently used admin sections"
      >
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
      </EnterpriseCard>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Feed Widget - Wrapped in EnterpriseCard */}
        <EnterpriseCard
          title="Recent Activity"
          icon={MessageSquare}
          subtitle="Latest user and system events"
          className="lg:col-span-1"
        >
          <ActivityFeedWidget limit={8} />
        </EnterpriseCard>

        {/* Content Distribution (Pie Chart) - Wrapped in EnterpriseCard */}
        <EnterpriseCard
          title="Content Distribution"
          icon={FileText}
          subtitle="Breakdown of content types"
          className="lg:col-span-2"
        >
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
        </EnterpriseCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Live Streams - Wrapped in EnterpriseCard */}
        <EnterpriseCard
          title="Recent Live Streams"
          icon={Video}
          subtitle="Latest live broadcasts"
        >
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
        </EnterpriseCard>

        {/* Recent Orders - Wrapped in EnterpriseCard */}
        <EnterpriseCard
          title="Recent Orders"
          icon={ShoppingBag}
          subtitle="Latest customer purchases"
        >
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
        </EnterpriseCard>
      </div>
    </div>
  );
}