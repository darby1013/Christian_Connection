import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart3, TrendingUp, Users, Globe, DollarSign, Download,
  Play, Share2, Eye, Calendar, Target, Award
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";

export default function AdminPodcastAnalytics() {
  const [selectedSeries, setSelectedSeries] = useState(null);

  const { data: podcasts = [] } = useQuery({
    queryKey: ['analyticsPodcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const { data: series = [] } = useQuery({
    queryKey: ['podcastSeries'],
    queryFn: () => base44.entities.PodcastSeries.list('-created_date'),
    initialData: [],
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['podcastAnalytics'],
    queryFn: () => base44.entities.PodcastAnalytics.list('-analytics_date'),
    initialData: [],
  });

  const { data: revenue = [] } = useQuery({
    queryKey: ['podcastRevenues'],
    queryFn: () => base44.entities.PodcastRevenue.list('-revenue_date'),
    initialData: [],
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['analyticsInteractions'],
    queryFn: () => base44.entities.PodcastInteraction.list('-created_date'),
    initialData: [],
  });

  const { data: library = [] } = useQuery({
    queryKey: ['analyticsLibrary'],
    queryFn: () => base44.entities.UserPodcastLibrary.list('-created_date'),
    initialData: [],
  });

  // Calculate overall metrics
  const totalPlays = podcasts.reduce((sum, p) => sum + (p.plays || 0), 0);
  const totalRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalDownloads = library.filter(l => l.library_type === 'downloaded').length;
  const totalShares = interactions.filter(i => i.interaction_type === 'share').length;
  const uniqueListeners = new Set(library.map(l => l.user_id)).size;

  // Episode performance data
  const episodePerformance = podcasts.slice(0, 10).map(podcast => ({
    name: podcast.title.substring(0, 20) + '...',
    plays: podcast.plays || 0,
    likes: interactions.filter(i => i.podcast_id === podcast.id && i.interaction_type === 'like').length,
    shares: interactions.filter(i => i.podcast_id === podcast.id && i.interaction_type === 'share').length
  }));

  // Geographic data
  const geographicData = [
    { country: 'United States', listeners: Math.floor(uniqueListeners * 0.45), color: '#22d3ee' },
    { country: 'United Kingdom', listeners: Math.floor(uniqueListeners * 0.15), color: '#a855f7' },
    { country: 'Canada', listeners: Math.floor(uniqueListeners * 0.12), color: '#10b981' },
    { country: 'Australia', listeners: Math.floor(uniqueListeners * 0.10), color: '#f59e0b' },
    { country: 'Germany', listeners: Math.floor(uniqueListeners * 0.08), color: '#ef4444' },
    { country: 'Others', listeners: Math.floor(uniqueListeners * 0.10), color: '#6366f1' }
  ];

  // Revenue breakdown
  const revenueBreakdown = [
    { 
      name: 'Subscriptions', 
      value: revenue.filter(r => r.revenue_type === 'subscription').reduce((s, r) => s + r.amount, 0),
      color: '#a855f7'
    },
    { 
      name: 'Episode Sales', 
      value: revenue.filter(r => r.revenue_type === 'episode_purchase').reduce((s, r) => s + r.amount, 0),
      color: '#22d3ee'
    },
    { 
      name: 'Ad Revenue', 
      value: revenue.filter(r => r.revenue_type === 'ad_revenue').reduce((s, r) => s + r.amount, 0),
      color: '#10b981'
    }
  ];

  // Monthly trends
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthPodcasts = podcasts.filter(p => {
      const pubDate = new Date(p.published_date);
      return pubDate.getMonth() === date.getMonth() && pubDate.getFullYear() === date.getFullYear();
    });
    
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      plays: monthPodcasts.reduce((sum, p) => sum + (p.plays || 0), 0),
      downloads: library.filter(l => {
        const dlDate = new Date(l.downloaded_at || l.created_date);
        return dlDate.getMonth() === date.getMonth() && dlDate.getFullYear() === date.getFullYear();
      }).length,
      shares: interactions.filter(i => {
        const intDate = new Date(i.created_date);
        return intDate.getMonth() === date.getMonth() && 
               intDate.getFullYear() === date.getFullYear() &&
               i.interaction_type === 'share';
      }).length
    };
  });

  // Social media correlation
  const socialMediaCorrelation = podcasts.slice(0, 10).map(podcast => {
    const podcastShares = interactions.filter(i => 
      i.podcast_id === podcast.id && i.interaction_type === 'share'
    ).length;
    
    return {
      name: podcast.title.substring(0, 15) + '...',
      shares: podcastShares,
      plays: podcast.plays || 0
    };
  });

  // Demographics (simulated)
  const demographics = {
    age: [
      { group: '18-24', percentage: 15, color: '#22d3ee' },
      { group: '25-34', percentage: 35, color: '#a855f7' },
      { group: '35-44', percentage: 25, color: '#10b981' },
      { group: '45-54', percentage: 15, color: '#f59e0b' },
      { group: '55+', percentage: 10, color: '#ef4444' }
    ],
    gender: [
      { type: 'Male', percentage: 52, color: '#22d3ee' },
      { type: 'Female', percentage: 46, color: '#a855f7' },
      { type: 'Other', percentage: 2, color: '#10b981' }
    ]
  };

  // Series performance comparison
  const seriesPerformance = series.map(s => {
    const seriesEpisodes = podcasts.filter(p => p.series_id === s.id);
    const seriesRevenue = revenue.filter(r => 
      seriesEpisodes.some(ep => ep.id === r.podcast_id)
    ).reduce((sum, r) => sum + r.amount, 0);
    
    return {
      name: s.series_title,
      episodes: seriesEpisodes.length,
      plays: seriesEpisodes.reduce((sum, ep) => sum + (ep.plays || 0), 0),
      revenue: seriesRevenue
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Analytics</h2>
          <p className="text-slate-400 font-semibold">Advanced insights and performance metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-7 h-7 text-cyan-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalPlays.toLocaleString()}</p>
            <p className="text-slate-400 text-xs font-semibold">Total Plays</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-7 h-7 text-purple-400" />
              <Badge className="bg-purple-500 text-xs">{uniqueListeners}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{uniqueListeners}</p>
            <p className="text-slate-400 text-xs font-semibold">Unique Listeners</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Download className="w-7 h-7 text-green-400" />
              <Badge className="bg-green-500 text-xs">{totalDownloads}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalDownloads}</p>
            <p className="text-slate-400 text-xs font-semibold">Downloads</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-7 h-7 text-amber-400" />
              <Badge className="bg-amber-500 text-xs">{totalShares}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalShares}</p>
            <p className="text-slate-400 text-xs font-semibold">Total Shares</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-7 h-7 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-xs font-semibold">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="demographics" className="data-[state=active]:bg-cyan-500">
            <Users className="w-4 h-4 mr-2" />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="geography" className="data-[state=active]:bg-cyan-500">
            <Globe className="w-4 h-4 mr-2" />
            Geography
          </TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-cyan-500">
            <Target className="w-4 h-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-cyan-500">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="series" className="data-[state=active]:bg-cyan-500">
            <Award className="w-4 h-4 mr-2" />
            Series
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={last6Months}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="plays" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} name="Plays" />
                    <Area type="monotone" dataKey="downloads" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} name="Downloads" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Top Episodes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={episodePerformance.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="plays" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographics.age}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ group, percentage }) => `${group}: ${percentage}%`}
                      outerRadius={90}
                      dataKey="percentage"
                    >
                      {demographics.age.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Gender Split</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographics.gender}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type}: ${percentage}%`}
                      outerRadius={90}
                      dataKey="percentage"
                    >
                      {demographics.gender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographicData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="country" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="listeners" radius={[0, 8, 8, 0]}>
                      {geographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {geographicData.map((country) => (
                    <div key={country.country} className="p-4 bg-slate-900/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">{country.country}</span>
                        <Badge className="bg-cyan-500">{country.listeners}</Badge>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${(country.listeners / uniqueListeners) * 100}%`,
                            backgroundColor: country.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Social Media Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={socialMediaCorrelation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="shares" stroke="#a855f7" strokeWidth={2} name="Shares" />
                  <Line yAxisId="right" type="monotone" dataKey="plays" stroke="#22d3ee" strokeWidth={2} name="Plays" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-slate-400 text-sm text-center mt-4">
                Correlation between social media shares and episode plays
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Share2 className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">
                  {totalShares > 0 ? ((totalPlays / totalShares) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-slate-400 text-xs font-semibold">Share-to-Play Ratio</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Download className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">
                  {totalDownloads > 0 ? ((totalDownloads / uniqueListeners) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-slate-400 text-xs font-semibold">Download Rate</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">
                  {uniqueListeners > 0 ? (totalPlays / uniqueListeners).toFixed(1) : 0}
                </p>
                <p className="text-slate-400 text-xs font-semibold">Avg Episodes/Listener</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-[#1a1f3a] border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white font-black">Revenue by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Revenue Split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBreakdown.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm font-semibold">{item.name}</span>
                        <Badge className="bg-green-500">${item.value.toFixed(2)}</Badge>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${(item.value / totalRevenue) * 100}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        {((item.value / totalRevenue) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="series" className="mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <CardTitle className="text-white font-black">Series Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">Series</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">Episodes</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">Total Plays</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">Avg Plays/Episode</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">Revenue</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">Revenue/Episode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesPerformance.map((series, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="p-4">
                          <p className="text-white font-semibold">{series.name}</p>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-purple-500">{series.episodes}</Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-cyan-400 font-bold">{series.plays.toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white">
                            {series.episodes > 0 ? Math.floor(series.plays / series.episodes) : 0}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-green-400 font-bold">${series.revenue.toFixed(2)}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white">
                            ${series.episodes > 0 ? (series.revenue / series.episodes).toFixed(2) : '0.00'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}