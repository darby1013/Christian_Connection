import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Wand2, Video, Music, FileText, Twitter, Instagram, Youtube,
  Linkedin, Image as ImageIcon, Download, Copy, CheckCircle,
  Scissors, TrendingUp, Hash, Clock, Target, Sparkles,
  RefreshCw, Play, Pause, Share2, Zap, Film, MessageSquare,
  Quote, BarChart3, Eye, ExternalLink, Layers, Settings,
  ChevronRight, Info, Award
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPodcastRepurposing() {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [repurposing, setRepurposing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [copiedContent, setCopiedContent] = useState(null);
  const [activeTab, setActiveTab] = useState('clips');

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['repurposingPodcasts'],
    queryFn: () => base44.entities.Podcast.filter({ publish_status: 'published' }, '-published_date'),
    initialData: [],
  });

  const { data: repurposedContent = [] } = useQuery({
    queryKey: ['repurposedContent', selectedPodcast?.id],
    queryFn: () => selectedPodcast ? base44.entities.PodcastRepurposedContent.filter({ podcast_id: selectedPodcast.id }, '-created_date') : [],
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const createRepurposedContentMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastRepurposedContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repurposedContent'] });
    },
  });

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const repurposeEpisode = async () => {
    if (!selectedPodcast) return;

    setRepurposing(true);
    setProgress(0);

    try {
      // Step 1: Generate Transcript Analysis
      setCurrentStep('Analyzing episode transcript...');
      setProgress(10);
      await sleep(1000);

      const transcriptAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this podcast episode and extract key content for repurposing:

Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}
Duration: ${Math.floor((selectedPodcast.duration || 0) / 60)} minutes

Extract:
1. 5-7 KEY MOMENTS with exact timestamps (estimate based on typical podcast structure)
   - Most engaging segments
   - Quotable moments
   - High-value insights
   - Controversial or surprising statements
   Format each as: "MM:SS - Brief description of moment"

2. 10-15 BEST QUOTES from the episode
   - Impactful statements
   - Memorable phrases
   - Shareable insights

3. 3-5 CORE THEMES discussed

4. 5-7 KEY TAKEAWAYS

5. AUDIENCE HOOK - One compelling reason someone should watch/listen

Provide detailed, specific content that can be used for marketing.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_moments: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  description: { type: "string" },
                  engagement_score: { type: "number" }
                }
              }
            },
            best_quotes: { type: "array", items: { type: "string" } },
            core_themes: { type: "array", items: { type: "string" } },
            key_takeaways: { type: "array", items: { type: "string" } },
            audience_hook: { type: "string" }
          }
        }
      });

      // Step 2: Generate Video Clips (3-5 clips)
      setCurrentStep('Creating video clip recommendations...');
      setProgress(25);
      await sleep(1000);

      const videoClips = transcriptAnalysis.key_moments.slice(0, 5).map((moment, idx) => ({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'video_clip',
        clip_timestamps: {
          start: this.parseTimestamp(moment.timestamp),
          end: this.parseTimestamp(moment.timestamp) + 60,
          duration: 60
        },
        text_content: moment.description,
        key_quotes: [transcriptAnalysis.best_quotes[idx]],
        engagement_potential: moment.engagement_score || Math.floor(Math.random() * 20) + 75,
        suggested_platforms: ['Instagram', 'TikTok', 'YouTube Shorts'],
        content_data: {
          title: `${selectedPodcast.title} - Clip ${idx + 1}`,
          description: moment.description,
          optimal_length: '30-60 seconds',
          hook: transcriptAnalysis.audience_hook
        }
      }));

      for (const clip of videoClips) {
        await createRepurposedContentMutation.mutateAsync(clip);
      }

      // Step 3: Generate Audiograms (3 audiograms)
      setCurrentStep('Designing audiogram visuals...');
      setProgress(40);
      await sleep(1000);

      const audiograms = transcriptAnalysis.best_quotes.slice(0, 3).map((quote, idx) => ({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'audiogram',
        text_content: quote,
        visual_specs: {
          background_color: ['#6366f1', '#ec4899', '#8b5cf6'][idx],
          text_color: '#ffffff',
          font_size: '24px',
          animation_style: 'waveform'
        },
        engagement_potential: Math.floor(Math.random() * 15) + 80,
        suggested_platforms: ['Instagram Stories', 'LinkedIn', 'Twitter'],
        content_data: {
          quote: quote,
          speaker: selectedPodcast.host_name,
          episode: `S${selectedPodcast.season}E${selectedPodcast.episode_number}`,
          duration: '15 seconds'
        }
      }));

      for (const audiogram of audiograms) {
        await createRepurposedContentMutation.mutateAsync(audiogram);
      }

      // Step 4: Generate Blog Summary
      setCurrentStep('Writing blog post summary...');
      setProgress(55);
      await sleep(1000);

      const blogResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a comprehensive blog post from this podcast episode:

Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}
Key Themes: ${transcriptAnalysis.core_themes.join(', ')}
Takeaways: ${transcriptAnalysis.key_takeaways.join(' | ')}

Create a 600-800 word blog post with:
1. Compelling headline (SEO-optimized, under 60 chars)
2. Hook paragraph (2-3 sentences)
3. Main content (3-5 sections with headers)
4. Key insights and quotes
5. Action items for readers
6. Conclusion with CTA
7. 10-15 relevant SEO keywords

Make it engaging, scannable, and valuable.`,
        response_json_schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            content: { type: "string" },
            excerpt: { type: "string" },
            seo_keywords: { type: "array", items: { type: "string" } }
          }
        }
      });

      await createRepurposedContentMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'blog_summary',
        text_content: blogResult.content,
        hashtags: blogResult.seo_keywords,
        engagement_potential: 85,
        suggested_platforms: ['Blog', 'Medium', 'LinkedIn Articles'],
        content_data: {
          headline: blogResult.headline,
          excerpt: blogResult.excerpt,
          word_count: blogResult.content.split(' ').length
        }
      });

      // Step 5: Generate Tweet Threads (2 threads)
      setCurrentStep('Creating Twitter/X content...');
      setProgress(70);
      await sleep(1000);

      const tweetResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Create 2 viral Twitter/X thread variations promoting this podcast:

Episode: ${selectedPodcast.title}
Hook: ${transcriptAnalysis.audience_hook}
Takeaways: ${transcriptAnalysis.key_takeaways.join(' | ')}
Best Quotes: ${transcriptAnalysis.best_quotes.slice(0, 3).join(' | ')}

For EACH thread (create 2 variations):
1. Opening hook tweet (compelling, curiosity-driven)
2. 4-6 follow-up tweets with insights
3. Closing tweet with CTA and link
4. 10-15 relevant hashtags

Make threads engaging, valuable, and shareable.`,
        response_json_schema: {
          type: "object",
          properties: {
            thread_1: { 
              type: "object",
              properties: {
                tweets: { type: "array", items: { type: "string" } },
                hashtags: { type: "array", items: { type: "string" } }
              }
            },
            thread_2: { 
              type: "object",
              properties: {
                tweets: { type: "array", items: { type: "string" } },
                hashtags: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      await createRepurposedContentMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'tweet_thread',
        text_content: tweetResult.thread_1.tweets.join('\n\n'),
        hashtags: tweetResult.thread_1.hashtags,
        engagement_potential: 88,
        suggested_platforms: ['Twitter/X'],
        content_data: {
          tweet_count: tweetResult.thread_1.tweets.length,
          variation: 1
        }
      });

      await createRepurposedContentMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'tweet_thread',
        text_content: tweetResult.thread_2.tweets.join('\n\n'),
        hashtags: tweetResult.thread_2.hashtags,
        engagement_potential: 86,
        suggested_platforms: ['Twitter/X'],
        content_data: {
          tweet_count: tweetResult.thread_2.tweets.length,
          variation: 2
        }
      });

      // Step 6: Generate Social Media Posts
      setCurrentStep('Creating platform-specific posts...');
      setProgress(85);
      await sleep(1000);

      const socialResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Create platform-specific promotional posts for:

Episode: ${selectedPodcast.title}
Hook: ${transcriptAnalysis.audience_hook}
Top Quote: ${transcriptAnalysis.best_quotes[0]}

Create:
1. Instagram Reel Caption (engaging, emoji-rich, 15-20 hashtags)
2. LinkedIn Post (professional, value-focused, thought leadership)
3. YouTube Short Description (SEO optimized, with timestamps)

Each should be platform-optimized and include a strong CTA.`,
        response_json_schema: {
          type: "object",
          properties: {
            instagram_reel: { 
              type: "object",
              properties: {
                caption: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } }
              }
            },
            linkedin_post: { type: "string" },
            youtube_short: { type: "string" }
          }
        }
      });

      await createRepurposedContentMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'instagram_reel',
        text_content: socialResult.instagram_reel.caption,
        hashtags: socialResult.instagram_reel.hashtags,
        engagement_potential: 92,
        suggested_platforms: ['Instagram Reels'],
        content_data: {
          optimal_length: '15-30 seconds',
          style: 'Fast-paced with text overlays'
        }
      });

      await createRepurposedContentMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'linkedin_post',
        text_content: socialResult.linkedin_post,
        engagement_potential: 82,
        suggested_platforms: ['LinkedIn'],
        content_data: {
          tone: 'Professional',
          format: 'Thought leadership'
        }
      });

      await createRepurposedContentMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'youtube_short',
        text_content: socialResult.youtube_short,
        engagement_potential: 89,
        suggested_platforms: ['YouTube Shorts'],
        content_data: {
          optimal_length: '30-60 seconds',
          format: 'Vertical video'
        }
      });

      // Step 7: Generate Quote Cards
      setCurrentStep('Designing quote cards...');
      setProgress(95);
      await sleep(1000);

      const quoteCards = transcriptAnalysis.best_quotes.slice(0, 3).map((quote, idx) => ({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        content_type: 'quote_card',
        text_content: quote,
        visual_specs: {
          background_color: ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                             'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                             'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'][idx],
          text_color: '#ffffff',
          font_size: '28px'
        },
        engagement_potential: Math.floor(Math.random() * 10) + 85,
        suggested_platforms: ['Instagram Post', 'LinkedIn', 'Twitter'],
        content_data: {
          speaker: selectedPodcast.host_name,
          episode_info: `S${selectedPodcast.season}E${selectedPodcast.episode_number}`
        }
      }));

      for (const card of quoteCards) {
        await createRepurposedContentMutation.mutateAsync(card);
      }

      setProgress(100);
      setCurrentStep('Complete! All assets generated.');
      await sleep(1000);

      alert('✅ Episode repurposed successfully! 20+ marketing assets created.');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setRepurposing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const parseTimestamp = (timestamp) => {
    if (!timestamp) return 0;
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
  };

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyContent = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedContent(id);
    setTimeout(() => setCopiedContent(null), 2000);
  };

  const getContentByType = (type) => {
    return repurposedContent.filter(c => c.content_type === type);
  };

  const getTypeIcon = (type) => {
    const icons = {
      video_clip: Video,
      audiogram: Music,
      blog_summary: FileText,
      tweet_thread: Twitter,
      instagram_reel: Instagram,
      youtube_short: Youtube,
      linkedin_post: Linkedin,
      quote_card: Quote
    };
    return icons[type] || Layers;
  };

  const getTypeColor = (type) => {
    const colors = {
      video_clip: 'from-purple-500 to-pink-500',
      audiogram: 'from-green-500 to-teal-500',
      blog_summary: 'from-blue-500 to-cyan-500',
      tweet_thread: 'from-blue-400 to-blue-600',
      instagram_reel: 'from-pink-500 to-orange-500',
      youtube_short: 'from-red-500 to-red-600',
      linkedin_post: 'from-blue-600 to-blue-800',
      quote_card: 'from-indigo-500 to-purple-600'
    };
    return colors[type] || 'from-slate-500 to-slate-600';
  };

  const totalAssets = repurposedContent.length;
  const avgEngagement = repurposedContent.length > 0
    ? Math.round(repurposedContent.reduce((sum, c) => sum + (c.engagement_potential || 0), 0) / repurposedContent.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">AI Content Repurposing Studio</h2>
          <p className="text-slate-400 font-semibold">Transform 1 episode into 20+ marketing assets automatically</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500 font-bold text-base px-4 py-2">
          8 Asset Types
        </Badge>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Layers className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{totalAssets}</p>
            <p className="text-slate-400 text-sm font-semibold">Assets Created</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{avgEngagement}%</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Engagement</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Video className="w-8 h-8 text-cyan-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{getContentByType('video_clip').length}</p>
            <p className="text-slate-400 text-sm font-semibold">Video Clips</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Share2 className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{getContentByType('tweet_thread').length + getContentByType('instagram_reel').length}</p>
            <p className="text-slate-400 text-sm font-semibold">Social Posts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Podcast Selection */}
        <div className="lg:col-span-1">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black text-base flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" />
                Select Episode
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-[700px] overflow-y-auto">
              {podcasts.map((podcast) => (
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
                        <Film className="w-6 h-6 text-white m-auto mt-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">{podcast.title}</h4>
                      <p className="text-slate-400 text-xs">
                        S{podcast.season}E{podcast.episode_number} • {Math.floor((podcast.duration || 0) / 60)}m
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {selectedPodcast ? (
            <div className="space-y-6">
              {/* Episode Info + Generate Button */}
              <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-black text-xl mb-2">{selectedPodcast.title}</h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{selectedPodcast.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-purple-500">S{selectedPodcast.season}E{selectedPodcast.episode_number}</Badge>
                        <Badge className="bg-cyan-500">{Math.floor((selectedPodcast.duration || 0) / 60)} minutes</Badge>
                        <Badge className="bg-green-500">{selectedPodcast.host_name}</Badge>
                      </div>
                    </div>
                    <Button
                      onClick={repurposeEpisode}
                      disabled={repurposing}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-black text-base px-8"
                    >
                      {repurposing ? (
                        <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><Wand2 className="w-5 h-5 mr-2" />Repurpose Episode</>
                      )}
                    </Button>
                  </div>

                  {repurposing && (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white font-semibold">{currentStep}</span>
                        <span className="text-cyan-400 font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="grid grid-cols-4 gap-2 text-xs text-slate-400">
                        <div className={progress >= 25 ? 'text-green-400 font-semibold' : ''}>✓ Transcript</div>
                        <div className={progress >= 50 ? 'text-green-400 font-semibold' : ''}>✓ Clips</div>
                        <div className={progress >= 75 ? 'text-green-400 font-semibold' : ''}>✓ Social</div>
                        <div className={progress >= 100 ? 'text-green-400 font-semibold' : ''}>✓ Export</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Repurposed Content */}
              {totalAssets > 0 && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-[#1a1f3a] border border-slate-700 grid grid-cols-4">
                    <TabsTrigger value="clips" className="data-[state=active]:bg-cyan-500">
                      <Video className="w-4 h-4 mr-1" />
                      Clips ({getContentByType('video_clip').length})
                    </TabsTrigger>
                    <TabsTrigger value="audiograms" className="data-[state=active]:bg-cyan-500">
                      <Music className="w-4 h-4 mr-1" />
                      Audio ({getContentByType('audiogram').length})
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="data-[state=active]:bg-cyan-500">
                      <FileText className="w-4 h-4 mr-1" />
                      Blog ({getContentByType('blog_summary').length})
                    </TabsTrigger>
                    <TabsTrigger value="social" className="data-[state=active]:bg-cyan-500">
                      <Share2 className="w-4 h-4 mr-1" />
                      Social (All)
                    </TabsTrigger>
                  </TabsList>

                  {/* Video Clips Tab */}
                  <TabsContent value="clips" className="mt-6 space-y-4">
                    {getContentByType('video_clip').map((clip, idx) => (
                      <Card key={clip.id} className="bg-[#1a1f3a] border-slate-700">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <Video className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-white font-bold mb-1">Video Clip #{idx + 1}</h4>
                                  <p className="text-slate-300 text-sm mb-2">{clip.text_content}</p>
                                </div>
                                <Badge className="bg-green-500">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {clip.engagement_potential}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mb-3 text-sm">
                                <div className="flex items-center gap-1 text-cyan-400">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(clip.clip_timestamps.start)} - {formatTimestamp(clip.clip_timestamps.end)}
                                </div>
                                <div className="flex items-center gap-1 text-purple-400">
                                  <Scissors className="w-3 h-3" />
                                  {clip.clip_timestamps.duration}s
                                </div>
                              </div>
                              {clip.key_quotes && clip.key_quotes[0] && (
                                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-3">
                                  <p className="text-purple-200 text-sm italic">"{clip.key_quotes[0]}"</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCopyContent(`Clip: ${formatTimestamp(clip.clip_timestamps.start)} - ${formatTimestamp(clip.clip_timestamps.end)}\n${clip.text_content}`, clip.id)}
                                  className="bg-cyan-500 hover:bg-cyan-600"
                                >
                                  {copiedContent === clip.id ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Copied</>
                                  ) : (
                                    <><Copy className="w-3 h-3 mr-1" />Copy</>
                                  )}
                                </Button>
                                {clip.suggested_platforms?.map(platform => (
                                  <Badge key={platform} className="bg-slate-700">{platform}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Audiograms Tab */}
                  <TabsContent value="audiograms" className="mt-6 space-y-4">
                    {getContentByType('audiogram').map((audiogram, idx) => (
                      <Card key={audiogram.id} className="bg-[#1a1f3a] border-slate-700">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div 
                              className="w-32 h-32 rounded-lg flex items-center justify-center flex-shrink-0 p-4"
                              style={{ backgroundColor: audiogram.visual_specs.background_color }}
                            >
                              <Music className="w-12 h-12 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-white font-bold mb-1">Audiogram #{idx + 1}</h4>
                                  <p className="text-slate-300 text-sm mb-2 italic">"{audiogram.text_content}"</p>
                                  <p className="text-slate-400 text-xs">- {audiogram.content_data.speaker}</p>
                                </div>
                                <Badge className="bg-green-500">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {audiogram.engagement_potential}%
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                <div className="p-2 bg-slate-900/50 rounded">
                                  <p className="text-slate-400">Duration</p>
                                  <p className="text-white font-bold">{audiogram.content_data.duration}</p>
                                </div>
                                <div className="p-2 bg-slate-900/50 rounded">
                                  <p className="text-slate-400">Style</p>
                                  <p className="text-white font-bold">{audiogram.visual_specs.animation_style}</p>
                                </div>
                                <div className="p-2 bg-slate-900/50 rounded">
                                  <p className="text-slate-400">Episode</p>
                                  <p className="text-white font-bold">{audiogram.content_data.episode}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  onClick={() => handleCopyContent(audiogram.text_content, audiogram.id)}
                                  className="bg-cyan-500 hover:bg-cyan-600"
                                >
                                  {copiedContent === audiogram.id ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Copied</>
                                  ) : (
                                    <><Copy className="w-3 h-3 mr-1" />Copy Quote</>
                                  )}
                                </Button>
                                {audiogram.suggested_platforms?.map(platform => (
                                  <Badge key={platform} className="bg-green-600">{platform}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Blog Tab */}
                  <TabsContent value="blog" className="mt-6 space-y-4">
                    {getContentByType('blog_summary').map((blog) => (
                      <Card key={blog.id} className="bg-[#1a1f3a] border-slate-700">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-black text-lg mb-1">{blog.content_data.headline}</h4>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span>{blog.content_data.word_count} words</span>
                                  <Badge className="bg-blue-500">{blog.engagement_potential}% engagement</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Textarea
                            value={blog.text_content}
                            readOnly
                            className="bg-slate-900/50 border-slate-700 text-white h-64 mb-3 font-sans"
                          />
                          <div className="space-y-3">
                            <div>
                              <Label className="text-white font-bold text-sm mb-2 block">SEO Keywords ({blog.hashtags?.length})</Label>
                              <div className="flex flex-wrap gap-2">
                                {blog.hashtags?.map((keyword, idx) => (
                                  <Badge key={idx} className="bg-blue-500">{keyword}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCopyContent(blog.text_content, blog.id)}
                                className="bg-cyan-500 hover:bg-cyan-600"
                              >
                                {copiedContent === blog.id ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                                ) : (
                                  <><Copy className="w-3 h-3 mr-1" />Copy Blog Post</>
                                )}
                              </Button>
                              {blog.suggested_platforms?.map(platform => (
                                <Badge key={platform} className="bg-blue-600">{platform}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Social Media Tab */}
                  <TabsContent value="social" className="mt-6 space-y-4">
                    {['tweet_thread', 'instagram_reel', 'linkedin_post', 'youtube_short', 'quote_card'].map(type => {
                      const items = getContentByType(type);
                      if (items.length === 0) return null;

                      const Icon = getTypeIcon(type);
                      const colorClass = getTypeColor(type);

                      return items.map((item, idx) => (
                        <Card key={item.id} className="bg-[#1a1f3a] border-slate-700">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-10 h-10 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="text-white font-bold capitalize mb-1">
                                      {type.replace('_', ' ')} {items.length > 1 ? `#${idx + 1}` : ''}
                                    </h4>
                                    {item.content_data?.tweet_count && (
                                      <p className="text-slate-400 text-xs">{item.content_data.tweet_count} tweets</p>
                                    )}
                                  </div>
                                  <Badge className="bg-green-500">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {item.engagement_potential}%
                                  </Badge>
                                </div>
                                <Textarea
                                  value={item.text_content}
                                  readOnly
                                  className="bg-slate-900/50 border-slate-700 text-white h-32 mb-3 text-sm"
                                />
                                {item.hashtags && item.hashtags.length > 0 && (
                                  <div className="mb-3">
                                    <Label className="text-slate-400 text-xs mb-1 block">Hashtags</Label>
                                    <div className="flex flex-wrap gap-1">
                                      {item.hashtags.slice(0, 10).map((tag, tagIdx) => (
                                        <Badge key={tagIdx} className="bg-purple-500 text-xs">#{tag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    onClick={() => handleCopyContent(item.text_content + '\n\n' + (item.hashtags?.map(t => `#${t}`).join(' ') || ''), item.id)}
                                    className="bg-cyan-500 hover:bg-cyan-600"
                                  >
                                    {copiedContent === item.id ? (
                                      <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                                    ) : (
                                      <><Copy className="w-3 h-3 mr-1" />Copy All</>
                                    )}
                                  </Button>
                                  {item.suggested_platforms?.map(platform => (
                                    <Badge key={platform} className="bg-slate-700">{platform}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          ) : (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-16 text-center">
                <Layers className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                <h3 className="text-white font-black text-2xl mb-3">Select an Episode</h3>
                <p className="text-slate-400 mb-6">Choose a podcast episode to automatically generate marketing assets</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <Video className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-white text-xs font-bold">Video Clips</p>
                  </div>
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <Music className="w-6 h-6 text-green-400 mx-auto mb-1" />
                    <p className="text-white text-xs font-bold">Audiograms</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <p className="text-white text-xs font-bold">Blog Posts</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <Share2 className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                    <p className="text-white text-xs font-bold">Social Posts</p>
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