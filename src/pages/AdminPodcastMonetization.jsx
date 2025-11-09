import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, Users, ShoppingCart, Radio, 
  Settings, Plus, Search, BarChart3, Calendar, Crown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function AdminPodcastMonetization() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);

  const [monetizationForm, setMonetizationForm] = useState({
    podcast_id: '',
    access_type: 'free',
    episode_price: 0,
    subscription_price_monthly: 0,
    subscription_price_yearly: 0,
    ad_enabled: false,
    ad_revenue_share: 0,
    preview_duration: 300
  });

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['monetizationPodcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const { data: monetizations = [] } = useQuery({
    queryKey: ['podcastMonetizations'],
    queryFn: () => base44.entities.PodcastMonetization.list('-created_date'),
    initialData: [],
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['podcastPurchases'],
    queryFn: () => base44.entities.PodcastPurchase.list('-created_date'),
    initialData: [],
  });

  const { data: revenues = [] } = useQuery({
    queryKey: ['podcastRevenues'],
    queryFn: () => base44.entities.PodcastRevenue.list('-revenue_date'),
    initialData: [],
  });

  const createMonetizationMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastMonetization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastMonetizations'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMonetizationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PodcastMonetization.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastMonetizations'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const handleSetupMonetization = (podcast) => {
    const existing = monetizations.find(m => m.podcast_id === podcast.id);
    if (existing) {
      setSelectedPodcast(existing);
      setMonetizationForm(existing);
    } else {
      setSelectedPodcast(podcast);
      setMonetizationForm({
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        access_type: 'free',
        episode_price: 0,
        subscription_price_monthly: 0,
        subscription_price_yearly: 0,
        ad_enabled: false,
        ad_revenue_share: 0,
        preview_duration: 300
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedPodcast.podcast_id) {
      updateMonetizationMutation.mutate({ id: selectedPodcast.id, data: monetizationForm });
    } else {
      createMonetizationMutation.mutate(monetizationForm);
    }
  };

  const resetForm = () => {
    setMonetizationForm({
      podcast_id: '',
      access_type: 'free',
      episode_price: 0,
      subscription_price_monthly: 0,
      subscription_price_yearly: 0,
      ad_enabled: false,
      ad_revenue_share: 0,
      preview_duration: 300
    });
    setSelectedPodcast(null);
  };

  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const episodePurchases = purchases.filter(p => p.purchase_type === 'episode').length;
  const activeSubscriptions = purchases.filter(p => 
    p.purchase_type.includes('subscription') && p.is_active
  ).length;
  const monthlyRevenue = revenues.filter(r => {
    const date = new Date(r.revenue_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + (r.amount || 0), 0);

  const revenueByType = [
    { name: 'Episode Sales', value: revenues.filter(r => r.revenue_type === 'episode_purchase').reduce((s, r) => s + r.amount, 0), color: '#22d3ee' },
    { name: 'Subscriptions', value: revenues.filter(r => r.revenue_type === 'subscription').reduce((s, r) => s + r.amount, 0), color: '#a855f7' },
    { name: 'Ad Revenue', value: revenues.filter(r => r.revenue_type === 'ad_revenue').reduce((s, r) => s + r.amount, 0), color: '#10b981' }
  ];

  const last6MonthsRevenue = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthRevenues = revenues.filter(r => {
      const revDate = new Date(r.revenue_date);
      return revDate.getMonth() === date.getMonth() && revDate.getFullYear() === date.getFullYear();
    });
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      episodes: monthRevenues.filter(r => r.revenue_type === 'episode_purchase').reduce((s, r) => s + r.amount, 0),
      subscriptions: monthRevenues.filter(r => r.revenue_type === 'subscription').reduce((s, r) => s + r.amount, 0),
      ads: monthRevenues.filter(r => r.revenue_type === 'ad_revenue').reduce((s, r) => s + r.amount, 0)
    };
  });

  const filteredPodcasts = podcasts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPodcastMonetization = (podcastId) => {
    return monetizations.find(m => m.podcast_id === podcastId);
  };

  const getAccessTypeBadge = (type) => {
    const badges = {
      free: <Badge className="bg-green-500">Free</Badge>,
      subscription: <Badge className="bg-purple-500">Subscription</Badge>,
      pay_per_episode: <Badge className="bg-cyan-500">Pay Per Episode</Badge>,
      premium: <Badge className="bg-amber-500">Premium</Badge>
    };
    return badges[type] || <Badge>Unknown</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Monetization</h2>
          <p className="text-slate-400 font-semibold">Manage pricing, subscriptions, and revenue</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{episodePurchases}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{episodePurchases}</p>
            <p className="text-slate-400 text-sm font-semibold">Episode Sales</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{activeSubscriptions}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeSubscriptions}</p>
            <p className="text-slate-400 text-sm font-semibold">Active Subscribers</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${monthlyRevenue.toFixed(2)}</p>
            <p className="text-slate-400 text-sm font-semibold">This Month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="podcasts" className="data-[state=active]:bg-cyan-500">
            <Radio className="w-4 h-4 mr-2" />
            Podcasts
          </TabsTrigger>
          <TabsTrigger value="purchases" className="data-[state=active]:bg-cyan-500">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Purchases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-[#1a1f3a] border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white font-black">Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={last6MonthsRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="episodes" stroke="#22d3ee" strokeWidth={2} name="Episode Sales" />
                    <Line type="monotone" dataKey="subscriptions" stroke="#a855f7" strokeWidth={2} name="Subscriptions" />
                    <Line type="monotone" dataKey="ads" stroke="#10b981" strokeWidth={2} name="Ad Revenue" />
                  </LineChart>
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
                      data={revenueByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByType.map((entry, index) => (
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
        </TabsContent>

        <TabsContent value="podcasts" className="mt-6">
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPodcasts.map((podcast) => {
              const monetization = getPodcastMonetization(podcast.id);
              return (
                <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                        {podcast.video_thumbnail_url || podcast.image_url ? (
                          <img src={podcast.video_thumbnail_url || podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                        ) : (
                          <Radio className="w-8 h-8 text-white m-auto mt-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm line-clamp-2 mb-1">{podcast.title}</h3>
                        <p className="text-xs text-slate-400">S{podcast.season}E{podcast.episode_number}</p>
                      </div>
                    </div>
                    
                    {monetization ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Access</span>
                          {getAccessTypeBadge(monetization.access_type)}
                        </div>
                        {monetization.episode_price > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-sm">Episode Price</span>
                            <span className="text-green-400 font-bold">${monetization.episode_price}</span>
                          </div>
                        )}
                        {monetization.subscription_price_monthly > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-sm">Monthly Sub</span>
                            <span className="text-purple-400 font-bold">${monetization.subscription_price_monthly}/mo</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-sm">Revenue</span>
                          <span className="text-cyan-400 font-bold">${monetization.total_revenue || 0}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSetupMonetization(monetization)}
                          className="w-full bg-cyan-500 hover:bg-cyan-600"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Edit Settings
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleSetupMonetization(podcast)}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Setup Monetization
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Date</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Podcast</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Buyer</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Type</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Amount</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">
                          {format(new Date(purchase.created_date), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-semibold text-sm">{purchase.podcast_title}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{purchase.buyer_name}</p>
                        <p className="text-slate-400 text-xs">{purchase.buyer_email}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={
                          purchase.purchase_type === 'episode' ? 'bg-cyan-500' :
                          purchase.purchase_type.includes('monthly') ? 'bg-purple-500' : 'bg-amber-500'
                        }>
                          {purchase.purchase_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-green-400 font-bold">${purchase.amount}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={
                          purchase.payment_status === 'completed' ? 'bg-green-500' :
                          purchase.payment_status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                        }>
                          {purchase.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Monetization Setup Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">
              Monetization Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white mb-2 block">Access Type</Label>
              <select
                value={monetizationForm.access_type}
                onChange={(e) => setMonetizationForm({...monetizationForm, access_type: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="free">Free - No payment required</option>
                <option value="pay_per_episode">Pay Per Episode</option>
                <option value="subscription">Subscription Only</option>
                <option value="premium">Premium (Subscription or Purchase)</option>
              </select>
            </div>

            {(monetizationForm.access_type === 'pay_per_episode' || monetizationForm.access_type === 'premium') && (
              <div>
                <Label className="text-white mb-2 block">Episode Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={monetizationForm.episode_price}
                  onChange={(e) => setMonetizationForm({...monetizationForm, episode_price: parseFloat(e.target.value)})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
            )}

            {(monetizationForm.access_type === 'subscription' || monetizationForm.access_type === 'premium') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Monthly Subscription ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monetizationForm.subscription_price_monthly}
                    onChange={(e) => setMonetizationForm({...monetizationForm, subscription_price_monthly: parseFloat(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Yearly Subscription ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monetizationForm.subscription_price_yearly}
                    onChange={(e) => setMonetizationForm({...monetizationForm, subscription_price_yearly: parseFloat(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-white mb-2 block">Preview Duration (seconds)</Label>
              <Input
                type="number"
                value={monetizationForm.preview_duration}
                onChange={(e) => setMonetizationForm({...monetizationForm, preview_duration: parseInt(e.target.value)})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">How long users can preview before payment required</p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={monetizationForm.ad_enabled}
                  onChange={(e) => setMonetizationForm({...monetizationForm, ad_enabled: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Enable Ads</Label>
              </div>
              {monetizationForm.ad_enabled && (
                <div>
                  <Label className="text-white mb-2 block">Ad Revenue Share (%)</Label>
                  <Input
                    type="number"
                    value={monetizationForm.ad_revenue_share}
                    onChange={(e) => setMonetizationForm({...monetizationForm, ad_revenue_share: parseFloat(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-cyan-500 hover:bg-cyan-600">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}