import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Lock } from "lucide-react";

export default function SubscriptionOffer({ user }) {
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ is_active: true }, 'sort_order'),
    initialData: [],
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['userSubscription', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id, status: 'active' }),
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: (subData) => base44.entities.Subscription.create(subData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      alert("Subscription activated! Welcome to the community! 🎉");
    },
  });

  const handleSubscribe = (plan) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const endDate = new Date();
    if (plan.billing_period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billing_period === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    subscribeMutation.mutate({
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      plan_type: plan.tier,
      plan_name: plan.name,
      price: plan.price,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
      benefits: plan.features
    });
  };

  const tierIcons = {
    basic: Star,
    premium: Crown,
    vip: Zap
  };

  const tierColors = {
    basic: "from-blue-500 to-cyan-500",
    premium: "from-purple-500 to-pink-500",
    vip: "from-amber-500 to-orange-500"
  };

  const hasActiveSubscription = userSubscription && userSubscription.length > 0;

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white font-black text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
          Exclusive Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {hasActiveSubscription ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">You're a Member!</h3>
            <p className="text-slate-400 mb-4">
              Thank you for supporting our community
            </p>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2">
              {userSubscription[0].plan_name} Active
            </Badge>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const Icon = tierIcons[plan.tier];
              return (
                <Card
                  key={plan.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 bg-gradient-to-br ${tierColors[plan.tier]} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{plan.name}</h4>
                          <p className="text-xs text-slate-400">{plan.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-cyan-400">
                          ${plan.price}
                        </div>
                        <p className="text-xs text-slate-400">/{plan.billing_period}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {plan.features?.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full bg-gradient-to-r ${tierColors[plan.tier]} hover:opacity-90 text-white font-bold`}
                      disabled={subscribeMutation.isPending}
                    >
                      Subscribe Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Cancel anytime. All transactions are secure and encrypted.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}