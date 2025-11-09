import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Heart, DollarSign, TrendingUp, Users, Target, Calendar,
  CheckCircle, Repeat, CreditCard, Gift, Star, Award, Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Donate() {
  const [user, setUser] = useState(null);
  const [donateDialog, setDonateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donationForm, setDonationForm] = useState({
    amount: 50,
    message: '',
    is_anonymous: false,
    donation_type: 'one-time'
  });
  const [recurringForm, setRecurringForm] = useState({
    amount: 25,
    frequency: 'monthly'
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['donationCampaigns'],
    queryFn: () => base44.entities.DonationCampaign.filter({ is_active: true }, '-created_date'),
    initialData: [],
  });

  const { data: recentDonations = [] } = useQuery({
    queryKey: ['recentDonations'],
    queryFn: () => base44.entities.Donation.list('-created_date', 10),
    initialData: [],
  });

  const { data: myRecurring = [] } = useQuery({
    queryKey: ['myRecurringDonations', user?.id],
    queryFn: () => base44.entities.RecurringDonation.filter({ 
      donor_id: user.id,
      status: 'active'
    }),
    initialData: [],
    enabled: !!user,
  });

  const donateMutation = useMutation({
    mutationFn: async (donationData) => {
      const donation = await base44.entities.Donation.create({
        ...donationData,
        donor_id: user?.id,
        donor_name: donationData.is_anonymous ? 'Anonymous' : user?.full_name,
        donor_email: user?.email,
        payment_status: 'completed'
      });

      if (selectedCampaign) {
        await base44.entities.DonationCampaign.update(selectedCampaign.id, {
          current_amount: (selectedCampaign.current_amount || 0) + donationData.amount,
          donor_count: (selectedCampaign.donor_count || 0) + 1
        });
      }

      return donation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['recentDonations'] });
      setDonateDialog(false);
      setDonationForm({ amount: 50, message: '', is_anonymous: false, donation_type: 'one-time' });
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: (recurringData) => base44.entities.RecurringDonation.create({
      ...recurringData,
      donor_id: user.id,
      donor_name: user.full_name,
      donor_email: user.email,
      campaign_id: selectedCampaign?.id,
      start_date: new Date().toISOString(),
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRecurringDonations'] });
      setDonateDialog(false);
    },
  });

  const handleDonate = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (donationForm.donation_type === 'recurring') {
      createRecurringMutation.mutate(recurringForm);
    } else {
      donateMutation.mutate({
        amount: donationForm.amount,
        message: donationForm.message,
        is_anonymous: donationForm.is_anonymous,
        recipient_type: selectedCampaign ? 'community' : 'general',
        recipient_id: selectedCampaign?.id
      });
    }
  };

  const openDonateDialog = (campaign = null) => {
    setSelectedCampaign(campaign);
    setDonateDialog(true);
  };

  const featuredCampaigns = campaigns.filter(c => c.featured);
  const activeCampaigns = campaigns.filter(c => !c.featured);

  const getCategoryColor = (category) => {
    const colors = {
      missions: "from-blue-500 to-cyan-500",
      building: "from-amber-500 to-orange-500",
      ministry: "from-purple-500 to-pink-500",
      outreach: "from-green-500 to-emerald-500",
      emergency: "from-red-500 to-rose-500",
      general: "from-slate-500 to-gray-500"
    };
    return colors[category] || colors.general;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      missions: "🌍",
      building: "🏛️",
      ministry: "✝️",
      outreach: "🤝",
      emergency: "🚨",
      general: "❤️"
    };
    return icons[category] || icons.general;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Give</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Your generosity transforms lives and advances God's kingdom
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                {recentDonations.length} Recent Donors
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                {campaigns.length} Active Campaigns
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Quick Give */}
        <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-2 border-pink-500/30 mb-12">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-white font-black text-3xl mb-4">Make a Difference Today</h2>
                <p className="text-slate-300 mb-6">
                  Your one-time or recurring gift helps us continue our mission to spread hope, faith, and love in our community and beyond.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  {[25, 50, 100, 250].map((amount) => (
                    <Button
                      key={amount}
                      variant={donationForm.amount === amount ? "default" : "outline"}
                      onClick={() => setDonationForm({...donationForm, amount})}
                      className={donationForm.amount === amount ? "bg-pink-500 hover:bg-pink-600" : "border-slate-600"}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={() => openDonateDialog(null)}
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 font-bold text-lg"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Give Now
                </Button>
              </div>
              <div className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">Secure & Safe</h4>
                      <p className="text-slate-400 text-sm">Your donation is protected</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">Tax Deductible</h4>
                      <p className="text-slate-400 text-sm">Receive instant receipts</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">100% Impact</h4>
                      <p className="text-slate-400 text-sm">Every dollar makes a difference</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-500">
              Active Campaigns
            </TabsTrigger>
            <TabsTrigger value="recurring" className="data-[state=active]:bg-cyan-500">
              <Repeat className="w-4 h-4 mr-2" />
              Recurring Giving
            </TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-cyan-500">
              <TrendingUp className="w-4 h-4 mr-2" />
              Our Impact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6 space-y-8">
            {/* Featured Campaigns */}
            {featuredCampaigns.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  Featured Campaigns
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredCampaigns.map((campaign) => {
                    const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                    return (
                      <Card key={campaign.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
                        <div className="relative aspect-video">
                          <img
                            src={campaign.image_url || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800'}
                            alt={campaign.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                          <Badge className="absolute top-4 left-4 bg-amber-500">
                            <Star className="w-3 h-3 mr-1 fill-white" />
                            Featured
                          </Badge>
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-3xl">{getCategoryIcon(campaign.category)}</span>
                            <Badge className="capitalize bg-purple-500">{campaign.category}</Badge>
                          </div>
                          <h3 className="text-white font-black text-2xl mb-3">{campaign.title}</h3>
                          <p className="text-slate-300 mb-4 line-clamp-2">{campaign.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-white font-bold">{progress.toFixed(0)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                            <div className="flex justify-between text-sm">
                              <span className="text-cyan-400 font-bold">
                                ${campaign.current_amount?.toLocaleString() || 0} raised
                              </span>
                              <span className="text-slate-400">
                                of ${campaign.goal_amount?.toLocaleString()} goal
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {campaign.donor_count || 0} donors
                            </span>
                            {campaign.end_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(campaign.end_date), 'MMM d')}
                              </span>
                            )}
                          </div>

                          <Button 
                            onClick={() => openDonateDialog(campaign)}
                            className="w-full bg-amber-500 hover:bg-amber-600 font-bold"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Support This Campaign
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Campaigns */}
            <div>
              <h3 className="text-white font-bold text-xl mb-6">All Active Campaigns</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {activeCampaigns.map((campaign) => {
                  const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                  return (
                    <Card key={campaign.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                      <div className={`h-32 bg-gradient-to-br ${getCategoryColor(campaign.category)} flex items-center justify-center text-5xl`}>
                        {getCategoryIcon(campaign.category)}
                      </div>
                      <CardContent className="p-5">
                        <Badge className="capitalize bg-purple-500 mb-2">{campaign.category}</Badge>
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{campaign.title}</h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                        
                        <Progress value={progress} className="h-2 mb-2" />
                        <div className="flex justify-between text-xs mb-4">
                          <span className="text-cyan-400">${campaign.current_amount?.toLocaleString() || 0}</span>
                          <span className="text-slate-500">${campaign.goal_amount?.toLocaleString()}</span>
                        </div>

                        <Button 
                          onClick={() => openDonateDialog(campaign)}
                          className="w-full bg-cyan-500 hover:bg-cyan-600"
                          size="sm"
                        >
                          Donate
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recurring" className="mt-6">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
                <CardContent className="p-8">
                  <Repeat className="w-16 h-16 text-purple-400 mb-4" />
                  <h2 className="text-white font-black text-3xl mb-4">Become a Monthly Partner</h2>
                  <p className="text-slate-300 mb-6">
                    Join our community of faithful givers who provide consistent support through recurring donations. Your monthly gift creates lasting impact.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white font-semibold">Sustainable Impact</p>
                        <p className="text-slate-400 text-sm">Regular giving enables long-term planning</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white font-semibold">Automatic & Convenient</p>
                        <p className="text-slate-400 text-sm">Set it once and make a difference monthly</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white font-semibold">Cancel Anytime</p>
                        <p className="text-slate-400 text-sm">Full control over your giving</p>
                      </div>
                    </div>
                  </div>

                  {user ? (
                    <Button 
                      onClick={() => {
                        setDonationForm({...donationForm, donation_type: 'recurring'});
                        openDonateDialog(null);
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 font-bold"
                    >
                      <Repeat className="w-5 h-5 mr-2" />
                      Start Monthly Giving
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => base44.auth.redirectToLogin()}
                      className="w-full bg-purple-500 hover:bg-purple-600 font-bold"
                    >
                      Sign In to Start
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* My Recurring Donations */}
              {user && myRecurring.length > 0 && (
                <div>
                  <h3 className="text-white font-bold text-xl mb-4">My Recurring Donations</h3>
                  <div className="space-y-4">
                    {myRecurring.map((recurring) => (
                      <Card key={recurring.id} className="bg-[#1a1f3a] border-slate-700">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-bold text-lg">${recurring.amount}</h4>
                              <p className="text-slate-400 text-sm capitalize">{recurring.frequency}</p>
                            </div>
                            <Badge className="bg-green-500">Active</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Next Payment:</span>
                              <span className="text-white">{format(new Date(recurring.next_payment_date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Donated:</span>
                              <span className="text-cyan-400 font-bold">${recurring.total_donated || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Donations Made:</span>
                              <span className="text-white">{recurring.donation_count || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="impact" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-cyan-500/30">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                  <h3 className="text-4xl font-black text-white mb-1">1,247</h3>
                  <p className="text-slate-400">Lives Impacted</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-4xl font-black text-white mb-1">$125K</h3>
                  <p className="text-slate-400">Total Raised</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-4xl font-black text-white mb-1">12</h3>
                  <p className="text-slate-400">Goals Achieved</p>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-white font-bold text-2xl mb-6">Recent Donors</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {recentDonations.slice(0, 6).map((donation) => (
                <Card key={donation.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{donation.donor_name}</p>
                      <p className="text-slate-400 text-sm">Donated ${donation.amount}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {format(new Date(donation.created_date), 'MMM d')}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Donation Dialog */}
      <Dialog open={donateDialog} onOpenChange={setDonateDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-2xl">
              {selectedCampaign ? selectedCampaign.title : 'Make a Donation'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Your generosity makes a real difference
            </DialogDescription>
          </DialogHeader>

          <Tabs value={donationForm.donation_type} onValueChange={(val) => setDonationForm({...donationForm, donation_type: val})}>
            <TabsList className="w-full bg-slate-900">
              <TabsTrigger value="one-time" className="flex-1">One-Time</TabsTrigger>
              <TabsTrigger value="recurring" className="flex-1">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="one-time" className="space-y-4 pt-4">
              <div>
                <Label className="text-white mb-2 block">Donation Amount</Label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[25, 50, 100, 250].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={donationForm.amount === amount ? "default" : "outline"}
                      onClick={() => setDonationForm({...donationForm, amount})}
                      className={donationForm.amount === amount ? "bg-pink-500" : "border-slate-600"}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({...donationForm, amount: parseFloat(e.target.value)})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  placeholder="Custom amount"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Message (Optional)</Label>
                <Input
                  value={donationForm.message}
                  onChange={(e) => setDonationForm({...donationForm, message: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  placeholder="Add a message..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={donationForm.is_anonymous}
                  onChange={(e) => setDonationForm({...donationForm, is_anonymous: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="anonymous" className="text-white text-sm">
                  Make this donation anonymous
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4 pt-4">
              <div>
                <Label className="text-white mb-2 block">Monthly Amount</Label>
                <Input
                  type="number"
                  value={recurringForm.amount}
                  onChange={(e) => setRecurringForm({...recurringForm, amount: parseFloat(e.target.value)})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Frequency</Label>
                <select
                  value={recurringForm.frequency}
                  onChange={(e) => setRecurringForm({...recurringForm, frequency: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDonateDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleDonate}
              disabled={donateMutation.isPending || createRecurringMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              <Heart className="w-4 h-4 mr-2" />
              {donateMutation.isPending || createRecurringMutation.isPending ? 'Processing...' : 
               donationForm.donation_type === 'recurring' ? 'Start Monthly Giving' : 'Complete Donation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}