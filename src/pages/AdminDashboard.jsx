import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video, Radio, FileText, Users, ShoppingBag, DollarSign,
  TrendingUp, Eye, Heart, Calendar, MessageSquare, Activity
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

  const statsCards = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "from-cyan-500 to-blue-500",
      trend: "+12.5%",
      bgColor: "bg-cyan-500/10"
    },
    {
      title: "Live Streams",
      value: liveStreams.length,
      icon: Video,
      color: "from-purple-500 to-pink-500",
      trend: "+8.2%",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: "+23.1%",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Active Groups",
      value: groups.length,
      icon: Users,
      color: "from-amber-500 to-orange-500",
      trend: "+5.4%",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "Blog Posts",
      value: blogPosts.length,
      icon: FileText,
      color: "from-indigo-500 to-blue-500",
      trend: "+15.3%",
      bgColor: "bg-indigo-500/10"
    },
    {
      title: "Products",
      value: products.length,
      icon: ShoppingBag,
      color: "from-pink-500 to-rose-500",
      trend: "+7.8%",
      bgColor: "bg-pink-500/10"
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="admin-card border-slate-700 overflow-hidden relative group hover:shadow-xl hover:shadow-cyan-500/10 transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transform translate-x-12 -translate-y-12`}></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-sm text-slate-400 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="admin-card lg:col-span-2 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="streams" stroke="#00d9ff" strokeWidth={3} name="Live Streams" />
                <Line type="monotone" dataKey="orders" stroke="#7c3aed" strokeWidth={3} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="admin-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Content Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="admin-card border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Bar dataKey="donations" fill="#10b981" name="Donations ($)" />
              <Bar dataKey="orders" fill="#8b5cf6" name="Orders ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="admin-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-red-400" />
              Recent Live Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveStreams.slice(0, 5).map((stream) => (
                <div key={stream.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{stream.title}</h4>
                    <p className="text-xs text-slate-400">{stream.host_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
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

        <Card className="admin-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{order.order_number || order.id.slice(0, 8)}</h4>
                    <p className="text-xs text-slate-400">{order.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-400">${order.total_amount?.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
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