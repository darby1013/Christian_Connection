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
  Users, MessageSquare, BookOpen, Radio, Heart, UserPlus,
  Award, Sparkles, Lock, Crown, TrendingUp, Rss, BookMarked,
  MessagesSquare, Calendar, Megaphone, Star, GraduationCap
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
    queryFn: () => base44.entities.Group.list('-created_date', 5),
    initialData: [],
  });

  const { data: forumThreads = [] } = useQuery({
    queryKey: ['forumThreads'],
    queryFn: () => base44.entities.ForumThread.list('-created_date', 5),
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_date', 5),
    initialData: [],
  });

  const userTier = user?.subscription_tier || 'free';

  const communityFeatures = [
    {
      title: "Groups",
      description: "Join communities that share your interests and passions",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      link: createPageUrl("Groups"),
      count: groups.length,
      badge: "Public",
      badgeColor: "bg-green-500"
    },
    {
      title: "Forums",
      description: "Engage in discussions and get answers to your questions",
      icon: MessagesSquare,
      color: "from-purple-500 to-pink-500",
      link: createPageUrl("Forum"),
      count: forumThreads.length,
      badge: "Active",
      badgeColor: "bg-blue-500"
    },
    {
      title: "Blog",
      description: "Read inspiring articles and share your faith journey",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500",
      link: createPageUrl("Blog"),
      count: blogPosts.length,
      badge: "Featured",
      badgeColor: "bg-amber-500"
    },
    {
      title: "Chatrooms",
      description: "Real-time conversations with fellow believers",
      icon: MessageSquare,
      color: "from-green-500 to-emerald-500",
      link: createPageUrl("Chatrooms"),
      badge: "Live",
      badgeColor: "bg-red-500"
    },
    {
      title: "Prayer Wall",
      description: "Share prayer requests and pray for others",
      icon: Heart,
      color: "from-red-500 to-rose-500",
      link: createPageUrl("PrayerWall"),
      badge: "Active",
      badgeColor: "bg-pink-500"
    },
    {
      title: "Community Board",
      description: "Announcements, updates, and community news",
      icon: Megaphone,
      color: "from-indigo-500 to-blue-500",
      link: createPageUrl("CommunityBoard"),
      badge: "Updated",
      badgeColor: "bg-cyan-500"
    },
    {
      title: "Testimonies",
      description: "Share and read powerful testimonies of faith",
      icon: Star,
      color: "from-yellow-500 to-amber-500",
      link: createPageUrl("Testimonies"),
      badge: "Inspiring",
      badgeColor: "bg-yellow-500"
    },
    {
      title: "Member Directory",
      description: "Connect with other members of the community",
      icon: UserPlus,
      color: "from-teal-500 to-cyan-500",
      link: createPageUrl("MemberDirectory"),
      badge: userTier === 'free' ? 'Members Only' : 'Access',
      badgeColor: userTier === 'free' ? 'bg-slate-600' : 'bg-green-500',
      locked: userTier === 'free'
    },
    {
      title: "Knowledge Base",
      description: "Learn about faith, ministry, and spiritual growth",
      icon: GraduationCap,
      color: "from-violet-500 to-purple-500",
      link: createPageUrl("KnowledgeBase"),
      badge: "Learning",
      badgeColor: "bg-purple-500"
    },
    {
      title: "Volunteer",
      description: "Serve and make a difference in your community",
      icon: Award,
      color: "from-pink-500 to-fuchsia-500",
      link: createPageUrl("Volunteer"),
      badge: "Opportunities",
      badgeColor: "bg-pink-500"
    },
    {
      title: "Resources",
      description: "Access Bible studies, courses, and materials",
      icon: BookMarked,
      color: "from-cyan-500 to-blue-500",
      link: createPageUrl("Resources"),
      badge: userTier === 'free' ? 'Limited' : 'Full Access',
      badgeColor: userTier === 'free' ? 'bg-slate-600' : 'bg-green-500',
      locked: userTier === 'free'
    },
    {
      title: "RSS Feeds",
      description: "Stay updated with external content and news",
      icon: Rss,
      color: "from-orange-500 to-red-500",
      link: createPageUrl("RSSFeeds"),
      badge: "Auto-Updated",
      badgeColor: "bg-orange-500"
    }
  ];

  const premiumFeatures = communityFeatures.filter(f => f.locked);
  const publicFeatures = communityFeatures.filter(f => !f.locked);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Community Hub</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Connect, share, and grow together in faith
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                12 Active Sections
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Growing Community
              </Badge>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700 w-full justify-center mb-8">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Features</TabsTrigger>
            <TabsTrigger value="popular" className="data-[state=active]:bg-cyan-500">Most Popular</TabsTrigger>
            {user && (
              <TabsTrigger value="member" className="data-[state=active]:bg-cyan-500">
                <Crown className="w-4 h-4 mr-2" />
                Member Access
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={feature.locked && !user ? "#" : feature.link}>
                      <Card className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all h-full ${feature.locked && !user ? 'opacity-75' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center relative`}>
                              <Icon className="w-7 h-7 text-white" />
                              {feature.locked && !user && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                            <Badge className={feature.badgeColor}>
                              {feature.badge}
                            </Badge>
                          </div>
                          
                          <h3 className="text-white font-black text-xl mb-2">{feature.title}</h3>
                          <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
                          
                          {feature.count !== undefined && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                              <span className="text-slate-500 text-sm">
                                {feature.count} {feature.count === 1 ? 'item' : 'items'}
                              </span>
                              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                                Explore
                              </Button>
                            </div>
                          )}

                          {feature.locked && !user && (
                            <Button
                              size="sm"
                              className="w-full mt-4 bg-purple-500 hover:bg-purple-600"
                              onClick={(e) => {
                                e.preventDefault();
                                base44.auth.redirectToLogin();
                              }}
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              Sign In to Access
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicFeatures.slice(0, 6).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={feature.link}>
                      <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 hover:border-cyan-500 transition-all h-full">
                        <CardContent className="p-6">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-white font-black text-xl mb-2">{feature.title}</h3>
                          <p className="text-slate-300 text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {user && (
            <TabsContent value="member" className="space-y-8">
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-black text-xl mb-1">Your Membership: {userTier.toUpperCase()}</h3>
                      <p className="text-slate-300">
                        {userTier === 'free' 
                          ? 'Upgrade to unlock premium features and exclusive content'
                          : 'You have full access to all community features'}
                      </p>
                    </div>
                    {userTier === 'free' && (
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold">
                        Upgrade Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {premiumFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  const hasAccess = userTier !== 'free';
                  
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={hasAccess ? feature.link : "#"}>
                        <Card className={`bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all h-full ${!hasAccess ? 'opacity-75' : ''}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center relative`}>
                                <Icon className="w-7 h-7 text-white" />
                                {!hasAccess && (
                                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-white" />
                                  </div>
                                )}
                              </div>
                              <Badge className={hasAccess ? "bg-green-500" : "bg-slate-600"}>
                                {hasAccess ? "Unlocked" : "Locked"}
                              </Badge>
                            </div>
                            
                            <h3 className="text-white font-black text-xl mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm">{feature.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {!user && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 mt-12">
            <CardContent className="p-8 text-center">
              <UserPlus className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-white font-black text-2xl mb-3">Join Our Community</h3>
              <p className="text-slate-300 mb-6 max-w-xl mx-auto">
                Sign in to access exclusive features, connect with members, and unlock premium content
              </p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600 font-bold text-lg px-8">
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}