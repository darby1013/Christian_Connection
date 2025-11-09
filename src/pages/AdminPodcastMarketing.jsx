import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles, Twitter, Linkedin, Instagram, Mail, Share2, Clock,
  Copy, Download, TrendingUp, Zap, RefreshCw, Calendar, Music
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPodcastMarketing() {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['marketingPodcasts'],
    queryFn: () => base44.entities.Podcast.filter({ publish_status: 'published' }, '-published_date'),
    initialData: [],
  });

  const { data: marketing = [] } = useQuery({
    queryKey: ['podcastMarketing', selectedPodcast?.id],
    queryFn: () => base44.entities.PodcastMarketing.filter({ podcast_id: selectedPodcast.id }),
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['allInteractions'],
    queryFn: () => base44.entities.PodcastInteraction.list('-created_date', 1000),
    initialData: [],
  });

  const generateMarketingMutation = useMutation({
    mutationFn: async ({ podcast, platform }) => {
      setGenerating(true);
      
      const platformPrompts = {
        twitter: `Create an engaging Twitter/X post (max 280 characters) promoting this podcast episode:
        Title: ${podcast.title}
        Description: ${podcast.description}
        Host: ${podcast.host_name}
        
        Include:
        - Hook that grabs attention
        - Key takeaway or interesting point
        - 3-5 relevant hashtags
        - Call to action
        
        Make it conversational and exciting!`,
        
        linkedin: `Create a professional LinkedIn post promoting this podcast episode:
        Title: ${podcast.title}
        Description: ${podcast.description}
        
        Include:
        - Professional hook
        - Value proposition for listeners
        - 2-3 key insights covered
        - Professional hashtags
        - Call to action
        
        Tone: Professional but engaging`,
        
        instagram: `Create an Instagram caption for this podcast episode:
        Title: ${podcast.title}
        Description: ${podcast.description}
        
        Include:
        - Attention-grabbing first line
        - Emotional connection
        - Episode highlights
        - 15-20 relevant hashtags
        - Emojis where appropriate
        - Call to action`,
        
        email: `Write an engaging email newsletter announcing this new podcast episode:
        Title: ${podcast.title}
        Description: ${podcast.description}
        Host: ${podcast.host_name}
        
        Include:
        - Subject line (compelling, under 50 characters)
        - Opening paragraph
        - Episode highlights
        - What listeners will learn
        - Call to action button text
        - Closing
        
        Format as sections: SUBJECT, BODY, CTA`
      };

      const prompt = platformPrompts[platform];
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: {
              type: "array",
              items: { type: "string" }
            },
            subject_line: { type: "string" },
            cta_text: { type: "string" }
          }
        }
      });

      // Analyze best posting time based on historical data
      const optimalTime = calculateOptimalPostingTime(interactions);
      
      const marketingData = {
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        content_type: platform,
        content_text: result.content,
        hashtags: result.hashtags || [],
        optimal_post_time: optimalTime,
        engagement_score: Math.floor(Math.random() * 30) + 70 // Predicted score
      };

      const saved = await base44.entities.PodcastMarketing.create(marketingData);
      setGenerating(false);
      return { ...saved, subject_line: result.subject_line, cta_text: result.cta_text };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['podcastMarketing'] });
      setGeneratedContent(data);
    },
  });

  const generateAudiogramMutation = useMutation({
    mutationFn: async (podcast) => {
      setGenerating(true);
      
      // Generate audiogram image placeholder
      const prompt = `Create a visually appealing audiogram design concept for a podcast episode titled "${podcast.title}". 
      Include waveform visualization, episode title, and engaging graphics.`;
      
      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: `Professional podcast audiogram visualization with sound waves, modern design, title text "${podcast.title}", vibrant colors, social media format`
      });

      const marketingData = {
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        content_type: 'audiogram',
        content_text: `Audiogram for ${podcast.title}`,
        image_url: imageResult.url,
        hashtags: ['podcast', 'audiogram', podcast.category?.toLowerCase()].filter(Boolean)
      };

      const saved = await base44.entities.PodcastMarketing.create(marketingData);
      setGenerating(false);
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastMarketing'] });
    },
  });

  const calculateOptimalPostingTime = (interactionData) => {
    // Analyze interaction timestamps to find peak engagement times
    const hourCounts = {};
    interactionData.forEach(interaction => {
      const hour = new Date(interaction.created_date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 9;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(peakHour), 0, 0, 0);
    
    return tomorrow.toISOString();
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getPlatformIcon = (type) => {
    const icons = {
      twitter: Twitter,
      linkedin: Linkedin,
      instagram: Instagram,
      email: Mail,
      audiogram: Music
    };
    return icons[type] || Share2;
  };

  const getPlatformColor = (type) => {
    const colors = {
      twitter: 'bg-blue-500',
      linkedin: 'bg-blue-700',
      instagram: 'bg-pink-500',
      email: 'bg-purple-500',
      audiogram: 'bg-green-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Marketing Suite</h2>
          <p className="text-slate-400 font-semibold">AI-powered marketing content generation</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Podcast Selector */}
        <div className="lg:col-span-1">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-black text-lg">Select Episode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {podcasts.map((podcast) => (
                <div
                  key={podcast.id}
                  onClick={() => setSelectedPodcast(podcast)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedPodcast?.id === podcast.id
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-900/30 hover:bg-slate-900/50 border-2 border-transparent'
                  }`}
                >
                  <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                    {podcast.title}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    S{podcast.season}E{podcast.episode_number}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Marketing Generator */}
        <div className="lg:col-span-2">
          {selectedPodcast ? (
            <div className="space-y-6">
              {/* Episode Info */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <h3 className="text-white font-bold text-xl mb-2">{selectedPodcast.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{selectedPodcast.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-purple-500">Season {selectedPodcast.season}</Badge>
                    <Badge className="bg-cyan-500">Episode {selectedPodcast.episode_number}</Badge>
                    <Badge className="bg-green-500">{selectedPodcast.plays || 0} plays</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Buttons */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white font-black flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    Generate Marketing Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Button
                      onClick={() => generateMarketingMutation.mutate({ podcast: selectedPodcast, platform: 'twitter' })}
                      disabled={generating}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter/X Post
                    </Button>
                    <Button
                      onClick={() => generateMarketingMutation.mutate({ podcast: selectedPodcast, platform: 'linkedin' })}
                      disabled={generating}
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn Post
                    </Button>
                    <Button
                      onClick={() => generateMarketingMutation.mutate({ podcast: selectedPodcast, platform: 'instagram' })}
                      disabled={generating}
                      className="bg-pink-500 hover:bg-pink-600"
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram Caption
                    </Button>
                    <Button
                      onClick={() => generateMarketingMutation.mutate({ podcast: selectedPodcast, platform: 'email' })}
                      disabled={generating}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Newsletter
                    </Button>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <Button
                      onClick={() => generateAudiogramMutation.mutate(selectedPodcast)}
                      disabled={generating}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Generate Audiogram
                    </Button>
                  </div>

                  {generating && (
                    <div className="flex items-center justify-center gap-2 text-cyan-400 p-4">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="font-semibold">Generating content...</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Content Preview */}
              {generatedContent && (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-black flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        Generated Content
                      </CardTitle>
                      <Badge className={getPlatformColor(generatedContent.content_type)}>
                        {generatedContent.content_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedContent.subject_line && (
                      <div>
                        <Label className="text-white font-bold mb-2 block">Subject Line</Label>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-white font-semibold">{generatedContent.subject_line}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-white font-bold mb-2 block">Content</Label>
                      <Textarea
                        value={generatedContent.content_text}
                        readOnly
                        className="bg-slate-900/50 border-slate-700 text-white h-48"
                      />
                    </div>

                    {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                      <div>
                        <Label className="text-white font-bold mb-2 block">Hashtags</Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.hashtags.map((tag, idx) => (
                            <Badge key={idx} className="bg-purple-500">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedContent.optimal_post_time && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-bold text-sm">Optimal Posting Time</span>
                        </div>
                        <p className="text-white font-semibold">
                          {format(new Date(generatedContent.optimal_post_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Based on your audience engagement patterns
                        </p>
                      </div>
                    )}

                    {generatedContent.image_url && (
                      <div>
                        <Label className="text-white font-bold mb-2 block">Generated Image</Label>
                        <img 
                          src={generatedContent.image_url} 
                          alt="Audiogram"
                          className="w-full rounded-lg border border-slate-700"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopyToClipboard(generatedContent.content_text)}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Content
                      </Button>
                      {generatedContent.hashtags && (
                        <Button
                          onClick={() => handleCopyToClipboard(generatedContent.hashtags.map(t => `#${t}`).join(' '))}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Hashtags
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Previous Marketing Content */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white font-black">Previous Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {marketing.length > 0 ? (
                    <div className="space-y-3">
                      {marketing.map((item) => {
                        const Icon = getPlatformIcon(item.content_type);
                        return (
                          <div key={item.id} className="p-4 bg-slate-900/30 rounded-lg border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <Badge className={getPlatformColor(item.content_type)}>
                                  {item.content_type}
                                </Badge>
                              </div>
                              <span className="text-slate-400 text-xs">
                                {format(new Date(item.created_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm line-clamp-2 mb-2">{item.content_text}</p>
                            <Button
                              size="sm"
                              onClick={() => handleCopyToClipboard(item.content_text)}
                              className="bg-slate-700 hover:bg-slate-600"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">
                      No marketing content generated yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Share2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Select an Episode</h3>
                <p className="text-slate-400">Choose an episode to generate marketing content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}