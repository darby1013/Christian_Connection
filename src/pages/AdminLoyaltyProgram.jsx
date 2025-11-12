import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Award, Crown, Star, TrendingUp, Users, Gift, Zap,
  Plus, Edit, Trash2, Percent, Truck, Eye, ShoppingBag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminLoyaltyProgram() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({
    program_name: 'Glory Rewards',
    tier_name: 'bronze',
    points_required: 0,
    discount_percentage: 0,
    free_shipping: false,
    early_access: false,
    birthday_bonus: 0,
    points_multiplier: 1,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: tiers = [] } = useQuery({
    queryKey: ['loyaltyTiers'],
    queryFn: () => base44.entities.LoyaltyProgram.list('points_required'),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customerLoyalty'],
    queryFn: () => base44.entities.CustomerLoyalty.list('-total_points'),
    initialData: [],
  });

  const createTierMutation = useMutation({
    mutationFn: (data) => base44.entities.LoyaltyProgram.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyTiers'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LoyaltyProgram.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyTiers'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id) => base44.entities.LoyaltyProgram.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyTiers'] });
    },
  });

  const handleSubmit = () => {
    if (editingTier) {
      updateTierMutation.mutate({ id: editingTier.id, data: tierForm });
    } else {
      createTierMutation.mutate(tierForm);
    }
  };

  const handleEdit = (tier) => {
    setEditingTier(tier);
    setTierForm(tier);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTierForm({
      program_name: 'Glory Rewards',
      tier_name: 'bronze',
      points_required: 0,
      discount_percentage: 0,
      free_shipping: false,
      early_access: false,
      birthday_bonus: 0,
      points_multiplier: 1,
      is_active: true
    });
    setEditingTier(null);
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'bronze': return <Award className="w-8 h-8 text-amber-700" />;
      case 'silver': return <Award className="w-8 h-8 text-slate-400" />;
      case 'gold': return <Crown className="w-8 h-8 text-yellow-400" />;
      case 'platinum': return <Crown className="w-8 h-8 text-cyan-400" />;
      case 'diamond': return <Star className="w-8 h-8 text-purple-400" />;
      default: return <Award className="w-8 h-8" />;
    }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'bronze': return 'from-amber-700 to-orange-700';
      case 'silver': return 'from-slate-400 to-slate-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'platinum': return 'from-cyan-400 to-blue-500';
      case 'diamond': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const totalMembers = customers.length;
  const totalPointsDistributed = customers.reduce((sum, c) => sum + (c.lifetime_points || 0), 0);
  const avgPointsPerCustomer = totalMembers > 0 ? Math.floor(totalPointsDistributed / totalMembers) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Loyalty Rewards Program</h2>
          <p className="text-slate-400 font-semibold">Reward customers and boost retention</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{totalMembers}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalMembers}</p>
            <p className="text-slate-400 text-sm font-semibold">Program Members</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalPointsDistributed.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Points Distributed</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{avgPointsPerCustomer}</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Points/Customer</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{tiers.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{tiers.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Reward Tiers</p>
          </CardContent>
        </Card>
      </div>

      {/* Reward Tiers */}
      <div className="grid gap-4">
        {tiers.map((tier) => (
          <Card key={tier.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${getTierColor(tier.tier_name)} flex items-center justify-center`}>
                  {getTierIcon(tier.tier_name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-black text-2xl mb-1 capitalize">{tier.tier_name} Tier</h3>
                      <Badge className="bg-purple-500 mb-2">{tier.points_required} points required</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(tier)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this tier?')) {
                            deleteTierMutation.mutate(tier.id);
                          }
                        }}
                        className="border-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-3">
                    {tier.discount_percentage > 0 && (
                      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                        <Percent className="w-5 h-5 text-green-400 mb-1" />
                        <p className="text-green-300 font-bold">{tier.discount_percentage}% OFF</p>
                        <p className="text-green-200 text-xs">All purchases</p>
                      </div>
                    )}
                    {tier.free_shipping && (
                      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-400 mb-1" />
                        <p className="text-blue-300 font-bold">FREE</p>
                        <p className="text-blue-200 text-xs">Shipping</p>
                      </div>
                    )}
                    {tier.early_access && (
                      <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-400 mb-1" />
                        <p className="text-purple-300 font-bold">EARLY</p>
                        <p className="text-purple-200 text-xs">Access</p>
                      </div>
                    )}
                    {tier.points_multiplier > 1 && (
                      <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                        <Star className="w-5 h-5 text-cyan-400 mb-1" />
                        <p className="text-cyan-300 font-bold">{tier.points_multiplier}x</p>
                        <p className="text-cyan-200 text-xs">Points</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Members */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Top Loyalty Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-2">
          {customers.slice(0, 10).map((customer, idx) => (
            <div key={customer.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTierColor(customer.current_tier)} flex items-center justify-center text-white font-black`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{customer.user_name}</p>
                <p className="text-slate-400 text-sm">{customer.user_email}</p>
              </div>
              <div className="text-right">
                <Badge className={`bg-gradient-to-r ${getTierColor(customer.current_tier)} capitalize mb-1`}>
                  {customer.current_tier}
                </Badge>
                <p className="text-cyan-400 font-black">{customer.total_points} pts</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tier Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingTier ? 'Edit Tier' : 'Create Reward Tier'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Tier Level *</Label>
                <select
                  value={tierForm.tier_name}
                  onChange={(e) => setTierForm({...tierForm, tier_name: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Points Required *</Label>
                <Input
                  type="number"
                  value={tierForm.points_required}
                  onChange={(e) => setTierForm({...tierForm, points_required: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-white mb-2 block">Discount %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tierForm.discount_percentage}
                  onChange={(e) => setTierForm({...tierForm, discount_percentage: parseFloat(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Birthday Bonus Points</Label>
                <Input
                  type="number"
                  value={tierForm.birthday_bonus}
                  onChange={(e) => setTierForm({...tierForm, birthday_bonus: parseInt(e.target.value) || 0})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Points Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tierForm.points_multiplier}
                  onChange={(e) => setTierForm({...tierForm, points_multiplier: parseFloat(e.target.value) || 1})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
              <Label className="text-white font-bold">Perks & Benefits</Label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tierForm.free_shipping}
                  onChange={(e) => setTierForm({...tierForm, free_shipping: e.target.checked})}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-semibold">Free Shipping</p>
                  <p className="text-slate-400 text-xs">All orders ship free</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tierForm.early_access}
                  onChange={(e) => setTierForm({...tierForm, early_access: e.target.checked})}
                  className="w-5 h-5"
                />
                <div>
                  <p className="text-white font-semibold">Early Access</p>
                  <p className="text-slate-400 text-xs">Access to new products first</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={tierForm.points_required < 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {editingTier ? 'Update' : 'Create'} Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Trophy({ className }) {
  return <Award className={className} />;
}