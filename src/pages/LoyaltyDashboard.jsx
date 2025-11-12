import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award, Crown, Star, Gift, TrendingUp, Users,
  ShoppingBag, Zap, Truck, Eye, Calendar, DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LoyaltyDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: loyalty } = useQuery({
    queryKey: ['myLoyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const records = await base44.entities.CustomerLoyalty.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['loyaltyTiers'],
    queryFn: () => base44.entities.LoyaltyProgram.filter({ is_active: true }, 'points_required'),
    initialData: [],
  });

  const currentTier = tiers.find(t => t.tier_name === loyalty?.current_tier);
  const nextTierData = tiers.find(t => t.points_required > (loyalty?.total_points || 0));

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

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'bronze': return <Award className="w-12 h-12 text-amber-700" />;
      case 'silver': return <Award className="w-12 h-12 text-slate-400" />;
      case 'gold': return <Crown className="w-12 h-12 text-yellow-400" />;
      case 'platinum': return <Crown className="w-12 h-12 text-cyan-400" />;
      case 'diamond': return <Star className="w-12 h-12 text-purple-400" />;
      default: return <Award className="w-12 h-12" />;
    }
  };

  if (!loyalty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Join Rewards Program</h2>
            <p className="text-slate-400 mb-6">Start earning points with every purchase</p>
            <Link to={createPageUrl("StoreAdvanced")}>
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierProgress = nextTierData 
    ? ((loyalty.total_points / nextTierData.points_required) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8">Loyalty Rewards</h1>

        {/* Current Tier Card */}
        <Card className={`bg-gradient-to-br ${getTierColor(loyalty.current_tier)} border-0 mb-8`}>
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {getTierIcon(loyalty.current_tier)}
              </div>
              <div className="flex-1">
                <Badge className="bg-white/20 backdrop-blur-sm text-white mb-2">Current Tier</Badge>
                <h2 className="text-4xl font-black text-white mb-2 capitalize">{loyalty.current_tier} Member</h2>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white/80 text-sm">Total Points</p>
                    <p className="text-3xl font-black text-white">{loyalty.total_points}</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Lifetime Earned</p>
                    <p className="text-2xl font-black text-white">{loyalty.lifetime_points}</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Redeemed</p>
                    <p className="text-2xl font-black text-white">{loyalty.points_redeemed}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress to Next Tier */}
        {nextTierData && (
          <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Progress to {nextTierData.tier_name} Tier</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Current: {loyalty.total_points} points</span>
                  <span className="text-white font-bold">Goal: {nextTierData.points_required} points</span>
                </div>
                <Progress value={tierProgress} className="h-4" />
              </div>
              <p className="text-cyan-400 font-bold">
                {nextTierData.points_required - loyalty.total_points} points to go!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current Tier Benefits */}
        {currentTier && (
          <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Your Benefits</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentTier.discount_percentage > 0 && (
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                    <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-300 font-black text-2xl">{currentTier.discount_percentage}%</p>
                    <p className="text-green-200 text-sm">Discount on All Orders</p>
                  </div>
                )}
                {currentTier.free_shipping && (
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-center">
                    <Truck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-300 font-black text-xl">FREE</p>
                    <p className="text-blue-200 text-sm">Shipping Always</p>
                  </div>
                )}
                {currentTier.points_multiplier > 1 && (
                  <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-center">
                    <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-300 font-black text-2xl">{currentTier.points_multiplier}x</p>
                    <p className="text-purple-200 text-sm">Points Multiplier</p>
                  </div>
                )}
                {currentTier.early_access && (
                  <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg text-center">
                    <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-cyan-300 font-black text-xl">EARLY</p>
                    <p className="text-cyan-200 text-sm">Access to New Products</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Tiers */}
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold">All Reward Tiers</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {tiers.map((tier) => {
              const isCurrentTier = tier.tier_name === loyalty.current_tier;
              const isLocked = tier.points_required > loyalty.total_points;

              return (
                <div
                  key={tier.id}
                  className={`p-5 rounded-xl border-2 ${
                    isCurrentTier
                      ? `bg-gradient-to-br ${getTierColor(tier.tier_name)} border-white/30`
                      : isLocked
                      ? 'bg-slate-900/30 border-slate-700 opacity-60'
                      : 'bg-slate-900/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl ${isCurrentTier ? 'bg-white/20' : 'bg-slate-800'} flex items-center justify-center`}>
                      {getTierIcon(tier.tier_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-black capitalize ${isCurrentTier ? 'text-white' : 'text-slate-300'}`}>
                          {tier.tier_name}
                        </h3>
                        {isCurrentTier && (
                          <Badge className="bg-white/20 backdrop-blur-sm text-white">Your Tier</Badge>
                        )}
                        {isLocked && (
                          <Badge className="bg-slate-700">Locked</Badge>
                        )}
                      </div>
                      <p className={isCurrentTier ? 'text-white/80' : 'text-slate-400'}>
                        {tier.points_required} points required
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}