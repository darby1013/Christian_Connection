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
  Star, Plus, Heart, Share2, Play, Sparkles, TrendingUp, Search
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

export default function Testimonies() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [testimonyForm, setTestimonyForm] = useState({
    title: '',
    story: '',
    category: 'other'
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

  const { data: testimonies = [] } = useQuery({
    queryKey: ['testimonies'],
    queryFn: () => base44.entities.Testimony.filter({ is_approved: true }, '-created_date'),
    initialData: [],
  });

  const createTestimonyMutation = useMutation({
    mutationFn: (testimonyData) => base44.entities.Testimony.create({
      ...testimonyData,
      author_id: user.id,
      author_name: user.full_name,
      author_image: user.profile_image,
      is_approved: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
      setDialogOpen(false);
      setTestimonyForm({ title: '', story: '', category: 'other' });
    },
  });

  const likeTestimonyMutation = useMutation({
    mutationFn: async (testimonyId) => {
      const testimony = testimonies.find(t => t.id === testimonyId);
      return base44.entities.Testimony.update(testimonyId, {
        likes: (testimony.likes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
    },
  });

  const shareTestimonyMutation = useMutation({
    mutationFn: async (testimonyId) => {
      const testimony = testimonies.find(t => t.id === testimonyId);
      return base44.entities.Testimony.update(testimonyId, {
        shares: (testimony.shares || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
    },
  });

  const handleSubmit = () => {
    if (!testimonyForm.title.trim() || !testimonyForm.story.trim()) {
      alert('Please fill in all fields');
      return;
    }
    createTestimonyMutation.mutate(testimonyForm);
  };

  const filteredTestimonies = testimonies.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.story?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredTestimonies = filteredTestimonies.filter(t => t.is_featured);
  const regularTestimonies = filteredTestimonies.filter(t => !t.is_featured);

  const getCategoryColor = (category) => {
    const colors = {
      healing: "from-green-500 to-emerald-500",
      salvation: "from-blue-500 to-cyan-500",
      provision: "from-amber-500 to-orange-500",
      deliverance: "from-purple-500 to-pink-500",
      restoration: "from-indigo-500 to-blue-500",
      other: "from-slate-500 to-gray-500"
    };
    return colors[category] || colors.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      healing: "🙏",
      salvation: "✨",
      provision: "🎁",
      deliverance: "⛓️",
      restoration: "🌟",
      other: "💫"
    };
    return icons[category] || icons.other;
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
              <Star className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Testimonies</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Share and celebrate God's faithfulness through powerful stories
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                {testimonies.length} Stories
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Life-Changing
              </Badge>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search testimonies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
          
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Share Testimony
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-xl">Share Your Testimony</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Your story can inspire and encourage others
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label className="text-white mb-2 block">Title *</Label>
                    <Input
                      placeholder="e.g., Healed from Cancer"
                      value={testimonyForm.title}
                      onChange={(e) => setTestimonyForm({...testimonyForm, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Your Story *</Label>
                    <Textarea
                      placeholder="Share your full testimony..."
                      value={testimonyForm.story}
                      onChange={(e) => setTestimonyForm({...testimonyForm, story: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white h-48"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <select
                      value={testimonyForm.category}
                      onChange={(e) => setTestimonyForm({...testimonyForm, category: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                    >
                      <option value="healing">🙏 Healing</option>
                      <option value="salvation">✨ Salvation</option>
                      <option value="provision">🎁 Provision</option>
                      <option value="deliverance">⛓️ Deliverance</option>
                      <option value="restoration">🌟 Restoration</option>
                      <option value="other">💫 Other</option>
                    </select>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-amber-300 text-sm">
                      ℹ️ Your testimony will be reviewed by our team before being published
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createTestimonyMutation.isPending} className="bg-amber-500 hover:bg-amber-600">
                    {createTestimonyMutation.isPending ? 'Submitting...' : 'Submit Testimony'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Testimonies</TabsTrigger>
            <TabsTrigger value="featured" className="data-[state=active]:bg-cyan-500">
              <Star className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="healing" className="data-[state=active]:bg-cyan-500">Healing</TabsTrigger>
            <TabsTrigger value="salvation" className="data-[state=active]:bg-cyan-500">Salvation</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            {featuredTestimonies.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  Featured Testimonies
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {featuredTestimonies.map((testimony) => (
                    <Card key={testimony.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getCategoryColor(testimony.category)} flex items-center justify-center text-3xl`}>
                            {getCategoryIcon(testimony.category)}
                          </div>
                          <div className="flex-1">
                            <Badge className="bg-amber-500 mb-2">
                              <Star className="w-3 h-3 mr-1 fill-white" />
                              Featured
                            </Badge>
                            <h4 className="text-white font-bold text-xl mb-1">{testimony.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <span>{testimony.author_name}</span>
                              <span>•</span>
                              <span>{format(new Date(testimony.created_date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-slate-300 mb-4 line-clamp-4">{testimony.story}</p>
                        
                        {testimony.video_url && (
                          <div className="mb-4 relative aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => likeTestimonyMutation.mutate(testimony.id)}
                              className="flex items-center gap-1 text-slate-400 hover:text-pink-400 transition-colors"
                            >
                              <Heart className="w-5 h-5" />
                              <span className="text-sm">{testimony.likes || 0}</span>
                            </button>
                            <button
                              onClick={() => shareTestimonyMutation.mutate(testimony.id)}
                              className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                              <Share2 className="w-5 h-5" />
                              <span className="text-sm">{testimony.shares || 0}</span>
                            </button>
                          </div>
                          <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                            Read More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularTestimonies.map((testimony, index) => (
                <motion.div
                  key={testimony.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-[#1a1f3a] border-slate-700 hover:border-amber-500 transition-all h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(testimony.category)} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {getCategoryIcon(testimony.category)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-lg mb-1">{testimony.title}</h4>
                          <p className="text-xs text-slate-400">{testimony.author_name}</p>
                        </div>
                        <Badge className="bg-purple-500 capitalize text-xs">
                          {testimony.category}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-400 text-sm mb-4 line-clamp-3">{testimony.story}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-slate-500">
                          <button
                            onClick={() => likeTestimonyMutation.mutate(testimony.id)}
                            className="flex items-center gap-1 hover:text-pink-400 transition-colors"
                          >
                            <Heart className="w-4 h-4" />
                            {testimony.likes || 0}
                          </button>
                          <button
                            onClick={() => shareTestimonyMutation.mutate(testimony.id)}
                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            {testimony.shares || 0}
                          </button>
                        </div>
                        <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300">
                          Read
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {featuredTestimonies.map((testimony) => (
                <Card key={testimony.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
                  <CardContent className="p-6">
                    <h4 className="text-white font-bold text-xl mb-3">{testimony.title}</h4>
                    <p className="text-slate-300 mb-4">{testimony.story}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600">Read Full Story</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="healing" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {filteredTestimonies.filter(t => t.category === 'healing').map((testimony) => (
                <Card key={testimony.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <h4 className="text-white font-bold mb-2">{testimony.title}</h4>
                    <p className="text-slate-400 text-sm line-clamp-3">{testimony.story}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="salvation" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {filteredTestimonies.filter(t => t.category === 'salvation').map((testimony) => (
                <Card key={testimony.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <h4 className="text-white font-bold mb-2">{testimony.title}</h4>
                    <p className="text-slate-400 text-sm line-clamp-3">{testimony.story}</p>
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