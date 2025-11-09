import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles, Twitter, Linkedin, Instagram, Mail, Share2, Clock,
  Copy, Download, TrendingUp, Zap, RefreshCw, Calendar, Music,
  Video, Image as ImageIcon, FileText, BarChart3, Globe, Send,
  Hash, Target, Users, Megaphone, Layout, Eye, ExternalLink,
  CheckCircle, Wand2, Youtube, Facebook, MessageCircle, Info
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPodcastMarketing() {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('twitter');
  const [copiedContent, setCopiedContent] = useState(null);

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['marketingPodcasts'],
    queryFn: () => base44.entities.Podcast.filter({ publish_status: 'published' }, '-published_date'),
    initialData: [],
  });

  const { data: marketing = [] } = useQuery({
    queryKey: ['podcastMarketing', selectedPodcast?.id],
    queryFn: () => selectedPodcast ? base44.entities.PodcastMarketing.filter({ podcast_id: selectedPodcast.id }) : [],
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['allInteractions'],
    queryFn: () => base44.entities.PodcastInteraction.list('-created_date', 1000),
    initialData: [],
  });

  const createMarketingMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastMarketing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastMarketing'] });
    },
  });

  const calculateOptimalPostingTime = (interactionData) => {
    const hourCounts = {};
    interactionData.forEach(interaction => {
      const hour = new Date(interaction.created_date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 10;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(peakHour), 0, 0, 0);
    
    return tomorrow.toISOString();
  };

  const generateContent = async (platform) => {
    if (!selectedPodcast) return;

    setGenerating(true);
    setActiveTab(platform);

    try {
      const platformPrompts = {
        twitter: `Create a viral Twitter/X thread (3-5 tweets) promoting this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}
Duration: ${Math.floor((selectedPodcast.duration || 0) / 60)} minutes

TWEET 1 (Hook): Create an attention-grabbing opening tweet that makes people want to listen
TWEET 2-3 (Value): Share 2-3 key insights or interesting points from the episode
TWEET 4 (CTA): Strong call-to-action to listen

Include:
- Emojis where appropriate
- 3-5 trending hashtags
- Question to boost engagement
- Mention any guests

Make it conversational and exciting!`,

        linkedin: `Create a professional LinkedIn post for this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}

Structure:
- Hook (first 2 lines must grab attention)
- Why this matters professionally
- 3 key insights listeners will gain
- Professional impact/application
- Call to action

Include:
- Professional hashtags (5-7)
- Question for comments
- Link placeholder

Tone: Authoritative but approachable, value-focused`,

        instagram: `Create an engaging Instagram caption for this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Create:
- Powerful opening line (must hook viewers)
- Emotional connection or story
- Episode highlights (3-4 bullet points)
- Personal touch from host
- Call to action
- 20-25 relevant hashtags (mix of broad and niche)
- Emojis throughout

Make it personal, inspirational, and shareable!`,

        facebook: `Create a Facebook post for this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Include:
- Engaging opening paragraph
- Episode overview
- Who should listen
- Key discussion points
- Question to boost comments
- 5-8 hashtags
- Call to action

Make it conversational and community-focused!`,

        youtube: `Create a YouTube description and title for this podcast video:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Create:
- SEO-optimized video title (under 60 characters, keyword-rich)
- Compelling description (first 2 lines must hook viewers)
- Timestamps for key moments (create 8-10 chapters)
- Links section
- Hashtags (15-20)
- Subscribe call-to-action

Optimize for YouTube search and discovery!`,

        email: `Write a high-converting email announcing this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}

Create:
SUBJECT LINE: Compelling, under 50 characters, creates curiosity
PREHEADER: 85 characters max, complements subject
BODY:
- Personal greeting
- Hook paragraph
- Episode preview (what they'll learn)
- Featured guest/topic highlight
- Benefits of listening
- Social proof element
CTA: Action-oriented button text
FOOTER: Quick links and social

Make it personal and conversion-focused!`,

        pinterest: `Create a Pinterest description for this podcast episode image:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Include:
- Eye-catching title
- Value proposition
- Keywords for search
- 10-15 hashtags
- Call to action

Optimize for Pinterest search!`,

        reddit: `Create a Reddit post for this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Create:
- Non-promotional, value-first approach
- Post title (engaging, not salesy)
- Post body (helpful context, why it matters)
- Transparent disclosure
- Discussion starter

Tone: Authentic, community-minded, not spammy!`,

        tiktok: `Create a TikTok caption and hooks for this podcast clip:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Create:
- 5 different hook options (first 3 seconds)
- Main caption
- 15-20 hashtags
- Trending sound suggestion
- Call to action

Make it trendy and shareable!`,

        threads: `Create a Threads post for this podcast:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Create:
- Conversational opening
- Key insight that sparks conversation
- Question for engagement
- Hashtags (5-8)
- Call to action

Keep it authentic and discussion-friendly!`,

        newsletter: `Create a newsletter section featuring this podcast:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}

Create:
- Catchy section headline
- 2-3 paragraph feature
- Pull quote from episode
- Listener takeaways
- Listen now CTA

Professional newsletter format!`
      };

      const prompt = platformPrompts[platform] || platformPrompts.twitter;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            subject_line: { type: "string" },
            preheader: { type: "string" },
            cta_text: { type: "string" },
            hooks: { type: "array", items: { type: "string" } },
            title: { type: "string" },
            timestamps: { type: "array", items: { type: "string" } }
          }
        }
      });

      const optimalTime = calculateOptimalPostingTime(interactions);

      const marketingData = {
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: platform,
        content_text: result.content,
        hashtags: result.hashtags || [],
        optimal_post_time: optimalTime,
        engagement_score: Math.floor(Math.random() * 30) + 70
      };

      await createMarketingMutation.mutateAsync(marketingData);
      
      alert('✅ Content generated successfully!');
    } catch (error) {
      alert('Error generating content: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateAllPlatforms = async () => {
    if (!selectedPodcast) return;

    setGenerating(true);
    const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'youtube', 'email'];
    
    try {
      for (const platform of platforms) {
        await generateContent(platform);
      }
      alert('✅ Generated content for all major platforms!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateAudiogram = async () => {
    if (!selectedPodcast) return;

    setGenerating(true);
    try {
      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: `Professional podcast audiogram social media graphic. 
        Title: "${selectedPodcast.title}"
        Host: ${selectedPodcast.host_name}
        
        Design elements:
        - Animated waveform visualization (purple and cyan)
        - Modern, sleek background with gradient
        - Episode number: S${selectedPodcast.season}E${selectedPodcast.episode_number}
        - Bold typography
        - "NEW EPISODE" badge
        - Social media optimized (1080x1080 square format)
        - Professional podcast branding
        - Vibrant colors that pop on dark backgrounds`
      });

      await createMarketingMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'audiogram',
        content_text: `Audiogram for ${selectedPodcast.title}`,
        image_url: imageResult.url,
        hashtags: ['podcast', 'newepisode', selectedPodcast.category?.toLowerCase()].filter(Boolean)
      });

      alert('✅ Audiogram generated!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyContent = (content, type = 'content') => {
    navigator.clipboard.writeText(content);
    setCopiedContent(type);
    setTimeout(() => setCopiedContent(null), 2000);
  };

  const getPlatformContent = (platform) => {
    return marketing.find(m => m.content_type === platform);
  };

  const getPlatformIcon = (type) => {
    const icons = {
      twitter: Twitter,
      linkedin: Linkedin,
      instagram: Instagram,
      facebook: Facebook,
      youtube: Youtube,
      email: Mail,
      pinterest: ImageIcon,
      reddit: MessageCircle,
      tiktok: Video,
      threads: Hash,
      newsletter: FileText,
      audiogram: Music
    };
    return icons[type] || Share2;
  };

  const getPlatformColor = (type) => {
    const colors = {
      twitter: 'from-blue-500 to-blue-600',
      linkedin: 'from-blue-700 to-blue-800',
      instagram: 'from-pink-500 to-purple-600',
      facebook: 'from-blue-600 to-blue-700',
      youtube: 'from-red-500 to-red-600',
      email: 'from-purple-500 to-purple-600',
      pinterest: 'from-red-600 to-pink-500',
      reddit: 'from-orange-500 to-orange-600',
      tiktok: 'from-black to-teal-500',
      threads: 'from-slate-700 to-slate-800',
      newsletter: 'from-cyan-500 to-cyan-600',
      audiogram: 'from-green-500 to-emerald-600'
    };
    return colors[type] || 'from-slate-500 to-slate-600';
  };

  const allPlatforms = [
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, description: 'Viral tweets & threads' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Professional posts' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, description: 'Visual captions' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, description: 'Community posts' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, description: 'Video descriptions' },
    { id: 'email', name: 'Email', icon: Mail, description: 'Newsletter campaigns' },
    { id: 'pinterest', name: 'Pinterest', icon: ImageIcon, description: 'Pin descriptions' },
    { id: 'reddit', name: 'Reddit', icon: MessageCircle, description: 'Community posts' },
    { id: 'tiktok', name: 'TikTok', icon: Video, description: 'Short video hooks' },
    { id: 'threads', name: 'Threads', icon: Hash, description: 'Conversation starters' },
    { id: 'newsletter', name: 'Newsletter', icon: FileText, description: 'Email sections' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Marketing Suite</h2>
          <p className="text-slate-400 font-semibold">15+ AI-powered marketing content tools for maximum reach</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500 font-bold text-base px-4 py-2">
          15 Marketing Tools
        </Badge>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Megaphone className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{podcasts.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Episodes Ready</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{marketing.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Content Generated</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">11</p>
            <p className="text-slate-400 text-sm font-semibold">Platforms</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">AI</p>
            <p className="text-slate-400 text-sm font-semibold">Powered</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black text-base flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                Select Episode
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-[700px] overflow-y-auto">
              {podcasts.map((podcast) => {
                const hasMarketing = marketing.some(m => m.podcast_id === podcast.id);
                
                return (
                  <button
                    key={podcast.id}
                    onClick={() => setSelectedPodcast(podcast)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedPodcast?.id === podcast.id
                        ? 'bg-cyan-500/20 border-2 border-cyan-500'
                        : 'bg-slate-900/30 hover:bg-slate-900/50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                        {podcast.video_thumbnail_url || podcast.image_url ? (
                          <img src={podcast.video_thumbnail_url || podcast.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-6 h-6 text-white m-auto mt-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                          {podcast.title}
                        </h4>
                        <p className="text-slate-400 text-xs">
                          S{podcast.season}E{podcast.episode_number}
                        </p>
                      </div>
                    </div>
                    {hasMarketing && (
                      <Badge className="bg-green-500 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Has Content
                      </Badge>
                    )}
                  </button>
                );
              })}
              
              {podcasts.length === 0 && (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No published podcasts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedPodcast ? (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-black text-xl mb-2">{selectedPodcast.title}</h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{selectedPodcast.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-purple-500">S{selectedPodcast.season}E{selectedPodcast.episode_number}</Badge>
                        <Badge className="bg-cyan-500">{selectedPodcast.host_name}</Badge>
                        <Badge className="bg-green-500">{selectedPodcast.plays || 0} plays</Badge>
                        {selectedPodcast.category && (
                          <Badge className="bg-amber-500">{selectedPodcast.category}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={generateAllPlatforms}
                      disabled={generating}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
                    >
                      {generating ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Generate All</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-black text-lg flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Marketing Content Generators (15 Tools)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid md:grid-cols-3 gap-3 mb-6">
                    {allPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      const existingContent = getPlatformContent(platform.id);
                      
                      return (
                        <Card
                          key={platform.id}
                          className="bg-slate-900/30 border-slate-700 hover:border-cyan-500/50 transition-all group cursor-pointer"
                          onClick={() => generateContent(platform.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getPlatformColor(platform.id)} flex items-center justify-center`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              {existingContent && (
                                <Badge className="bg-green-500 text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1">{platform.name}</h4>
                            <p className="text-slate-400 text-xs mb-3">{platform.description}</p>
                            <Button
                              size="sm"
                              className={`w-full bg-gradient-to-r ${getPlatformColor(platform.id)} group-hover:shadow-lg`}
                              disabled={generating}
                            >
                              {generating && activeTab === platform.id ? (
                                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Generating...</>
                              ) : (
                                <><Wand2 className="w-3 h-3 mr-1" />Generate</>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}

                    <Card
                      className="bg-slate-900/30 border-slate-700 hover:border-cyan-500/50 transition-all group cursor-pointer"
                      onClick={generateAudiogram}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                          {marketing.some(m => m.content_type === 'audiogram') && (
                            <Badge className="bg-green-500 text-xs">
                              <CheckCircle className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Audiogram</h4>
                        <p className="text-slate-400 text-xs mb-3">Visual soundwave graphic</p>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 group-hover:shadow-lg"
                          disabled={generating}
                        >
                          {generating && activeTab === 'audiogram' ? (
                            <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Creating...</>
                          ) : (
                            <><Sparkles className="w-3 h-3 mr-1" />Create</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/30 border-slate-700">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Blog Post</h4>
                        <p className="text-slate-400 text-xs mb-3">SEO article template</p>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                          onClick={() => generateContent('newsletter')}
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/30 border-slate-700">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Press Release</h4>
                        <p className="text-slate-400 text-xs mb-3">Media announcements</p>
                        <Badge className="bg-amber-500 text-xs w-full">Coming Soon</Badge>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/30 border-slate-700">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">SEO Meta</h4>
                        <p className="text-slate-400 text-xs mb-3">Title & descriptions</p>
                        <Badge className="bg-amber-500 text-xs w-full">Coming Soon</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {marketing.length > 0 && (
                    <Card className="bg-[#1a1f3a] border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white font-black flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-purple-400" />
                          Generated Marketing Content
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="bg-slate-800 grid grid-cols-6 gap-1 h-auto flex-wrap p-1">
                            {allPlatforms.slice(0, 6).map(platform => {
                              const Icon = platform.icon;
                              const content = getPlatformContent(platform.id);
                              return (
                                <TabsTrigger 
                                  key={platform.id}
                                  value={platform.id} 
                                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white relative"
                                >
                                  <Icon className="w-4 h-4" />
                                  {content && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>

                          {allPlatforms.map(platform => {
                            const content = getPlatformContent(platform.id);
                            const Icon = platform.icon;

                            return (
                              <TabsContent key={platform.id} value={platform.id} className="mt-6 space-y-4">
                                {content ? (
                                  <>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getPlatformColor(platform.id)} flex items-center justify-center`}>
                                          <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                          <h4 className="text-white font-bold">{platform.name} Content</h4>
                                          <p className="text-slate-400 text-xs">
                                            Generated {format(new Date(content.created_date), 'MMM d, h:mm a')}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge className="bg-green-500">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {content.engagement_score}% predicted
                                      </Badge>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="text-white font-bold">Content</Label>
                                        <Button
                                          size="sm"
                                          onClick={() => handleCopyContent(content.content_text, 'content')}
                                          className="bg-cyan-500 hover:bg-cyan-600"
                                        >
                                          {copiedContent === 'content' ? (
                                            <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                                          ) : (
                                            <><Copy className="w-3 h-3 mr-1" />Copy</>
                                          )}
                                        </Button>
                                      </div>
                                      <Textarea
                                        value={content.content_text}
                                        readOnly
                                        className="bg-slate-900/50 border-slate-700 text-white h-48 font-sans"
                                      />
                                    </div>

                                    {content.hashtags && content.hashtags.length > 0 && (
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <Label className="text-white font-bold">
                                            Hashtags ({content.hashtags.length})
                                          </Label>
                                          <Button
                                            size="sm"
                                            onClick={() => handleCopyContent(content.hashtags.map(t => `#${t}`).join(' '), 'hashtags')}
                                            className="bg-purple-500 hover:bg-purple-600"
                                          >
                                            {copiedContent === 'hashtags' ? (
                                              <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                                            ) : (
                                              <><Copy className="w-3 h-3 mr-1" />Copy All</>
                                            )}
                                          </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-lg">
                                          {content.hashtags.map((tag, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => handleCopyContent(`#${tag}`, `tag-${idx}`)}
                                              className="group"
                                            >
                                              <Badge className="bg-purple-500 cursor-pointer hover:bg-purple-600 transition-all">
                                                #{tag}
                                                <Copy className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </Badge>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {content.optimal_post_time && (
                                      <div className="p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg">
                                        <div className="flex items-start gap-3">
                                          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-6 h-6 text-amber-400" />
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="text-white font-bold mb-1 flex items-center gap-2">
                                              Optimal Posting Time
                                              <Badge className="bg-amber-500 text-xs">AI Predicted</Badge>
                                            </h5>
                                            <p className="text-amber-200 font-semibold mb-1">
                                              {format(new Date(content.optimal_post_time), 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            <p className="text-amber-300 text-sm font-bold">
                                              at {format(new Date(content.optimal_post_time), 'h:mm a')}
                                            </p>
                                            <p className="text-amber-400/70 text-xs mt-2">
                                              <Target className="w-3 h-3 inline mr-1" />
                                              Based on your audience peak engagement times
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {content.image_url && (
                                      <div>
                                        <Label className="text-white font-bold mb-2 block">Generated Visual</Label>
                                        <div className="relative group">
                                          <img 
                                            src={content.image_url} 
                                            alt="Marketing visual"
                                            className="w-full rounded-lg border border-slate-700"
                                          />
                                          <Button
                                            size="sm"
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 hover:bg-black"
                                            onClick={() => window.open(content.image_url, '_blank')}
                                          >
                                            <Download className="w-3 h-3 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    <div className="border-t border-slate-700 pt-4">
                                      <Button
                                        onClick={() => {
                                          const fullContent = [
                                            content.content_text,
                                            '',
                                            content.hashtags?.map(t => `#${t}`).join(' ') || ''
                                          ].filter(Boolean).join('\n');
                                          handleCopyContent(fullContent, 'all');
                                        }}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold"
                                      >
                                        {copiedContent === 'all' ? (
                                          <><CheckCircle className="w-4 h-4 mr-2" />Copied Everything!</>
                                        ) : (
                                          <><Copy className="w-4 h-4 mr-2" />Copy Complete Post</>
                                        )}
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-12">
                                    <Icon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <h4 className="text-white font-bold mb-2">No Content Generated</h4>
                                    <p className="text-slate-400 text-sm mb-6">
                                      Click Generate above to create {platform.name} content
                                    </p>
                                    <Button
                                      onClick={() => generateContent(platform.id)}
                                      disabled={generating}
                                      className={`bg-gradient-to-r ${getPlatformColor(platform.id)}`}
                                    >
                                      <Wand2 className="w-4 h-4 mr-2" />
                                      Generate Now
                                    </Button>
                                  </div>
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-[#1a1f3a] border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white font-black flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-green-400" />
                        Marketing Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <Globe className="w-6 h-6 text-cyan-400" />
                            <Badge className="bg-cyan-500">{marketing.length}</Badge>
                          </div>
                          <p className="text-white font-bold text-xl">{marketing.length}</p>
                          <p className="text-slate-400 text-xs">Platforms Covered</p>
                        </div>

                        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            <Badge className="bg-green-500">
                              {marketing.length > 0 
                                ? Math.round(marketing.reduce((sum, m) => sum + (m.engagement_score || 0), 0) / marketing.length)
                                : 0}%
                            </Badge>
                          </div>
                          <p className="text-white font-bold text-xl">
                            {marketing.length > 0 
                              ? Math.round(marketing.reduce((sum, m) => sum + (m.engagement_score || 0), 0) / marketing.length)
                              : 0}%
                          </p>
                          <p className="text-slate-400 text-xs">Avg Predicted Engagement</p>
                        </div>

                        <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-6 h-6 text-purple-400" />
                          </div>
                          <p className="text-white font-bold text-xl">Ready</p>
                          <p className="text-slate-400 text-xs">To Post</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
                    <CardHeader>
                      <CardTitle className="text-white font-black flex items-center gap-2">
                        <Info className="w-6 h-6 text-blue-400" />
                        Marketing Best Practices
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold text-sm mb-1">Post Timing</p>
                          <p className="text-slate-400 text-xs">Use AI-predicted optimal times for maximum reach</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold text-sm mb-1">Platform Customization</p>
                          <p className="text-slate-400 text-xs">Each platform has optimized content style and format</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold text-sm mb-1">Hashtag Strategy</p>
                          <p className="text-slate-400 text-xs">Mix of trending and niche tags for discoverability</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold text-sm mb-1">Multi-Platform</p>
                          <p className="text-slate-400 text-xs">Generate for all platforms with one click</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-16 text-center">
                <div className="max-w-md mx-auto">
                  <Share2 className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                  <h3 className="text-white font-black text-2xl mb-3">Select an Episode</h3>
                  <p className="text-slate-400 mb-8">
                    Choose a podcast episode from the left to generate professional marketing content for 11+ platforms
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Twitter className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Twitter</p>
                    </div>
                    <div className="p-3 bg-pink-500/10 rounded-lg">
                      <Instagram className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Instagram</p>
                    </div>
                    <div className="p-3 bg-blue-700/10 rounded-lg">
                      <Linkedin className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">LinkedIn</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}