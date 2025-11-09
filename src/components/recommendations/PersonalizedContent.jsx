import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Star, Play, BookOpen, Radio, ShoppingBag, Heart } from "lucide-react";

export default function PersonalizedContent({ user }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: userActivities = [] } = useQuery({
    queryKey: ['userActivities', user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user,
    initialData: [],
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ user_id: user?.id, status: 'active' });
      return subs[0];
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    initialData: [],
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ['liveStreamsForRec'],
    queryFn: () => base44.entities.LiveStream.list('-created_date', 30),
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videosForRec'],
    queryFn: () => base44.entities.Video.list('-created_date', 30),
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blogPostsForRec'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-created_date', 30),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['productsForRec'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 30),
    initialData: [],
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      
      // Analyze user behavior patterns
      const viewHistory = userActivities.filter(a => a.activity_type === 'view');
      const likedContent = userActivities.filter(a => a.activity_type === 'like');
      const commentedContent = userActivities.filter(a => a.activity_type === 'comment');
      const sharedContent = userActivities.filter(a => a.activity_type === 'share');
      const purchases = userActivities.filter(a => a.activity_type === 'purchase');

      // Calculate engagement scores
      const categoryEngagement = {};
      userActivities.forEach(activity => {
        if (activity.content_category) {
          categoryEngagement[activity.content_category] = 
            (categoryEngagement[activity.content_category] || 0) + (activity.engagement_score || 1);
        }
      });

      const topCategories = Object.entries(categoryEngagement)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      // Purchase history analysis
      const purchaseCategories = orders.map(o => o.category || 'general');
      const avgOrderValue = orders.length > 0 
        ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length 
        : 0;

      const userProfile = {
        subscription_tier: subscription?.plan_type || 'free',
        total_views: viewHistory.length,
        total_likes: likedContent.length,
        total_comments: commentedContent.length,
        total_shares: sharedContent.length,
        total_purchases: purchases.length,
        favorite_categories: topCategories,
        avg_engagement_time: Math.floor(
          userActivities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 
          Math.max(userActivities.length, 1)
        ),
        purchase_categories: [...new Set(purchaseCategories)],
        avg_order_value: avgOrderValue.toFixed(2),
        recent_activity_types: [...new Set(userActivities.slice(0, 10).map(a => a.activity_type))]
      };

      const availableContent = {
        streams: liveStreams.map(s => ({ 
          id: s.id, 
          title: s.title, 
          category: s.category, 
          status: s.status,
          host: s.host_name,
          viewers: s.viewer_count || 0
        })),
        videos: videos.map(v => ({ 
          id: v.id, 
          title: v.title, 
          category: v.category,
          views: v.views || 0,
          likes: v.likes || 0
        })),
        blogs: blogPosts.map(b => ({ 
          id: b.id, 
          title: b.title, 
          category: b.category,
          views: b.views || 0,
          author: b.author_name
        })),
        products: products.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category, 
          price: p.price,
          rating: p.rating || 0,
          is_featured: p.is_featured
        }))
      };

      const prompt = `Analyze this user's behavior on our Christian community platform and provide highly personalized content recommendations:

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

RECENT ACTIVITY (Last 20):
${JSON.stringify(userActivities.slice(0, 20).map(a => ({
  type: a.activity_type,
  content: a.content_title,
  category: a.content_category,
  engagement: a.engagement_score
})), null, 2)}

AVAILABLE CONTENT:
${JSON.stringify(availableContent, null, 2).substring(0, 3000)}

Provide:
1. Top 3 live streams/videos - prioritize user's favorite categories and engagement patterns
2. Top 3 blog posts - match reading preferences and topics of interest
3. Top 3 products - based on purchase history and subscription tier
4. For EACH recommendation, explain WHY it matches this specific user
5. Calculate a match score (0-1) based on behavior alignment
6. Generate a personalized engagement message that references their specific interests
7. Identify potential upsell opportunities (e.g., premium content, subscription upgrades)

Make recommendations feel personal and thoughtful, not generic.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            streams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                  match_score: { type: "number" },
                  why_personalized: { type: "string" }
                }
              }
            },
            blogs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                  match_score: { type: "number" },
                  why_personalized: { type: "string" }
                }
              }
            },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                  match_score: { type: "number" },
                  why_personalized: { type: "string" }
                }
              }
            },
            personalized_message: { type: "string" },
            engagement_tips: { type: "array", items: { type: "string" } },
            upsell_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  value_proposition: { type: "string" }
                }
              }
            }
          }
        }
      });

      setIsAnalyzing(false);
      return result;
    },
    onSuccess: (data) => {
      setRecommendations(data);
    },
    onError: () => {
      setIsAnalyzing(false);
    }
  });

  useEffect(() => {
    if (user && userActivities.length > 0 && !recommendations && !isAnalyzing) {
      generateRecommendationsMutation.mutate();
    }
  }, [user, userActivities]);

  if (!user) return null;

  if (userActivities.length === 0) {
    return (
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Start Exploring!</h3>
          <p className="text-slate-400 mb-4">Watch streams, read posts, and interact to get personalized recommendations</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to={createPageUrl("LiveStreams")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Radio className="w-4 h-4 mr-2" />
                Watch Streams
              </Button>
            </Link>
            <Link to={createPageUrl("Blog")}>
              <Button variant="outline" className="border-slate-600 text-slate-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Read Blog
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || isAnalyzing) {
    return (
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Analyzing your preferences and generating personalized recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized Message */}
      {recommendations.personalized_message && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Personalized Just For You</h3>
                <p className="text-slate-300 mb-4">{recommendations.personalized_message}</p>
                {recommendations.engagement_tips && recommendations.engagement_tips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recommendations.engagement_tips.map((tip, idx) => (
                      <Badge key={idx} className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {tip}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommended Streams/Videos */}
        {recommendations.streams?.length > 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Play className="w-5 h-5 text-cyan-400" />
                Watch Next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.streams.map((rec) => {
                const stream = liveStreams.find(s => s.id === rec.id) || videos.find(v => v.id === rec.id);
                if (!stream) return null;

                return (
                  <Link key={rec.id} to={createPageUrl(stream.stream_url ? `LiveStreamView?id=${stream.id}` : `VideoPlayer?id=${stream.id}`)}>
                    <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-20 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            {stream.status === 'live' ? (
                              <Radio className="w-8 h-8 text-white" />
                            ) : (
                              <Play className="w-8 h-8 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{stream.title}</h4>
                            <p className="text-slate-400 text-xs mb-2 line-clamp-2">{rec.why_personalized}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-purple-500 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                {(rec.match_score * 100).toFixed(0)}%
                              </Badge>
                              {stream.status === 'live' && (
                                <Badge variant="destructive" className="text-xs">LIVE</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Recommended Blogs */}
        {recommendations.blogs?.length > 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                Reading List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.blogs.map((rec) => {
                const blog = blogPosts.find(b => b.id === rec.id);
                if (!blog) return null;

                return (
                  <Link key={rec.id} to={createPageUrl(`BlogPost?id=${blog.id}`)}>
                    <Card className="bg-slate-900/50 border-slate-700 hover:border-green-500/50 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <h4 className="text-white font-bold text-sm mb-2 line-clamp-2 group-hover:text-green-400 transition-colors">{blog.title}</h4>
                        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{rec.why_personalized}</p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-500 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {(rec.match_score * 100).toFixed(0)}%
                          </Badge>
                          <span className="text-slate-500 text-xs">{blog.author_name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Recommended Products */}
        {recommendations.products?.length > 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-black flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                You Might Like
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.products.map((rec) => {
                const product = products.find(p => p.id === rec.id);
                if (!product) return null;

                return (
                  <Link key={rec.id} to={createPageUrl(`Store`)}>
                    <Card className="bg-slate-900/50 border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-bold text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">{product.name}</h4>
                          <span className="text-cyan-400 font-bold text-sm ml-2 flex-shrink-0">${product.price}</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{rec.why_personalized}</p>
                        <Badge className="bg-amber-500 text-xs">
                          <Heart className="w-3 h-3 mr-1" />
                          {(rec.match_score * 100).toFixed(0)}%
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upsell Opportunities */}
      {recommendations.upsell_opportunities && recommendations.upsell_opportunities.length > 0 && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Unlock More
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.upsell_opportunities.map((opp, idx) => (
                <Card key={idx} className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <h4 className="text-white font-bold text-sm mb-2">{opp.type}</h4>
                    <p className="text-slate-400 text-xs mb-3">{opp.description}</p>
                    <p className="text-green-400 text-xs font-semibold">{opp.value_proposition}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}