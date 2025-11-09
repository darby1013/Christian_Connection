import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Crown, Search, TrendingUp, Users, DollarSign, Calendar,
  Eye, Filter, Download, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminSubscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
    initialData: [],
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
    initialData: [],
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setDetailDialogOpen(false);
    },
  });

  const handleStatusChange = (subscriptionId, newStatus) => {
    if (confirm(`Change subscription status to ${newStatus}?`)) {
      updateSubscriptionMutation.mutate({
        id: subscriptionId,
        data: { status: newStatus }
      });
    }
  };

  const viewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setDetailDialogOpen(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const monthlyRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.price || 0), 0);
  const cancelledToday = subscriptions.filter(s => {
    if (!s.cancelled_at) return false;
    const today = new Date().toDateString();
    return new Date(s.cancelled_at).toDateString() === today;
  }).length;

  const getTierColor = (tier) => {
    const colors = {
      basic: 'bg-blue-500',
      premium: 'bg-purple-500',
      vip: 'bg-amber-500'
    };
    return colors[tier] || 'bg-slate-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      cancelled: 'bg-red-500',
      expired: 'bg-slate-500',
      pending: 'bg-amber-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: CheckCircle,
      cancelled: XCircle,
      expired: AlertCircle,
      pending: AlertCircle
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Subscription Management</h2>
          <p className="text-slate-400 font-semibold">Manage member subscriptions and plans</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-8 h-8 text-amber-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{subscriptions.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">{activeSubscriptions}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{activeSubscriptions}</p>
            <p className="text-slate-400 text-sm font-semibold">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${monthlyRevenue.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Monthly Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{cancelledToday}</p>
            <p className="text-slate-400 text-sm font-semibold">Cancelled Today</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md bg-[#1a1f3a] border border-slate-700 text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-cyan-500">
            Active ({activeSubscriptions})
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-cyan-500">
            Plans ({plans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Member</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Plan</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Price</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Start Date</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Next Billing</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                    <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-semibold">{subscription.user_name}</p>
                          <p className="text-slate-400 text-sm">{subscription.user_email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-semibold">{subscription.plan_name}</p>
                          <Badge className={getTierColor(subscription.plan_type)}>
                            {subscription.plan_type}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-green-400 font-bold">${subscription.price}/mo</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">
                          {format(new Date(subscription.start_date), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="p-4">
                        {subscription.next_billing_date ? (
                          <p className="text-slate-300 text-sm">
                            {format(new Date(subscription.next_billing_date), 'MMM d, yyyy')}
                          </p>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(subscription.status)}>
                          {getStatusIcon(subscription.status)}
                          <span className="ml-1 capitalize">{subscription.status}</span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => viewDetails(subscription)}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {subscription.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(subscription.id, 'cancelled')}
                              className="border-red-500/30 text-red-400"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscriptions.filter(s => s.status === 'active').map((subscription) => (
              <Card key={subscription.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getTierColor(subscription.plan_type)}>
                      <Crown className="w-3 h-3 mr-1" />
                      {subscription.plan_type}
                    </Badge>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{subscription.user_name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{subscription.user_email}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan</span>
                      <span className="text-white font-semibold">{subscription.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="text-green-400 font-bold">${subscription.price}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Next Billing</span>
                      <span className="text-white">
                        {subscription.next_billing_date 
                          ? format(new Date(subscription.next_billing_date), 'MMM d')
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => viewDetails(subscription)}
                    className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1629] border-2 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getTierColor(plan.tier)}>
                      <Crown className="w-3 h-3 mr-1" />
                      {plan.tier}
                    </Badge>
                    <Badge className={plan.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="text-white font-black text-2xl mb-2">{plan.name}</h3>
                  <p className="text-cyan-400 font-black text-3xl mb-4">
                    ${plan.price}
                    <span className="text-slate-400 text-base font-normal">/mo</span>
                  </p>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  <div className="space-y-2">
                    {plan.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Member</p>
                <p className="text-white font-bold text-lg">{selectedSubscription.user_name}</p>
                <p className="text-slate-400">{selectedSubscription.user_email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Plan</p>
                  <p className="text-white font-bold">{selectedSubscription.plan_name}</p>
                  <Badge className={getTierColor(selectedSubscription.plan_type)}>
                    {selectedSubscription.plan_type}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <Badge className={getStatusColor(selectedSubscription.status)}>
                    {getStatusIcon(selectedSubscription.status)}
                    <span className="ml-1 capitalize">{selectedSubscription.status}</span>
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Monthly Price</p>
                    <p className="text-green-400 font-black text-2xl">${selectedSubscription.price}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Billing Period</p>
                    <p className="text-white font-semibold capitalize">{selectedSubscription.billing_cycle || 'monthly'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Start Date</p>
                  <p className="text-white font-semibold">
                    {format(new Date(selectedSubscription.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
                {selectedSubscription.next_billing_date && (
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Next Billing</p>
                    <p className="text-white font-semibold">
                      {format(new Date(selectedSubscription.next_billing_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {selectedSubscription.cancellation_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-bold mb-1">Cancellation Reason</p>
                  <p className="text-slate-300 text-sm">{selectedSubscription.cancellation_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}