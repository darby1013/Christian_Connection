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
import { Slider } from "@/components/ui/slider";
import {
  Scissors, Sparkles, Share2, Download, Copy, Instagram,
  Twitter, Facebook, Zap, Clock, TrendingUp, Hash
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

export default function PodcastClipStudio() {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [clipDialogOpen, setClipDialogOpen] = useState(false);
  const [socialPostDialogOpen, setSocialPostDialogOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);
  const [clipForm, setClipForm] = useState({
    title: '',
    start_time: 0,
    end_time: 30,
    platform: 'instagram'
  });

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-created_date', 50),
    initialData: [],
  });

  const { data: clips = [] } = useQuery({
    queryKey: ['clips'],
    queryFn: () => base44.entities.PodcastClip.list('-created_date'),
    initialData: [],
  });

  const { data: showNotes = [] } = useQuery({
    queryKey: ['showNotes'],
    queryFn: () => base44.entities.PodcastShowNote.list(),
    initialData: [],
  });

  const createClipMutation = useMutation({
    mutationFn: async (clipData) => {
      const podcast = podcasts.find(p => p.id === selectedPodcast);
      const duration = clipData.end_time - clipData.start_time;
      
      return base44.entities.PodcastClip.create({
        ...clipData,
        podcast_id: selectedPodcast,
        duration,
        clip_url: `${podcast.audio_url}#t=${clipData.start_time},${clipData.end_time}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      setClipDialogOpen(false);
      setClipForm({ title: '', start_time: 0, end_time: 30, platform: 'instagram' });
    },
  });

  const createTeaserMutation = useMutation({
    mutationFn: async (clipId) => {
      const clip = clips.find(c => c.id === clipId);
      const teaserDuration = 15; // 15 seconds teaser
      
      return base44.entities.PodcastClip.create({
        podcast_id: clip.podcast_id,
        title: `${clip.title} - Teaser`,
        start_time: clip.start_time,
        end_time: clip.start_time + teaserDuration,
        duration: teaserDuration,
        platform: 'tiktok',
        clip_url: `${clip.clip_url}#teaser`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] });
    },
  });

  const generateSocialPostMutation = useMutation({
    mutationFn: async ({ clipId, platform }) => {
      const clip = clips.find(c => c.id === clipId);
      const podcast = podcasts.find(p => p.id === clip.podcast_id);
      const showNote = showNotes.find(s => s.podcast_id === clip.podcast_id);
      
      // Use AI to generate platform-specific social media post
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging social media post for ${platform} promoting this podcast clip:

Podcast: ${podcast.title}
Description: ${podcast.description}
Clip: ${clip.title}
Duration: ${clip.duration}s
Show Notes: ${showNote?.summary || 'N/A'}

Generate a JSON response with:
1. An engaging caption (optimized for ${platform})
2. 8-12 relevant hashtags
3. A call-to-action
4. 3-5 relevant emojis
5. Character count

Make it compelling, authentic, and optimized for ${platform}'s audience.`,
        response_json_schema: {
          type: "object",
          properties: {
            caption: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            call_to_action: { type: "string" },
            emoji_set: { type: "array", items: { type: "string" } },
            character_count: { type: "number" }
          }
        }
      });

      return base44.entities.PodcastSocialPost.create({
        clip_id: clipId,
        podcast_id: clip.podcast_id,
        platform,
        ...result,
        optimal_post_time: platform === 'instagram' ? '7:00 PM' : '12:00 PM'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.PodcastSocialPost.list('-created_date'),
    initialData: [],
  });

  const handleCreateClip = () => {
    if (!selectedPodcast || !clipForm.title.trim()) {
      alert('Please select a podcast and enter a clip title');
      return;
    }
    createClipMutation.mutate(clipForm);
  };

  const handleGenerateSocialPosts = async (clipId) => {
    const platforms = ['instagram', 'twitter', 'facebook', 'tiktok'];
    for (const platform of platforms) {
      await generateSocialPostMutation.mutateAsync({ clipId, platform });
    }
    setSocialPostDialogOpen(true);
    setSelectedClip(clipId);
  };

  const clipsByPodcast = selectedPodcast 
    ? clips.filter(c => c.podcast_id === selectedPodcast)
    : [];

  const getPlatformIcon = (platform) => {
    const icons = {
      instagram: Instagram,
      twitter: Twitter,
      facebook: Facebook
    };
    return icons[platform] || Share2;
  };

  const getPlatformColor = (platform) => {
    const colors = {
      instagram: "from-pink-500 to-purple-500",
      twitter: "from-blue-400 to-cyan-500",
      facebook: "from-blue-600 to-blue-800",
      tiktok: "from-black to-cyan-500",
      linkedin: "from-blue-700 to-blue-900"
    };
    return colors[platform] || "from-slate-600 to-slate-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Clip Studio</h2>
          <p className="text-slate-400 font-semibold">Create viral clips with AI-powered captions</p>
        </div>
        <Button 
          onClick={() => setClipDialogOpen(true)}
          className="bg-purple-500 hover:bg-purple-600 font-bold"
        >
          <Scissors className="w-4 h-4 mr-2" />
          Create Clip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Total Clips</p>
                <p className="text-3xl font-black text-white">{clips.length}</p>
              </div>
              <Scissors className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Social Posts</p>
                <p className="text-3xl font-black text-white">{socialPosts.length}</p>
              </div>
              <Share2 className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Total Views</p>
                <p className="text-3xl font-black text-white">
                  {clips.reduce((sum, c) => sum + (c.views || 0), 0)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Total Shares</p>
                <p className="text-3xl font-black text-white">
                  {clips.reduce((sum, c) => sum + (c.shares || 0), 0)}
                </p>
              </div>
              <Share2 className="w-12 h-12 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Podcast Selector */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <Label className="text-white mb-3 block font-bold">Select Podcast</Label>
          <div className="grid md:grid-cols-3 gap-3">
            {podcasts.slice(0, 6).map((podcast) => (
              <button
                key={podcast.id}
                onClick={() => setSelectedPodcast(podcast.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedPodcast === podcast.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                }`}
              >
                <p className="text-white font-bold text-sm mb-1">{podcast.title}</p>
                <p className="text-slate-400 text-xs">{clipsByPodcast.length} clips</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clips Grid */}
      {selectedPodcast && (
        <div>
          <h3 className="text-white font-bold text-xl mb-4">Clips for this Podcast</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clipsByPodcast.map((clip) => {
              const clipPosts = socialPosts.filter(sp => sp.clip_id === clip.id);
              const Icon = getPlatformIcon(clip.platform);
              
              return (
                <Card key={clip.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className={`aspect-video bg-gradient-to-br ${getPlatformColor(clip.platform)} rounded-lg mb-3 flex items-center justify-center`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    
                    <h4 className="text-white font-bold mb-2">{clip.title}</h4>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {clip.duration}s
                      </span>
                      <Badge className="capitalize bg-slate-700">{clip.platform}</Badge>
                    </div>

                    {clipPosts.length > 0 && (
                      <div className="mb-4">
                        <p className="text-slate-400 text-xs mb-2">Social Posts Generated:</p>
                        <div className="flex gap-1">
                          {clipPosts.map((post) => {
                            const PlatformIcon = getPlatformIcon(post.platform);
                            return (
                              <Badge key={post.id} className="bg-slate-700 text-xs">
                                <PlatformIcon className="w-3 h-3 mr-1" />
                                {post.platform}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => handleGenerateSocialPosts(clip.id)}
                        disabled={generateSocialPostMutation.isPending}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Generate Posts
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-slate-700"
                          onClick={() => createTeaserMutation.mutate(clip.id)}
                          disabled={createTeaserMutation.isPending}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Teaser
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-slate-700"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Clip Dialog */}
      <Dialog open={clipDialogOpen} onOpenChange={setClipDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Create New Clip</DialogTitle>
            <DialogDescription className="text-slate-400">
              Extract a clip from your podcast
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-white mb-2 block">Clip Title *</Label>
              <Input
                placeholder="e.g., Faith & Community Highlight"
                value={clipForm.title}
                onChange={(e) => setClipForm({...clipForm, title: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-white mb-2 block">Start Time (seconds)</Label>
              <Slider
                value={[clipForm.start_time]}
                onValueChange={([value]) => setClipForm({...clipForm, start_time: value})}
                max={300}
                step={1}
                className="mb-2"
              />
              <p className="text-slate-400 text-sm">{clipForm.start_time}s</p>
            </div>
            
            <div>
              <Label className="text-white mb-2 block">End Time (seconds)</Label>
              <Slider
                value={[clipForm.end_time]}
                onValueChange={([value]) => setClipForm({...clipForm, end_time: value})}
                max={300}
                step={1}
                className="mb-2"
              />
              <p className="text-slate-400 text-sm">{clipForm.end_time}s</p>
            </div>
            
            <div>
              <Label className="text-white mb-2 block">Target Platform</Label>
              <select
                value={clipForm.platform}
                onChange={(e) => setClipForm({...clipForm, platform: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="instagram">Instagram (60s)</option>
                <option value="twitter">Twitter (140s)</option>
                <option value="tiktok">TikTok (60s)</option>
                <option value="youtube_shorts">YouTube Shorts (60s)</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-300 font-semibold mb-1">Clip Duration</p>
              <p className="text-white text-2xl font-black">{clipForm.end_time - clipForm.start_time}s</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClipDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateClip}
              disabled={createClipMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {createClipMutation.isPending ? 'Creating...' : 'Create Clip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Posts View Dialog */}
      <Dialog open={socialPostDialogOpen} onOpenChange={setSocialPostDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl">Generated Social Posts</DialogTitle>
            <DialogDescription className="text-slate-400">
              AI-generated captions and hashtags for all platforms
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {socialPosts
              .filter(sp => sp.clip_id === selectedClip)
              .map((post) => {
                const Icon = getPlatformIcon(post.platform);
                return (
                  <Card key={post.id} className={`bg-gradient-to-r ${getPlatformColor(post.platform)} bg-opacity-10 border-0`}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Icon className="w-8 h-8 text-white" />
                        <div>
                          <h4 className="text-white font-bold capitalize">{post.platform}</h4>
                          <p className="text-slate-300 text-sm">Best time: {post.optimal_post_time}</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-lg p-4 mb-3">
                        <p className="text-white mb-3">{post.caption}</p>
                        <p className="text-slate-400 text-sm mb-2">{post.call_to_action}</p>
                        <div className="flex flex-wrap gap-1">
                          {post.emoji_set?.map((emoji, i) => (
                            <span key={i} className="text-xl">{emoji}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-slate-400 text-xs font-semibold mb-2">Hashtags:</p>
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags?.map((tag, i) => (
                            <Badge key={i} className="bg-blue-500/20 text-blue-300">
                              <Hash className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{post.character_count} characters</span>
                        <Button size="sm" className="bg-slate-700 hover:bg-slate-600">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}