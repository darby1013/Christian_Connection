import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, MessageSquare, BookOpen, Calendar, Heart, Radio,
  Video, Trophy, Gift, Library, Megaphone, UserPlus, Rss,
  Crown, Lock, TrendingUp, Star
} from "lucide-react";
import { motion } from "framer-motion";

export default function Community() {
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

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date', 6),
    initialData: [],
  });

  const { data: forums = [] } = useQuery({
    queryKey: ['forumThreads'],
    queryFn: () => base44.entities.ForumThread.list('-created_date', 6),
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-start_date', 6),
    initialData: [],
  });

  const communityFeatures = [
    {
      title: "Groups",
      description: "Join communities of believers with shared interests",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      link: createPageUrl("Groups"),
      count: groups.length,
      badge: "Active"
    },
    {
      title: "Forums",
      description: "Discuss faith, theology, and life together",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
      link: createPageUrl("Forum"),
      count: forums.length,
      badge: "Discussions"
    },
    {
      title: "Chatrooms",
      description: "Real-time conversations on various topics",
      icon: MessageSquare,
      color: "from-green-500 to-emerald-500",
      link: createPageUrl("Chatrooms"),
      count: "Live",
      badge: "New"
    },
    {
      title: "Events",
      description: "Upcoming gatherings, services, and activities",
      icon: Calendar,
      color: "from-amber-500 to-orange-500",
      link: createPageUrl("Events"),
      count: events.length,
      badge: "Upcoming"
    },
    {
      title: "Blog",
      description: "Read inspiring articles and testimonies",
      icon: BookOpen,
      color: "from-red-500 to-rose-500",
      link: createPageUrl("Blog"),
      count: "Featured",
      badge: "Popular"
    },
    {
      title: "Prayer Requests",
      description: "Share prayer needs and support others",
      icon: Heart,
      color: "from-pink-500 to-fuchsia-500",
      link: createPageUrl("PrayerWall"),
      count: "Live",
      badge: "Urgent"
    },
    {
      title: "Live Streams",
      description: "Watch live worship, teachings, and events",
      icon: Radio,
      color: "from-violet-500 to-purple-500",
      link: createPageUrl("LiveStreams"),
      count: "Live",
      badge: "Streaming"
    },
    {
      title: "Podcasts",
      description: "Listen to sermons and faith-based content",
      icon: Video,
      color: "from-indigo-500 to-blue-500",
      link: createPageUrl("Podcasts"),
      count: "Latest",
      badge: "Audio"
    },
    {
      title: "Leaderboard",
      description: "See top contributors and earn badges",
      icon: Trophy,
      color: "from-yellow-500 to-amber-500",
      link: createPageUrl("Leaderboard"),
      count: "Rankings",
      badge: "Gamified"
    },
    {
      title: "Community Board",
      description: "Share announcements and community updates",
      icon: Megaphone,
      color: "from-cyan-500 to-teal-500",
      link: createPageUrl("CommunityBoard"),
      count: "Posts",
      badge: "Active"
    },
    {
      title: "Volunteer",
      description: "Serve and make a difference",
      icon: UserPlus,
      color: "from-green-600 to-lime-500",
      link: createPageUrl("Volunteer"),
      count: "Opportunities",
      badge: "Serve"
    },
    {
      title: "Resources",
      description: "Access Bible studies, courses, and materials",
      icon: Library,
      color: "from-slate-500 to-gray-500",
      link: createPageUrl("Resources"),
      count: "Library",
      badge: "Free"
    },
    {
      title: "RSS Feeds",
      description: "Subscribe to content from external sources",
      icon: Rss,
      color: "from-orange-500 to-red-500",
      link: createPageUrl("RSSFeeds"),
      count: "Feeds",
      badge: "Synced"
    },
  ];

  const isPremium = user?.subscription_tier === 'premium' || user?.subscription_tier === 'vip';

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 text-white py-20">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              Community Hub
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-3xl mx-auto">
              Connect, grow, and thrive together in faith. Join discussions, share experiences, and build lasting relationships.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                10,000+ Members
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <MessageSquare className="w-4 h-4 mr-2" />
                50+ Active Discussions
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                100+ Daily Activities
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-[#1a1f3a] border border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Features</TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-cyan-500">Popular</TabsTrigger>
              {isPremium && (
                <TabsTrigger value="premium" className="data-[state=active]:bg-cyan-500">
                  <Crown className="w-4 h-4 mr-2" />
                  Premium
                </TabsTrigger>
              )}
            </TabsList>

            {!user && (
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
                Join Community
              </Button>
            )}
          </div>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {communityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={feature.link}>
                    <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 group overflow-hidden h-full">
                      <CardContent className="p-6">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <feature.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-bold text-lg">{feature.title}</h3>
                          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            {feature.badge}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{feature.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{feature.count}</span>
                          <span className="text-cyan-400 font-semibold group-hover:text-cyan-300">
                            Explore →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityFeatures.slice(0, 6).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={feature.link}>
                    <Card className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1629] border-2 border-cyan-500/30 hover:border-cyan-500 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                            <feature.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-base">{feature.title}</h3>
                            <Badge className="bg-amber-500 text-white text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {isPremium && (
            <TabsContent value="premium" className="mt-6">
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 mb-6">
                <CardContent className="p-6 text-center">
                  <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-white font-black text-2xl mb-2">Premium Member Benefits</h3>
                  <p className="text-slate-300 mb-4">Access exclusive features and priority support</p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Badge className="bg-amber-500 text-white">Ad-Free Experience</Badge>
                    <Badge className="bg-purple-500 text-white">Exclusive Content</Badge>
                    <Badge className="bg-blue-500 text-white">Priority Support</Badge>
                    <Badge className="bg-green-500 text-white">Early Access</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "VIP Chatrooms", icon: Lock, color: "from-amber-500 to-orange-500" },
                  { title: "Premium Resources", icon: Library, color: "from-purple-500 to-pink-500" },
                  { title: "Exclusive Events", icon: Calendar, color: "from-blue-500 to-cyan-500" },
                ].map((feature, index) => (
                  <Card key={index} className="bg-[#1a1f3a] border-2 border-amber-500/30">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-bold">{feature.title}</h4>
                      <Badge className="bg-amber-500 text-white text-xs mt-2">Premium Only</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Call to Action */}
        {!user && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 mt-12">
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-white font-black text-3xl mb-3">Join Our Community Today</h3>
              <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
                Connect with thousands of believers, access exclusive content, and grow in your faith journey.
              </p>
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg px-12 py-6"
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}