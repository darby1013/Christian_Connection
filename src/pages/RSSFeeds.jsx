import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Rss, ExternalLink, RefreshCw, TrendingUp, Clock
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function RSSFeeds() {
  const [user, setUser] = useState(null);

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

  const { data: feeds = [] } = useQuery({
    queryKey: ['rssFeeds'],
    queryFn: () => base44.entities.RSSFeed.filter({ is_active: true }, '-created_date'),
    initialData: [],
  });

  const getCategoryColor = (category) => {
    const colors = {
      blog: "from-blue-500 to-cyan-500",
      podcast: "from-purple-500 to-pink-500",
      video: "from-red-500 to-rose-500",
      news: "from-amber-500 to-orange-500",
      sermon: "from-green-500 to-emerald-500",
      general: "from-slate-500 to-gray-500"
    };
    return colors[category] || colors.general;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      blog: "📝",
      podcast: "🎙️",
      video: "📹",
      news: "📰",
      sermon: "📖",
      general: "📡"
    };
    return icons[category] || icons.general;
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Rss className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">RSS Feeds</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Stay updated with the latest Christian content from around the web
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                {feeds.length} Feeds
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto-Updated
              </Badge>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Feeds</TabsTrigger>
            <TabsTrigger value="blogs" className="data-[state=active]:bg-cyan-500">Blogs</TabsTrigger>
            <TabsTrigger value="podcasts" className="data-[state=active]:bg-cyan-500">Podcasts</TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-cyan-500">News</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeds.map((feed, index) => (
                <motion.div
                  key={feed.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-[#1a1f3a] border-slate-700 hover:border-orange-500 transition-all h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(feed.category)} flex items-center justify-center text-2xl`}>
                          {getCategoryIcon(feed.category)}
                        </div>
                        <Badge className="bg-orange-500 capitalize">{feed.category}</Badge>
                      </div>

                      <h3 className="text-white font-bold text-lg mb-2">{feed.feed_name}</h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{feed.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700 text-sm">
                        <div className="text-slate-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{feed.item_count || 0} items</span>
                        </div>
                        
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="blogs" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {feeds.filter(f => f.category === 'blog').map((feed) => (
                <Card key={feed.id} className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                        📝
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-2">{feed.feed_name}</h4>
                        <p className="text-slate-300 text-sm mb-3">{feed.description}</p>
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Subscribe
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="podcasts" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {feeds.filter(f => f.category === 'podcast').map((feed) => (
                <Card key={feed.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-3">
                      🎙️
                    </div>
                    <h4 className="text-white font-bold mb-2">{feed.feed_name}</h4>
                    <p className="text-slate-400 text-sm line-clamp-2">{feed.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <div className="space-y-4">
              {feeds.filter(f => f.category === 'news').map((feed) => (
                <Card key={feed.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">
                          📰
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{feed.feed_name}</h4>
                          <p className="text-slate-400 text-sm">{feed.description}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {feeds.length === 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-12 text-center">
              <Rss className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No RSS Feeds Yet</h3>
              <p className="text-slate-400">Check back soon for curated content feeds</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}