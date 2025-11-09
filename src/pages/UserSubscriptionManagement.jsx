import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Crown, Calendar, CreditCard, AlertCircle, CheckCircle, 
  TrendingUp, DollarSign, Gift, RefreshCw, Bell, User as UserIcon,
  Settings, Heart, Star, Sparkles, Zap, ArrowRight
} from "lucide-react";
import { format, addMonths } from "date-fns";
import MembershipBadge from "../components/ui/MembershipBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserSubscriptionManagement() {
  const [user, setUser] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const queryClient = useQueryClient();

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

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ 
        user_id: user?.id, 
        status: 'active' 
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ is_active: true }, 'sort_order'),
    initialData: [],
  });

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['paymentHistory', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }, '-created_date', 20),
    enabled: !!user,
    initialData: [],
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ reason }) => {
      // Update subscription
      await base44.entities.Subscription.update(subscription.id, {
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        auto_renew: false
      });

      // Update user
      await base44.auth.updateMe({
        auto_renew: false,
        subscription_status: 'cancelled'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      setShowCancelDialog(false);
      setCancellationReason("");
    }
  });

  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Subscription.update(subscription.id, {
        cancel_at_period_end: false,
        cancelled_at: null,
        auto_renew: true,
        status: 'active'
      });

      await base44.auth.updateMe({
        auto_renew: true,
        subscription_status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
    }
  });

  const updateAutoRenewMutation = useMutation({
    mutationFn: async (autoRenew) => {
      await base44.entities.Subscription.update(subscription.id, {
        auto_renew: autoRenew
      });

      await base44.auth.updateMe({
        auto_renew: autoRenew
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
    }
  });

  if (!user) return null;

  const hasActiveSubscription = subscription && subscription.status === 'active';
  const isCancelled = subscription?.cancel_at_period_end;

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white">Membership</h1>
              {user.subscription_tier && user.subscription_tier !== 'free' && (
                <MembershipBadge tier={user.subscription_tier} />
              )}
            </div>
            <Link to={createPageUrl("UserProfile")}>
              <Button variant="outline" className="border-slate-700 text-slate-300">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
          </div>
          <p className="text-slate-400 font-semibold">Manage your subscription and billing</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Subscription */}
            {hasActiveSubscription ? (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-black flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Current Membership
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-black text-white">{subscription.plan_name}</h3>
                        <MembershipBadge tier={subscription.plan_type} />
                      </div>
                      <p className="text-3xl font-black text-cyan-400 mb-4">${subscription.price}/mo</p>
                      <div className="space-y-2">
                        {subscription.benefits?.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-300">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-lg mb-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Status</p>
                      <Badge className={isCancelled ? "bg-orange-500" : "bg-green-500"}>
                        {isCancelled ? "Cancelling" : "Active"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Next Billing</p>
                      <p className="text-white font-bold text-sm">
                        {subscription.next_billing_date 
                          ? format(new Date(subscription.next_billing_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Started</p>
                      <p className="text-white font-bold text-sm">
                        {format(new Date(subscription.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Payment Method</p>
                      <p className="text-white font-bold text-sm capitalize">{subscription.payment_method}</p>
                    </div>
                  </div>

                  {isCancelled ? (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                        <div>
                          <p className="text-orange-400 font-bold mb-1">Subscription Cancelling</p>
                          <p className="text-slate-300 text-sm mb-2">
                            Your membership will not auto-renew and will end on{' '}
                            <span className="font-bold text-white">
                              {format(new Date(subscription.end_date), 'MMMM d, yyyy')}
                            </span>
                          </p>
                          <p className="text-slate-400 text-xs mb-3">
                            You'll continue to have access to all benefits until the end of your billing period.
                          </p>
                          <Button
                            onClick={() => reactivateSubscriptionMutation.mutate()}
                            disabled={reactivateSubscriptionMutation.isPending}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reactivate Subscription
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg mb-4">
                        <div>
                          <p className="text-white font-bold mb-1">Auto-Renewal</p>
                          <p className="text-slate-400 text-sm">
                            {subscription.auto_renew 
                              ? "Your subscription will automatically renew" 
                              : "Auto-renewal is disabled"}
                          </p>
                        </div>
                        <Switch
                          checked={subscription.auto_renew}
                          onCheckedChange={(checked) => updateAutoRenewMutation.mutate(checked)}
                        />
                      </div>

                      <Button
                        onClick={() => setShowCancelDialog(true)}
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        Cancel Membership
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <Crown className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">No Active Membership</h3>
                  <p className="text-slate-300 mb-6">
                    Upgrade to unlock exclusive content, features, and support the mission
                  </p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Browse Plans
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Available Plans */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <Gift className="w-5 h-5 text-cyan-400" />
                  Available Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <Card key={plan.id} className={`bg-slate-900/50 border-slate-700 ${
                      subscription?.plan_type === plan.tier ? 'border-cyan-500 border-2' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <MembershipBadge tier={plan.tier} />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">{plan.name}</h4>
                        <p className="text-2xl font-black text-cyan-400 mb-3">${plan.price}/mo</p>
                        <div className="space-y-1 mb-4">
                          {plan.features?.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-300 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        {subscription?.plan_type === plan.tier ? (
                          <Badge className="w-full justify-center bg-green-600">Current Plan</Badge>
                        ) : (
                          <Button className="w-full bg-cyan-500 hover:bg-cyan-600" size="sm">
                            {hasActiveSubscription ? 'Upgrade' : 'Subscribe'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {paymentHistory.length > 0 ? (
                  <div className="space-y-2">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <div>
                          <p className="text-white font-semibold text-sm">{payment.order_number || 'Payment'}</p>
                          <p className="text-slate-400 text-xs">
                            {format(new Date(payment.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">${payment.total_amount?.toFixed(2)}</p>
                          <Badge className="bg-green-600 text-xs">{payment.payment_status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">No payment history yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Benefits */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Membership Benefits</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Exclusive Content</p>
                      <p className="text-slate-400 text-xs">Access members-only streams and videos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Ad-Free Experience</p>
                      <p className="text-slate-400 text-xs">Enjoy uninterrupted streaming</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Priority Support</p>
                      <p className="text-slate-400 text-xs">Get help faster with priority access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Support the Mission</p>
                      <p className="text-slate-400 text-xs">Help us grow and reach more people</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-700 text-slate-300" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancellation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="bg-[#1a1f3a] border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Cancel Membership?
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                We're sorry to see you go! Your subscription will remain active until the end of your billing period.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-cyan-400 font-semibold mb-2">What happens next?</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Your subscription will not auto-renew</li>
                  <li>• You'll keep access until {subscription?.end_date && format(new Date(subscription.end_date), 'MMMM d, yyyy')}</li>
                  <li>• You can reactivate anytime before it ends</li>
                  <li>• No partial refunds for unused time</li>
                </ul>
              </div>
              <div>
                <Label className="text-white mb-2 block">Help us improve (optional)</Label>
                <Textarea
                  placeholder="Let us know why you're cancelling..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="border-slate-700">
                Keep Membership
              </Button>
              <Button
                onClick={() => cancelSubscriptionMutation.mutate({ reason: cancellationReason })}
                disabled={cancelSubscriptionMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}