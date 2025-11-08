import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Star, Play, BookOpen, Radio } from "lucide-react";

export default function PersonalizedContent({ user }) {
  const [recommendations, setRecommendations] = useState(null);

  const { data: userActivities = [] } = useQuery({
    queryKey: ['userActivities', user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user,
    initialData: [],
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ['liveStreamsForRec'],
    queryFn: () => base44.entities.LiveStream.list('-created_date', 20),
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videosForRec'],
    queryFn: () => base44.entities.Video.list('-created_date', 20),
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blogPostsForRec'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-created_date', 20),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['productsForRec'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 20),
    initialData: [],
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const activitySummary = {
        viewed_categories: [...new Set(userActivities.map(a => a.content_category).filter(Boolean))],
        liked_content: userActivities.filter(a => a.activity_type === 'like').map(a => a.content_title),
        most_engaged: userActivities
          .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
          .slice(0, 5)
          .map(a => ({ type: a.content_type, title: a.content_title, category: a.content_category })),
        subscription_level: user?.subscription_tier || 'free'
      };

      const availableContent = {
        streams: liveStreams.map(s => ({ id: s.id, title: s.title, category: s.category, type: 'stream' })),
        videos: videos.map(v => ({ id: v.id, title: v.title, category: v.category, type: 'video' })),
        blogs: blogPosts.map(b => ({ id: b.id, title: b.title, category: b.category, type: 'blog' })),
        products: products.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, type: 'product' }))
      };

      const prompt = `Based on this user's activity on a Christian community platform, recommend personalized content:

USER PROFILE:
- Subscription: ${activitySummary.subscription_level}
- Favorite categories: ${activitySummary.viewed_categories.join(', ') || 'None yet'}
- Recently liked: ${activitySummary.liked_content.slice(0, 5).join(', ') || 'None yet'}

MOST ENGAGED CONTENT:
${JSON.stringify(activitySummary.most_engaged, null, 2)}

AVAILABLE CONTENT:
${JSON.stringify(availableContent, null, 2).substring(0, 2000)}

Recommend:
1. Top 3 live streams/videos to watch
2. Top 3 blog posts to read
3. Top 2 products they might like
4. Reason for each recommendation
5. Personalized message encouraging engagement`;

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
                  match_score: { type: "number" }
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
                  match_score: { type: "number" }
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
                  match_score: { type: "number" }
                }
              }
            },
            personalized_message: { type: "string" }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setRecommendations(data);
    }
  });

  React.useEffect(() => {
    if (user && userActivities.length > 0 && !recommendations) {
      generateRecommendationsMutation.mutate();
    }
  }, [user, userActivities]);

  if (!user) return null;

  if (!recommendations && userActivities.length === 0) {
    return (
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Start Exploring!</h3>
          <p className="text-slate-400">Watch streams, read posts, and interact to get personalized recommendations</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Analyzing your preferences...</p>
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
              <Sparkles className="w-6 h-6 text-purple-400 mt-1" />
              <div>
                <h3 className="text-white font-bold mb-2">Recommended For You</h3>
                <p className="text-slate-300">{recommendations.personalized_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <Card className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                          {stream.status === 'live' ? (
                            <Radio className="w-8 h-8 text-white" />
                          ) : (
                            <Play className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold mb-1">{stream.title}</h4>
                          <p className="text-slate-400 text-sm mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500">
                              <Star className="w-3 h-3 mr-1" />
                              {(rec.match_score * 100).toFixed(0)}% match
                            </Badge>
                            {stream.status === 'live' && (
                              <Badge variant="destructive">LIVE</Badge>
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
                  <Card className="bg-slate-900/50 border-slate-700 hover:border-green-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="text-white font-bold mb-2">{blog.title}</h4>
                      <p className="text-slate-400 text-sm mb-2">{rec.reason}</p>
                      <Badge className="bg-green-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {(rec.match_score * 100).toFixed(0)}% match
                      </Badge>
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
              <Star className="w-5 h-5 text-amber-400" />
              You Might Like
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.products.map((rec) => {
              const product = products.find(p => p.id === rec.id);
              if (!product) return null;

              return (
                <Link key={rec.id} to={createPageUrl(`Store`)}>
                  <Card className="bg-slate-900/50 border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-bold">{product.name}</h4>
                        <span className="text-cyan-400 font-bold">${product.price}</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">{rec.reason}</p>
                      <Badge className="bg-amber-500">
                        <Star className="w-3 h-3 mr-1" />
                        {(rec.match_score * 100).toFixed(0)}% match
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
  );
}