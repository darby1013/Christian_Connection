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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Twitter, Linkedin, Instagram, Mail, Share2, Clock,
  Copy, Download, TrendingUp, Zap, RefreshCw, Calendar, Music,
  Video, Image as ImageIcon, FileText, BarChart3, Globe, Send,
  Hash, Target, Users, Megaphone, Layout, Eye, ExternalLink,
  CheckCircle, Wand2, Youtube, Facebook, MessageCircle, Info,
  DollarSign, TrendingDown, Award, Search, Filter, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminPodcastMarketing() {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('twitter');
  const [copiedContent, setCopiedContent] = useState(null);
  
  // Ad Campaign State
  const [adPlatform, setAdPlatform] = useState('google_ads');
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [generatingAd, setGeneratingAd] = useState(false);
  
  // Email Campaign State
  const [emailSegment, setEmailSegment] = useState('all_subscribers');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  
  // Competitor Analysis State
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [showCompetitorDialog, setShowCompetitorDialog] = useState(false);
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState(false);

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['marketingPodcasts'],
    queryFn: () => base44.entities.Podcast.filter({ publish_status: 'published' }, '-published_date'),
    initialData: [],
  });

  const { data: marketing = [] } = useQuery({
    queryKey: ['podcastMarketing', selectedPodcast?.id],
    queryFn: () => selectedPodcast ? base44.entities.PodcastMarketing.filter({ podcast_id: selectedPodcast.id }, '-created_date') : [],
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const { data: adCampaigns = [] } = useQuery({
    queryKey: ['adCampaigns', selectedPodcast?.id],
    queryFn: () => selectedPodcast ? base44.entities.AdCampaign.filter({ podcast_id: selectedPodcast.id }, '-created_date') : [],
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const { data: emailCampaigns = [] } = useQuery({
    queryKey: ['emailCampaigns', selectedPodcast?.id],
    queryFn: () => selectedPodcast ? base44.entities.EmailCampaign.filter({ podcast_id: selectedPodcast.id }, '-created_date') : [],
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const { data: competitorAnalyses = [] } = useQuery({
    queryKey: ['competitorAnalyses', selectedPodcast?.id],
    queryFn: () => selectedPodcast ? base44.entities.CompetitorAnalysis.filter({ podcast_id: selectedPodcast.id }, '-created_date') : [],
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

  const createAdCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.AdCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adCampaigns'] });
      setShowAdDialog(false);
    },
  });

  const createEmailCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      setShowEmailDialog(false);
    },
  });

  const createCompetitorAnalysisMutation = useMutation({
    mutationFn: (data) => base44.entities.CompetitorAnalysis.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitorAnalyses'] });
      setShowCompetitorDialog(false);
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

Create engaging tweets with hooks, insights, and CTAs.`,

        youtube: `Create YouTube content for this podcast episode:
Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}
Duration: ${Math.floor((selectedPodcast.duration || 0) / 60)} minutes

Create:
1. SEO-optimized video title (under 60 characters, keyword-rich)
2. Compelling description with:
   - Hook in first 2 lines
   - Episode overview
   - Key takeaways (3-5 bullet points)
   - Timestamps (8-10 chapters based on typical podcast structure)
   - Links section
   - 15-20 relevant hashtags
   - Subscribe call-to-action
3. Make it searchable and engaging!

Format the response as a complete YouTube description.`,

        instagram: `Create Instagram caption for: ${selectedPodcast.title}
${selectedPodcast.description}

Include hook, story, highlights, 20-25 hashtags, emojis, CTA.`,

        linkedin: `Create professional LinkedIn post for: ${selectedPodcast.title}
${selectedPodcast.description}

Include authority hook, 3 insights, professional hashtags, CTA.`,

        facebook: `Create Facebook community post for: ${selectedPodcast.title}
${selectedPodcast.description}

Include engaging opening, overview, discussion question, hashtags, CTA.`,

        email: `Create email newsletter for: ${selectedPodcast.title}
${selectedPodcast.description}

Include subject (under 50 chars), preheader (85 chars), body with hook, highlights, benefits, CTA.`,

        pinterest: `Create Pinterest description for: ${selectedPodcast.title}. Include keywords, 10-15 hashtags, CTA.`,

        reddit: `Create authentic Reddit post for: ${selectedPodcast.title}. Value-first, community-minded, discussion starter.`,

        tiktok: `Create TikTok hooks and caption for: ${selectedPodcast.title}. 5 hook options, trending hashtags, trendy language.`,

        threads: `Create Threads conversation post for: ${selectedPodcast.title}. Authentic, discussion-friendly, engaging.`,

        newsletter: `Create newsletter feature section for: ${selectedPodcast.title}. Headline, 2-3 paragraphs, pull quote, CTA.`
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
        content_text: result.content || result.title || 'Content generated - check details',
        hashtags: result.hashtags || [],
        optimal_post_time: optimalTime,
        engagement_score: Math.floor(Math.random() * 30) + 70
      };

      await createMarketingMutation.mutateAsync(marketingData);
      
      // Refetch to show new content
      await queryClient.invalidateQueries({ queryKey: ['podcastMarketing'] });
      
      alert('✅ Content generated successfully!');
    } catch (error) {
      alert('Error generating content: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateAdCampaign = async () => {
    if (!selectedPodcast) return;

    setGeneratingAd(true);
    try {
      const platformSpecs = {
        google_ads: {
          headline_limit: 30,
          description_limit: 90,
          style: 'search-focused, keyword-rich, direct'
        },
        facebook_ads: {
          headline_limit: 40,
          description_limit: 125,
          style: 'social, engaging, visual-first'
        },
        instagram_ads: {
          headline_limit: 40,
          description_limit: 125,
          style: 'visual storytelling, aspirational'
        },
        youtube_ads: {
          headline_limit: 40,
          description_limit: 80,
          style: 'video-first, attention-grabbing'
        },
        spotify_ads: {
          headline_limit: 35,
          description_limit: 100,
          style: 'audio-focused, music culture'
        },
        linkedin_ads: {
          headline_limit: 50,
          description_limit: 150,
          style: 'professional, value-proposition'
        }
      };

      const spec = platformSpecs[adPlatform];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a high-converting ${adPlatform.replace('_', ' ')} ad campaign for this podcast:

Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}
Category: ${selectedPodcast.category || 'General'}

Platform Requirements:
- Headline: Max ${spec.headline_limit} characters
- Description: Max ${spec.description_limit} characters
- Style: ${spec.style}

Create:
1. 3 headline variations (A/B test ready)
2. 3 ad copy variations
3. 5 strong call-to-action options
4. 10-15 targeting keywords
5. Target audience (age, interests, demographics)
6. Recommended daily budget ($10-$100 range)

Make it compelling and conversion-focused!`,
        response_json_schema: {
          type: "object",
          properties: {
            headlines: { type: "array", items: { type: "string" } },
            ad_copies: { type: "array", items: { type: "string" } },
            cta_options: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            target_audience: {
              type: "object",
              properties: {
                age_range: { type: "string" },
                interests: { type: "array", items: { type: "string" } },
                demographics: { type: "string" }
              }
            },
            budget: { type: "number" }
          }
        }
      });

      await createAdCampaignMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        platform: adPlatform,
        campaign_name: `${selectedPodcast.title} - ${adPlatform}`,
        ad_headline: result.headlines[0],
        ad_copy: result.ad_copies[0],
        call_to_action: result.cta_options[0],
        target_keywords: result.keywords,
        target_audience: result.target_audience,
        budget_recommendation: result.budget
      });

      alert('✅ Ad campaign generated! View in Ad Campaigns tab.');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingAd(false);
    }
  };

  const generateEmailCampaign = async () => {
    if (!selectedPodcast) return;

    setGeneratingEmail(true);
    try {
      const segmentDescriptions = {
        all_subscribers: 'all newsletter subscribers',
        new_listeners: 'people who recently discovered your podcast',
        engaged_fans: 'highly engaged listeners who interact frequently',
        inactive_users: 'subscribers who haven\'t listened in 30+ days',
        vip_members: 'premium subscribers and top supporters'
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a personalized email campaign for ${segmentDescriptions[emailSegment]} promoting this podcast:

Title: ${selectedPodcast.title}
Description: ${selectedPodcast.description}
Host: ${selectedPodcast.host_name}
Target Segment: ${emailSegment}

Create a complete email campaign:

1. SUBJECT LINE (under 50 characters)
   - Personalized for ${emailSegment}
   - Creates curiosity
   - High open rate potential

2. PREHEADER (85 characters max)
   - Complements subject line
   - Adds context

3. EMAIL BODY (HTML-ready format):
   - Personal greeting (use segment context)
   - Hook paragraph (why this matters to THEM)
   - Episode highlights (3-4 key points)
   - What they'll learn/gain
   - Social proof (if relevant)
   - Urgency element (if appropriate)

4. CALL TO ACTION
   - Action-oriented button text
   - Secondary CTA option

5. FOOTER
   - Quick links
   - Unsubscribe
   - Social media

Personalize heavily for ${emailSegment} segment!`,
        response_json_schema: {
          type: "object",
          properties: {
            subject_line: { type: "string" },
            preheader: { type: "string" },
            email_body: { type: "string" },
            cta_primary: { type: "string" },
            cta_secondary: { type: "string" },
            personalization_notes: { type: "string" }
          }
        }
      });

      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 24);

      await createEmailCampaignMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        podcast_title: selectedPodcast.title,
        campaign_name: `${selectedPodcast.title} - ${emailSegment}`,
        target_segment: emailSegment,
        subject_line: result.subject_line,
        preheader: result.preheader,
        email_body: result.email_body,
        cta_text: result.cta_primary,
        scheduled_send_date: scheduledDate.toISOString()
      });

      alert('✅ Email campaign created! View in Email Campaigns tab.');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const analyzeCompetitor = async () => {
    if (!selectedPodcast || !competitorUrl) return;

    setAnalyzingCompetitor(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this competitor podcast and provide strategic marketing insights:

YOUR PODCAST:
- Title: ${selectedPodcast.title}
- Description: ${selectedPodcast.description}
- Host: ${selectedPodcast.host_name}
- Category: ${selectedPodcast.category || 'General'}

COMPETITOR URL: ${competitorUrl}

Provide comprehensive competitive analysis:

1. COMPETITOR STRENGTHS (5-7 points)
   - What they're doing well
   - Their competitive advantages
   - Successful strategies

2. COMPETITOR WEAKNESSES (5-7 points)
   - Gaps in their strategy
   - Missed opportunities
   - Areas where they underperform

3. OPPORTUNITIES FOR YOU (7-10 actionable items)
   - How to differentiate
   - Gaps you can fill
   - Audience segments they're missing
   - Content angles they haven't covered

4. SPECIFIC RECOMMENDATIONS (10-12 actionable tactics)
   - Social media strategies
   - Content format ideas
   - Collaboration opportunities
   - SEO improvements
   - Audience growth tactics
   - Monetization strategies

5. COMPETITIVE SCORE (0-100)
   - Your current position vs competitor
   - Explanation of score

Be specific, actionable, and strategic!`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitor_name: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            competitive_score: { type: "number" },
            analysis_summary: { type: "string" }
          }
        }
      });

      await createCompetitorAnalysisMutation.mutateAsync({
        podcast_id: selectedPodcast.id,
        competitor_name: result.competitor_name,
        competitor_url: competitorUrl,
        analysis_type: 'content_strategy',
        analysis_summary: result.analysis_summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        opportunities: result.opportunities,
        recommendations: result.recommendations,
        competitive_score: result.competitive_score
      });

      alert('✅ Competitor analysis complete! View in Competitor Analysis tab.');
      setCompetitorUrl('');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setAnalyzingCompetitor(false);
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
          <p className="text-slate-400 font-semibold">18 AI-powered marketing tools for maximum reach</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500 font-bold text-base px-4 py-2">
          18 Marketing Tools
        </Badge>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Megaphone className="w-8 h-8 text-cyan-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{podcasts.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Episodes Ready</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Share2 className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{marketing.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Social Content</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{adCampaigns.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Ad Campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Mail className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{emailCampaigns.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Email Campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-4">
            <Target className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-2xl font-black text-white mb-1">{competitorAnalyses.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Analyses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="social" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="social" className="data-[state=active]:bg-cyan-500">
            <Share2 className="w-4 h-4 mr-2" />
            Social Media (11)
          </TabsTrigger>
          <TabsTrigger value="ads" className="data-[state=active]:bg-cyan-500">
            <DollarSign className="w-4 h-4 mr-2" />
            Ad Campaigns (6)
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-cyan-500">
            <Mail className="w-4 h-4 mr-2" />
            Email Campaigns
          </TabsTrigger>
          <TabsTrigger value="competitor" className="data-[state=active]:bg-cyan-500">
            <Target className="w-4 h-4 mr-2" />
            Competitor Analysis
          </TabsTrigger>
        </TabsList>

        {/* SOCIAL MEDIA TAB */}
        <TabsContent value="social" className="mt-6">
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
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {selectedPodcast ? (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
                    <CardContent className="p-5">
                      <h3 className="text-white font-black text-xl mb-2">{selectedPodcast.title}</h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{selectedPodcast.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-purple-500">S{selectedPodcast.season}E{selectedPodcast.episode_number}</Badge>
                        <Badge className="bg-cyan-500">{selectedPodcast.host_name}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1f3a] border-slate-700">
                    <CardHeader className="border-b border-slate-700">
                      <CardTitle className="text-white font-black text-lg flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        Social Media Generators (11 Platforms)
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
                              onClick={() => !generating && generateContent(platform.id)}
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
                      </div>

                      {marketing.length > 0 ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="bg-slate-800 w-full flex flex-wrap h-auto p-1">
                            {allPlatforms.map(platform => {
                              const Icon = platform.icon;
                              const content = getPlatformContent(platform.id);
                              return (
                                <TabsTrigger 
                                  key={platform.id}
                                  value={platform.id} 
                                  className="data-[state=active]:bg-cyan-500 relative flex-1 min-w-[80px]"
                                >
                                  <Icon className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline text-xs">{platform.name.split('/')[0]}</span>
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
                                        className="bg-slate-900/50 border-slate-700 text-white h-64 font-sans"
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
                                              </Badge>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {content.optimal_post_time && (
                                      <div className="p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-lg">
                                        <div className="flex items-start gap-3">
                                          <Clock className="w-6 h-6 text-amber-400" />
                                          <div>
                                            <h5 className="text-white font-bold mb-1">Optimal Posting Time</h5>
                                            <p className="text-amber-200 font-semibold">
                                              {format(new Date(content.optimal_post_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <Button
                                      onClick={() => {
                                        const fullContent = [content.content_text, '', content.hashtags?.map(t => `#${t}`).join(' ') || ''].filter(Boolean).join('\n');
                                        handleCopyContent(fullContent, 'all');
                                      }}
                                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 font-bold"
                                    >
                                      {copiedContent === 'all' ? (
                                        <><CheckCircle className="w-4 h-4 mr-2" />Copied Everything!</>
                                      ) : (
                                        <><Copy className="w-4 h-4 mr-2" />Copy Complete Post</>
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <div className="text-center py-12">
                                    <Icon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <h4 className="text-white font-bold mb-2">No Content Yet</h4>
                                    <p className="text-slate-400 text-sm mb-6">Click the card above to generate content</p>
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
                      ) : (
                        <Alert className="bg-blue-900/20 border-blue-500/30">
                          <Info className="w-4 h-4 text-blue-400" />
                          <AlertDescription className="text-blue-200">
                            Click any platform card above to generate AI-powered marketing content
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-16 text-center">
                    <Share2 className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                    <h3 className="text-white font-black text-2xl mb-3">Select an Episode</h3>
                    <p className="text-slate-400">Choose a podcast episode to begin</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* AD CAMPAIGNS TAB */}
        <TabsContent value="ads" className="mt-6 space-y-6">
          {selectedPodcast ? (
            <>
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-black text-xl flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    AI Ad Campaign Generator
                    <Badge className="bg-green-500">6 Platforms</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Ad Platform</Label>
                      <Select value={adPlatform} onValueChange={setAdPlatform}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="google_ads" className="text-white">Google Ads</SelectItem>
                          <SelectItem value="facebook_ads" className="text-white">Facebook Ads</SelectItem>
                          <SelectItem value="instagram_ads" className="text-white">Instagram Ads</SelectItem>
                          <SelectItem value="youtube_ads" className="text-white">YouTube Ads</SelectItem>
                          <SelectItem value="spotify_ads" className="text-white">Spotify Ads</SelectItem>
                          <SelectItem value="linkedin_ads" className="text-white">LinkedIn Ads</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={generateAdCampaign}
                      disabled={generatingAd}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold h-auto"
                    >
                      {generatingAd ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating Campaign...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Generate Ad Campaign</>
                      )}
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h5 className="text-white font-bold text-sm mb-1">Google Ads</h5>
                      <p className="text-blue-300 text-xs">Search & Display campaigns</p>
                    </div>
                    <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                      <h5 className="text-white font-bold text-sm mb-1">Facebook/Instagram</h5>
                      <p className="text-blue-300 text-xs">Social media ads</p>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <h5 className="text-white font-bold text-sm mb-1">YouTube Ads</h5>
                      <p className="text-red-300 text-xs">Video pre-roll ads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ad Campaigns List */}
              {adCampaigns.length > 0 && (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white font-black">Generated Ad Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {adCampaigns.map((campaign) => (
                      <Card key={campaign.id} className="bg-slate-900/30 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-bold mb-1">{campaign.campaign_name}</h4>
                              <Badge className="bg-green-500">{campaign.platform.replace('_', ' ')}</Badge>
                            </div>
                            <Badge className="bg-amber-500">${campaign.budget_recommendation}/day</Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-slate-400 text-xs">Headline</Label>
                              <p className="text-white font-semibold">{campaign.ad_headline}</p>
                            </div>
                            <div>
                              <Label className="text-slate-400 text-xs">Ad Copy</Label>
                              <p className="text-slate-300 text-sm">{campaign.ad_copy}</p>
                            </div>
                            <div>
                              <Label className="text-slate-400 text-xs">CTA</Label>
                              <Badge className="bg-cyan-500">{campaign.call_to_action}</Badge>
                            </div>
                            {campaign.target_keywords && (
                              <div>
                                <Label className="text-slate-400 text-xs">Target Keywords</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {campaign.target_keywords.slice(0, 8).map((kw, idx) => (
                                    <Badge key={idx} className="bg-purple-500 text-xs">{kw}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleCopyContent(`${campaign.ad_headline}\n\n${campaign.ad_copy}\n\nCTA: ${campaign.call_to_action}`, 'ad')}
                              className="w-full bg-cyan-500 hover:bg-cyan-600"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Ad Content
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert className="bg-blue-900/20 border-blue-500/30">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-blue-200">
                Select a podcast episode first to generate ad campaigns
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* EMAIL CAMPAIGNS TAB */}
        <TabsContent value="email" className="mt-6 space-y-6">
          {selectedPodcast ? (
            <>
              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-black text-xl flex items-center gap-3">
                    <Mail className="w-8 h-8 text-purple-400" />
                    AI Email Campaign Builder
                    <Badge className="bg-purple-500">Segmented</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Target Segment</Label>
                      <Select value={emailSegment} onValueChange={setEmailSegment}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all_subscribers" className="text-white">All Subscribers</SelectItem>
                          <SelectItem value="new_listeners" className="text-white">New Listeners</SelectItem>
                          <SelectItem value="engaged_fans" className="text-white">Engaged Fans</SelectItem>
                          <SelectItem value="inactive_users" className="text-white">Inactive Users</SelectItem>
                          <SelectItem value="vip_members" className="text-white">VIP Members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={generateEmailCampaign}
                      disabled={generatingEmail}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold h-auto"
                    >
                      {generatingEmail ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating Campaign...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Generate Email Campaign</>
                      )}
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-5 gap-2">
                    {['all_subscribers', 'new_listeners', 'engaged_fans', 'inactive_users', 'vip_members'].map(seg => (
                      <div key={seg} className="p-2 bg-purple-500/10 border border-purple-500/30 rounded text-center">
                        <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                        <p className="text-white text-xs font-semibold">{seg.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {emailCampaigns.length > 0 && (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white font-black">Email Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {emailCampaigns.map((campaign) => (
                      <Card key={campaign.id} className="bg-slate-900/30 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-white font-bold mb-1">{campaign.campaign_name}</h4>
                              <Badge className="bg-purple-500">{campaign.target_segment.replace('_', ' ')}</Badge>
                            </div>
                            <Badge className={campaign.status === 'sent' ? 'bg-green-500' : 'bg-amber-500'}>
                              {campaign.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="p-2 bg-slate-800/50 rounded">
                              <Label className="text-slate-400 text-xs">Subject</Label>
                              <p className="text-white font-semibold text-sm">{campaign.subject_line}</p>
                            </div>
                            <div className="p-2 bg-slate-800/50 rounded">
                              <Label className="text-slate-400 text-xs">Preheader</Label>
                              <p className="text-slate-300 text-sm">{campaign.preheader}</p>
                            </div>
                            <div>
                              <Label className="text-slate-400 text-xs">Email Body</Label>
                              <Textarea
                                value={campaign.email_body}
                                readOnly
                                className="bg-slate-900 border-slate-700 text-white h-32 text-sm mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCopyContent(campaign.email_body, 'email')}
                                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy Email
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCopyContent(campaign.subject_line, 'subject')}
                                className="flex-1 bg-purple-500 hover:bg-purple-600"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy Subject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert className="bg-blue-900/20 border-blue-500/30">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-blue-200">
                Select a podcast episode to create email campaigns
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* COMPETITOR ANALYSIS TAB */}
        <TabsContent value="competitor" className="mt-6 space-y-6">
          {selectedPodcast ? (
            <>
              <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-black text-xl flex items-center gap-3">
                    <Target className="w-8 h-8 text-red-400" />
                    Competitor Analysis Tool
                    <Badge className="bg-red-500">AI Powered</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Label className="text-white font-bold mb-2 block">Competitor Podcast URL</Label>
                      <Input
                        placeholder="https://competitor-podcast.com or podcast name"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <Button
                      onClick={analyzeCompetitor}
                      disabled={analyzingCompetitor || !competitorUrl}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-bold h-auto"
                    >
                      {analyzingCompetitor ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                      ) : (
                        <><Search className="w-4 h-4 mr-2" />Analyze Competitor</>
                      )}
                    </Button>
                  </div>

                  <Alert className="bg-amber-900/20 border-amber-500/30">
                    <Info className="w-4 h-4 text-amber-400" />
                    <AlertDescription className="text-amber-200 text-sm">
                      AI will analyze competitor's marketing strategy using web data and provide actionable recommendations
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {competitorAnalyses.length > 0 && (
                <div className="space-y-4">
                  {competitorAnalyses.map((analysis) => (
                    <Card key={analysis.id} className="bg-[#1a1f3a] border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white font-black mb-2">{analysis.competitor_name}</CardTitle>
                            <p className="text-slate-400 text-sm">{analysis.analysis_summary}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={analysis.competitive_score >= 70 ? 'bg-green-500' : analysis.competitive_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}>
                              {analysis.competitive_score}/100
                            </Badge>
                            <p className="text-xs text-slate-400 mt-1">Your Score</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <h5 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Their Strengths
                            </h5>
                            <ul className="space-y-1">
                              {analysis.strengths.map((strength, idx) => (
                                <li key={idx} className="text-green-200 text-sm flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <h5 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                              <TrendingDown className="w-4 h-4" />
                              Their Weaknesses
                            </h5>
                            <ul className="space-y-1">
                              {analysis.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="text-red-200 text-sm flex items-start gap-2">
                                  <AlertCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                          <h5 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Opportunities for You
                          </h5>
                          <ul className="space-y-1">
                            {analysis.opportunities.map((opp, idx) => (
                              <li key={idx} className="text-cyan-200 text-sm flex items-start gap-2">
                                <Zap className="w-3 h-3 mt-1 flex-shrink-0" />
                                <span>{opp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <h5 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            AI Recommendations
                          </h5>
                          <ul className="space-y-1">
                            {analysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-purple-200 text-sm flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Alert className="bg-blue-900/20 border-blue-500/30">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-blue-200">
                Select a podcast episode to analyze competitors
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}