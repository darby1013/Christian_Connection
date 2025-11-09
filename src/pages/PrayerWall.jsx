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
import {
  Heart, Plus, AlertCircle, CheckCircle, Clock, Users, Sparkles
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
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PrayerWall() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prayerForm, setPrayerForm] = useState({
    title: '',
    description: '',
    category: 'other',
    urgency: 'medium',
    is_anonymous: false
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

  const { data: prayers = [] } = useQuery({
    queryKey: ['prayerRequests'],
    queryFn: () => base44.entities.PrayerRequest.filter({ is_public: true }, '-created_date'),
    initialData: [],
  });

  const createPrayerMutation = useMutation({
    mutationFn: (prayerData) => base44.entities.PrayerRequest.create({
      ...prayerData,
      requester_id: user.id,
      requester_name: prayerData.is_anonymous ? 'Anonymous' : user.full_name,
      status: 'open'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      setDialogOpen(false);
      setPrayerForm({ title: '', description: '', category: 'other', urgency: 'medium', is_anonymous: false });
    },
  });

  const prayForRequestMutation = useMutation({
    mutationFn: async (prayerId) => {
      const prayer = prayers.find(p => p.id === prayerId);
      return base44.entities.PrayerRequest.update(prayerId, {
        prayer_count: (prayer.prayer_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
    },
  });

  const handleSubmit = () => {
    if (!prayerForm.title.trim() || !prayerForm.description.trim()) {
      alert('Please fill in all fields');
      return;
    }
    createPrayerMutation.mutate(prayerForm);
  };

  const urgentPrayers = prayers.filter(p => p.urgency === 'urgent' && p.status === 'open');
  const openPrayers = prayers.filter(p => p.status === 'open' && p.urgency !== 'urgent');
  const answeredPrayers = prayers.filter(p => p.status === 'answered');

  const getUrgencyColor = (urgency) => {
    const colors = {
      urgent: "from-red-500 to-rose-500",
      high: "from-orange-500 to-amber-500",
      medium: "from-blue-500 to-cyan-500",
      low: "from-green-500 to-emerald-500"
    };
    return colors[urgency] || colors.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      health: "🏥",
      family: "👨‍👩‍👧‍👦",
      financial: "💰",
      spiritual: "✨",
      other: "🙏"
    };
    return icons[category] || icons.other;
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Prayer Wall</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Share your prayer needs and support others in faith
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                {prayers.length} Requests
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                {answeredPrayers.length} Answered
              </Badge>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center mb-8">
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 font-bold text-lg px-8">
                  <Plus className="w-5 h-5 mr-2" />
                  Submit Prayer Request
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Submit Prayer Request</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Our community is here to pray for you
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label className="text-white mb-2 block">Title *</Label>
                    <Input
                      placeholder="Brief summary of your request..."
                      value={prayerForm.title}
                      onChange={(e) => setPrayerForm({...prayerForm, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Request Details *</Label>
                    <Textarea
                      placeholder="Share more about your prayer need..."
                      value={prayerForm.description}
                      onChange={(e) => setPrayerForm({...prayerForm, description: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-32"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Category</Label>
                      <select
                        value={prayerForm.category}
                        onChange={(e) => setPrayerForm({...prayerForm, category: e.target.value})}
                        className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                      >
                        <option value="health">🏥 Health</option>
                        <option value="family">👨‍👩‍👧‍👦 Family</option>
                        <option value="financial">💰 Financial</option>
                        <option value="spiritual">✨ Spiritual</option>
                        <option value="other">🙏 Other</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-white mb-2 block">Urgency</Label>
                      <select
                        value={prayerForm.urgency}
                        onChange={(e) => setPrayerForm({...prayerForm, urgency: e.target.value})}
                        className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={prayerForm.is_anonymous}
                      onChange={(e) => setPrayerForm({...prayerForm, is_anonymous: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="anonymous" className="text-white text-sm">
                      Post anonymously
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createPrayerMutation.isPending} className="bg-pink-500 hover:bg-pink-600">
                    {createPrayerMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700 w-full justify-center">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Prayers</TabsTrigger>
            <TabsTrigger value="urgent" className="data-[state=active]:bg-red-500">
              <AlertCircle className="w-4 h-4 mr-2" />
              Urgent
            </TabsTrigger>
            <TabsTrigger value="answered" className="data-[state=active]:bg-green-500">
              <CheckCircle className="w-4 h-4 mr-2" />
              Answered
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            {urgentPrayers.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
                  Urgent Prayer Requests
                </h3>
                <div className="space-y-4">
                  {urgentPrayers.map((prayer) => (
                    <motion.div
                      key={prayer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border-2 border-red-500/30">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{getCategoryIcon(prayer.category)}</span>
                              <div>
                                <h4 className="text-white font-bold text-lg">{prayer.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                  <span>{prayer.requester_name}</span>
                                  <span>•</span>
                                  <span>{format(new Date(prayer.created_date), 'MMM d')}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-red-500 animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              URGENT
                            </Badge>
                          </div>
                          <p className="text-slate-300 mb-4">{prayer.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-slate-400 text-sm">
                              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                              {prayer.prayer_count || 0} people praying
                            </div>
                            <Button
                              onClick={() => prayForRequestMutation.mutate(prayer.id)}
                              disabled={prayForRequestMutation.isPending}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              <Heart className="w-4 h-4 mr-2" />
                              Pray Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-white font-bold text-xl mb-4">Open Requests</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {openPrayers.map((prayer) => (
                  <Card key={prayer.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getUrgencyColor(prayer.urgency)} flex items-center justify-center text-2xl`}>
                          {getCategoryIcon(prayer.category)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold mb-1">{prayer.title}</h4>
                          <p className="text-xs text-slate-400">
                            {prayer.requester_name} • {format(new Date(prayer.created_date), 'MMM d')}
                          </p>
                        </div>
                        <Badge className={`capitalize ${
                          prayer.urgency === 'high' ? 'bg-orange-500' :
                          prayer.urgency === 'medium' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}>
                          {prayer.urgency}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-3">{prayer.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Heart className="w-4 h-4 text-pink-400" />
                          {prayer.prayer_count || 0} praying
                        </span>
                        <Button
                          onClick={() => prayForRequestMutation.mutate(prayer.id)}
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600"
                        >
                          Pray
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="urgent" className="mt-6">
            <div className="space-y-4">
              {urgentPrayers.map((prayer) => (
                <Card key={prayer.id} className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border-2 border-red-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">{prayer.title}</h4>
                        <p className="text-sm text-slate-300">{prayer.requester_name}</p>
                      </div>
                      <Badge className="bg-red-500 animate-pulse">URGENT</Badge>
                    </div>
                    <p className="text-slate-300 mb-4">{prayer.description}</p>
                    <Button onClick={() => prayForRequestMutation.mutate(prayer.id)} className="bg-red-500 hover:bg-red-600">
                      <Heart className="w-4 h-4 mr-2" />
                      Pray Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="answered" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {answeredPrayers.map((prayer) => (
                <Card key={prayer.id} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-white font-bold text-lg">{prayer.title}</h4>
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Answered
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{prayer.description}</p>
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>{prayer.prayer_count || 0} people prayed</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}