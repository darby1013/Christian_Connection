import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Heart, DollarSign, TrendingUp, Users, Target, Calendar,
  CheckCircle, Gift, Zap, Award, Sparkles, Clock, CreditCard
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
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Donate() {
  const [user, setUser] = useState(null);
  const [donationDialog, setDonationDialog] = useState(false);
  const [recurringDialog, setRecurringDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donationForm, setDonationForm] = useState({
    amount: 50,
    custom_amount: '',
    donor_name: '',
    donor_email: '',
    message: '',
    is_anonymous: false
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
        setDonationForm(prev => ({
          ...prev,
          donor_name: currentUser.full_name,
          donor_email: currentUser.email
        }));
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

  const { data: myRecurring = [] } = useQuery({
    queryKey: ['myRecurringDonations', user?.id],
    queryFn: () => base44.entities.RecurringDonation.filter({ donor_id: user.id, status: 'active' }),
    initialData: [],
    enabled: !!user,
  });

  const { data: recentDonations = [] } = useQuery({
    queryKey: ['recentDonations'],
    queryFn: () => base44.entities.Donation.filter({}, '-created_date', 5),
    initialData: [],
  });

  const donateMutation = useMutation({
    mutationFn: async (donationData) => {
      const donation = await base44.entities.Donation.create({
        ...donationData,
        donor_id: user?.id,
        recipient_type: selectedCampaign ? 'campaign' : 'general',
        recipient_id: selectedCampaign?.id,
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
      setDonationDialog(false);
      setSelectedCampaign(null);
    },
  });

  const recurringMutation = useMutation({
    mutationFn: (recurringData) => base44.entities.RecurringDonation.create({
      ...recurringData,
      donor_id: user.id,
      donor_name: user.full_name,
      donor_email: user.email,
      campaign_id: selectedCampaign?.id,
      start_date: new Date().toISOString(),
      next_payment_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      status: 'active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRecurringDonations'] });
      setRecurringDialog(false);
      setSelectedCampaign(null);
    },
  });

  const handleDonate = () => {
    const amount = donationForm.custom_amount || donationForm.amount;
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    donateMutation.mutate({
      amount: parseFloat(amount),
      donor_name: donationForm.is_anonymous ? 'Anonymous' : donationForm.donor_name,
      donor_email: donationForm.donor_email,
      message: donationForm.message,
      is_anonymous: donationForm.is_anonymous
    });
  };

  const handleRecurring = () => {
    if (!recurringForm.amount || recurringForm.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    recurringMutation.mutate(recurringForm);
  };

  const featuredCampaigns = campaigns.filter(c => c.featured);
  const activeCampaigns = campaigns.filter(c => !c.featured);

  const totalRaised = campaigns.reduce((sum, c) => sum + (c.current_amount || 0), 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + (c.donor_count || 0), 0);

  const getCategoryIcon = (category) => {
    const icons = {
      missions: Gift,
      building: Target,
      ministry: Heart,
      outreach: Users,
      emergency: Zap,
      general: DollarSign
    };
    return icons[category] || DollarSign;
  };

  const getCategoryColor = (category) => {
    const colors = {
      missions: "from-blue-500 to-cyan-500",
      building: "from-amber-500 to-orange-500",
      ministry: "from-pink-500 to-rose-500",
      outreach: "from-purple-500 to-fuchsia-500",
      emergency: "from-red-500 to-rose-500",
      general: "from-green-500 to-emerald-500"
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Give Generously</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Your generosity makes a lasting impact on lives and communities
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <DollarSign className="w-4 h-4 mr-2" />
                ${totalRaised.toLocaleString()} Raised
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                {totalDonors} Donors
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Quick Give Options */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 mb-12">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-white font-black text-2xl mb-2">Quick Give</h2>
              <p className="text-slate-300">Make a one-time donation in seconds</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[25, 50, 100, 250].map((amount) => (
                <Button
                  key={amount}
                  onClick={() => {
                    setDonationForm({...donationForm, amount, custom_amount: ''});
                    setSelectedCampaign(null);
                    setDonationDialog(true);
                  }}
                  className="bg-white/10 hover:bg-cyan-500 text-white font-bold text-2xl h-20 border-2 border-white/20 hover:border-cyan-500 transition-all"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSelectedCampaign(null);
                  setDonationDialog(true);
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 font-bold text-lg py-6"
              >
                <Heart className="w-5 h-5 mr-2" />
                Give Custom Amount
              </Button>
              {user && (
                <Button
                  onClick={() => setRecurringDialog(true)}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 font-bold text-lg py-6"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Give Monthly
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Recurring Donations */}
        {user && myRecurring.length > 0 && (
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 mb-12">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Your Recurring Donations
              </h3>
              <div className="space-y-3">
                {myRecurring.map((recurring) => (
                  <div key={recurring.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-white font-bold">${recurring.amount} / {recurring.frequency}</p>
                      <p className="text-slate-400 text-sm">
                        Next payment: {format(new Date(recurring.next_payment_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-500">
              Active Campaigns
            </TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-cyan-500">
              Our Impact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6 space-y-8">
            {/* Featured Campaigns */}
            {featuredCampaigns.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  Featured Campaigns
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredCampaigns.map((campaign) => {
                    const Icon = getCategoryIcon(campaign.category);
                    const progress = (campaign.current_amount / campaign.goal_amount) * 100;
                    const remaining = campaign.goal_amount - (campaign.current_amount || 0);

                    return (
                      <Card key={campaign.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
                        <div className="relative aspect-video bg-slate-900">
                          <img
                            src={campaign.image_url || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800'}
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-4 left-4 bg-amber-500">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                          <Badge className={`absolute top-4 right-4 bg-gradient-to-br ${getCategoryColor(campaign.category)} capitalize`}>
                            {campaign.category}
                          </Badge>
                        </div>
                        <CardContent className="p-6">
                          <h4 className="text-white font-black text-2xl mb-2">{campaign.title}</h4>
                          <p className="text-slate-300 mb-4 line-clamp-2">{campaign.description}</p>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-cyan-400 font-bold">{progress.toFixed(0)}%</span>
                            </div>
                            <Progress value={progress} className="h-3 bg-slate-900" />
                            <div className="flex justify-between text-sm mt-2">
                              <span className="text-white font-bold">${campaign.current_amount?.toLocaleString() || 0}</span>
                              <span className="text-slate-400">of ${campaign.goal_amount.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Users className="w-4 h-4" />
                              {campaign.donor_count || 0} donors
                            </div>
                            <div className="text-cyan-400 font-bold">
                              ${remaining.toLocaleString()} to go
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setDonationDialog(true);
                            }}
                            className="w-full bg-amber-500 hover:bg-amber-600 font-bold"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Donate Now
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
              <h3 className="text-white font-bold text-xl mb-6">All Campaigns</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {activeCampaigns.map((campaign) => {
                  const Icon = getCategoryIcon(campaign.category);
                  const progress = (campaign.current_amount / campaign.goal_amount) * 100;

                  return (
                    <Card key={campaign.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                      <div className="relative aspect-video bg-slate-900">
                        <img
                          src={campaign.image_url || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600'}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute top-3 left-3 w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(campaign.category)} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h4 className="text-white font-bold text-lg mb-2 line-clamp-2">{campaign.title}</h4>
                        
                        <Progress value={progress} className="h-2 bg-slate-900 mb-2" />
                        <div className="flex justify-between text-xs mb-4">
                          <span className="text-white font-bold">${campaign.current_amount?.toLocaleString() || 0}</span>
                          <span className="text-slate-400">${campaign.goal_amount.toLocaleString()}</span>
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setDonationDialog(true);
                          }}
                          className="w-full bg-cyan-500 hover:bg-cyan-600"
                          size="sm"
                        >
                          Support
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="impact" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-white mb-1">${totalRaised.toLocaleString()}</p>
                  <p className="text-slate-400">Total Raised</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-white mb-1">{totalDonors}</p>
                  <p className="text-slate-400">Generous Donors</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-white mb-1">{campaigns.length}</p>
                  <p className="text-slate-400">Active Campaigns</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-white mb-1">95%</p>
                  <p className="text-slate-400">Impact Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Donations */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-xl mb-4">Recent Donations</h3>
                <div className="space-y-3">
                  {recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{donation.donor_name || 'Anonymous'}</p>
                          <p className="text-slate-400 text-sm">
                            {donation.message && donation.message.substring(0, 50)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-bold">${donation.amount}</p>
                        <p className="text-slate-500 text-xs">{format(new Date(donation.created_date), 'MMM d')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Donation Dialog */}
      <Dialog open={donationDialog} onOpenChange={setDonationDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">
              {selectedCampaign ? `Support ${selectedCampaign.title}` : 'Make a Donation'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Your generosity makes a difference
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-white mb-3 block">Select Amount</Label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={donationForm.amount === amount && !donationForm.custom_amount ? 'default' : 'outline'}
                    onClick={() => setDonationForm({...donationForm, amount, custom_amount: ''})}
                    className={donationForm.amount === amount && !donationForm.custom_amount ? 'bg-cyan-500' : 'border-slate-700'}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={donationForm.custom_amount}
                onChange={(e) => setDonationForm({...donationForm, custom_amount: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Your Name</Label>
              <Input
                value={donationForm.donor_name}
                onChange={(e) => setDonationForm({...donationForm, donor_name: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
                disabled={donationForm.is_anonymous}
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Email</Label>
              <Input
                type="email"
                value={donationForm.donor_email}
                onChange={(e) => setDonationForm({...donationForm, donor_email: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Message (Optional)</Label>
              <Textarea
                value={donationForm.message}
                onChange={(e) => setDonationForm({...donationForm, message: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white h-20"
                placeholder="Share your heart..."
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDonationDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleDonate}
              disabled={donateMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {donateMutation.isPending ? 'Processing...' : `Donate $${donationForm.custom_amount || donationForm.amount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Donation Dialog */}
      <Dialog open={recurringDialog} onOpenChange={setRecurringDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Set Up Recurring Donation</DialogTitle>
            <DialogDescription className="text-slate-400">
              Make a lasting impact with monthly giving
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-white mb-2 block">Monthly Amount</Label>
              <Input
                type="number"
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm({...recurringForm, amount: parseInt(e.target.value)})}
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

            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white font-bold">Your Impact</p>
                    <p className="text-slate-300 text-sm">
                      ${recurringForm.amount * 12}/year helps transform lives
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecurringDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleRecurring}
              disabled={recurringMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {recurringMutation.isPending ? 'Setting Up...' : 'Start Giving'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}