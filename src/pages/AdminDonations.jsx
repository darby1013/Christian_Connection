import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign, Search, TrendingUp, Heart, Users, Calendar,
  Eye, Download, Filter, BarChart3, Gift, Target
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminDonations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-created_date'),
    initialData: [],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['donationCampaigns'],
    queryFn: () => base44.entities.DonationCampaign.list('-created_date'),
    initialData: [],
  });

  const { data: recurring = [] } = useQuery({
    queryKey: ['recurringDonations'],
    queryFn: () => base44.entities.RecurringDonation.filter({ status: 'active' }),
    initialData: [],
  });

  const viewDetails = (donation) => {
    setSelectedDonation(donation);
    setDetailDialogOpen(true);
  };

  const filteredDonations = donations.filter(d => {
    const matchesSearch = 
      d.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donor_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || d.recipient_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const avgDonation = donations.length > 0 ? totalDonations / donations.length : 0;
  const monthlyRecurring = recurring.reduce((sum, r) => sum + (r.amount || 0), 0);
  const uniqueDonors = new Set(donations.map(d => d.donor_email)).size;

  const getRecipientColor = (type) => {
    const colors = {
      streamer: 'bg-purple-500',
      community: 'bg-blue-500',
      event: 'bg-green-500',
      general: 'bg-cyan-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Donation Management</h2>
          <p className="text-slate-400 font-semibold">Track giving and manage campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-purple-500 hover:bg-purple-600 font-bold">
            <Target className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">${totalDonations.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Donations</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-pink-400" />
              <Badge className="bg-pink-500">{donations.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{donations.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Gifts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{uniqueDonors}</p>
            <p className="text-slate-400 text-sm font-semibold">Unique Donors</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{recurring.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">${monthlyRecurring.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Monthly Recurring</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All Donations ({donations.length})
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-500">
            Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="recurring" className="data-[state=active]:bg-cyan-500">
            Recurring ({recurring.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search donations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 px-3 rounded-md bg-[#1a1f3a] border border-slate-700 text-white"
              >
                <option value="all">All Types</option>
                <option value="streamer">Streamer</option>
                <option value="community">Community</option>
                <option value="event">Event</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Donor</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Amount</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Type</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Date</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                    <th className="text-right p-4 text-slate-400 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((donation) => (
                    <tr key={donation.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-semibold">
                            {donation.is_anonymous ? 'Anonymous' : donation.donor_name}
                          </p>
                          {!donation.is_anonymous && (
                            <p className="text-slate-400 text-sm">{donation.donor_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-bold text-lg">${donation.amount?.toFixed(2)}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={getRecipientColor(donation.recipient_type)}>
                          {donation.recipient_type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">
                          {format(new Date(donation.created_date), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge className={donation.payment_status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}>
                          {donation.payment_status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => viewDetails(donation)}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => {
              const progress = campaign.goal_amount > 0 
                ? (campaign.current_amount / campaign.goal_amount) * 100 
                : 0;
              
              return (
                <Card key={campaign.id} className="bg-[#1a1f3a] border-slate-700">
                  {campaign.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="text-white font-bold text-lg mb-2">{campaign.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white font-bold">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-green-400 font-bold">${campaign.current_amount?.toLocaleString()}</span>
                        <span className="text-slate-400">of ${campaign.goal_amount?.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={campaign.is_active ? 'bg-green-500' : 'bg-slate-500'}>
                        {campaign.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Donor</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Amount</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Frequency</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Next Payment</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Total Given</th>
                    <th className="text-left p-4 text-slate-400 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recurring.map((donation) => (
                    <tr key={donation.id} className="border-b border-slate-700/50">
                      <td className="p-4">
                        <p className="text-white font-semibold">{donation.donor_name}</p>
                        <p className="text-slate-400 text-sm">{donation.donor_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-bold">${donation.amount}/mo</p>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-purple-500 capitalize">{donation.frequency}</Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">
                          {format(new Date(donation.next_payment_date), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-green-400 font-bold">${donation.total_donated?.toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-green-500">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Donation Details</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Donor</p>
                <p className="text-white font-bold text-lg">
                  {selectedDonation.is_anonymous ? 'Anonymous Donor' : selectedDonation.donor_name}
                </p>
                {!selectedDonation.is_anonymous && (
                  <p className="text-slate-400">{selectedDonation.donor_email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Amount</p>
                  <p className="text-green-400 font-black text-2xl">${selectedDonation.amount?.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Date</p>
                  <p className="text-white font-semibold">
                    {format(new Date(selectedDonation.created_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm mb-1">Type</p>
                <Badge className={getRecipientColor(selectedDonation.recipient_type)}>
                  {selectedDonation.recipient_type}
                </Badge>
              </div>

              {selectedDonation.message && (
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Message</p>
                  <p className="text-white">{selectedDonation.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}