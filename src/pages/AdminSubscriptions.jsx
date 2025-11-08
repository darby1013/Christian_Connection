import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown, Plus, Pencil, Trash2, Users, DollarSign, TrendingUp, Star } from "lucide-react";

export default function AdminSubscriptions() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const [planForm, setPlanForm] = useState({
    name: "",
    tier: "basic",
    price: 0,
    billing_period: "monthly",
    description: "",
    features: [],
    max_streams: -1,
    exclusive_content: false,
    early_access: false,
    ad_free: false,
    custom_badge: "",
    is_active: true,
    sort_order: 0
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['adminSubscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list('sort_order'),
    initialData: [],
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
    initialData: [],
  });

  const createPlanMutation = useMutation({
    mutationFn: (data) => base44.entities.SubscriptionPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SubscriptionPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
      setEditingPlan(null);
      resetForm();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => base44.entities.SubscriptionPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
    },
  });

  const resetForm = () => {
    setPlanForm({
      name: "",
      tier: "basic",
      price: 0,
      billing_period: "monthly",
      description: "",
      features: [],
      max_streams: -1,
      exclusive_content: false,
      early_access: false,
      ad_free: false,
      custom_badge: "",
      is_active: true,
      sort_order: 0
    });
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPlanForm(plan);
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: planForm });
    } else {
      createPlanMutation.mutate(planForm);
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.price || 0), 0);

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Total Plans</p>
                <p className="text-3xl font-black text-white mt-1">{plans.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Active Subscribers</p>
                <p className="text-3xl font-black text-white mt-1">{activeSubscriptions.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Monthly Revenue</p>
                <p className="text-3xl font-black text-white mt-1">${totalRevenue.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Avg. Plan Price</p>
                <p className="text-3xl font-black text-white mt-1">
                  ${plans.length > 0 ? (plans.reduce((sum, p) => sum + p.price, 0) / plans.length).toFixed(0) : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <Card className="bg-[#1a1f3a] border-0">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-cyan-400" />
            Subscription Plans
          </CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold" onClick={() => { resetForm(); setEditingPlan(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold">Plan Name</Label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      placeholder="e.g., Premium Membership"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Tier</Label>
                    <Select value={planForm.tier} onValueChange={(value) => setPlanForm({...planForm, tier: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="basic" className="text-white">Basic</SelectItem>
                        <SelectItem value="premium" className="text-white">Premium</SelectItem>
                        <SelectItem value="vip" className="text-white">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold">Price ($)</Label>
                    <Input
                      type="number"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({...planForm, price: parseFloat(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold">Billing Period</Label>
                    <Select value={planForm.billing_period} onValueChange={(value) => setPlanForm({...planForm, billing_period: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                        <SelectItem value="quarterly" className="text-white">Quarterly</SelectItem>
                        <SelectItem value="yearly" className="text-white">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold">Description</Label>
                  <Textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2 h-20"
                    placeholder="Plan description..."
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Features (comma separated)</Label>
                  <Textarea
                    value={planForm.features?.join(', ') || ''}
                    onChange={(e) => setPlanForm({...planForm, features: e.target.value.split(',').map(f => f.trim())})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2 h-24"
                    placeholder="e.g., Exclusive content, Ad-free, Early access"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <Label className="text-white font-semibold">Exclusive Content</Label>
                    <Switch
                      checked={planForm.exclusive_content}
                      onCheckedChange={(checked) => setPlanForm({...planForm, exclusive_content: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <Label className="text-white font-semibold">Early Access</Label>
                    <Switch
                      checked={planForm.early_access}
                      onCheckedChange={(checked) => setPlanForm({...planForm, early_access: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <Label className="text-white font-semibold">Ad-Free</Label>
                    <Switch
                      checked={planForm.ad_free}
                      onCheckedChange={(checked) => setPlanForm({...planForm, ad_free: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <Label className="text-white font-semibold">Active</Label>
                    <Switch
                      checked={planForm.is_active}
                      onCheckedChange={(checked) => setPlanForm({...planForm, is_active: checked})}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                      <Badge className={
                        plan.tier === 'basic' ? 'bg-blue-500' :
                        plan.tier === 'premium' ? 'bg-purple-500' :
                        'bg-amber-500'
                      }>
                        {plan.tier}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-cyan-400">${plan.price}</p>
                      <p className="text-xs text-slate-400">/{plan.billing_period}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mb-4">{plan.description}</p>

                  <div className="space-y-1 mb-4">
                    {plan.features?.slice(0, 3).map((feature, idx) => (
                      <p key={idx} className="text-xs text-slate-300">✓ {feature}</p>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlanMutation.mutate(plan.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card className="bg-[#1a1f3a] border-0">
        <CardHeader className="border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-black text-xl flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Active Subscriptions
            </CardTitle>
            <Input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold">User</TableHead>
                <TableHead className="text-slate-400 font-bold">Plan</TableHead>
                <TableHead className="text-slate-400 font-bold">Price</TableHead>
                <TableHead className="text-slate-400 font-bold">Status</TableHead>
                <TableHead className="text-slate-400 font-bold">Start Date</TableHead>
                <TableHead className="text-slate-400 font-bold">End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow key={sub.id} className="border-white/5">
                  <TableCell>
                    <div>
                      <p className="text-white font-semibold">{sub.user_name}</p>
                      <p className="text-xs text-slate-400">{sub.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-purple-500">{sub.plan_name}</Badge>
                  </TableCell>
                  <TableCell className="text-white font-bold">${sub.price}</TableCell>
                  <TableCell>
                    <Badge className={
                      sub.status === 'active' ? 'bg-green-500' :
                      sub.status === 'cancelled' ? 'bg-red-500' :
                      sub.status === 'expired' ? 'bg-gray-500' :
                      'bg-yellow-500'
                    }>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(sub.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(sub.end_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}