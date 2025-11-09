import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  GraduationCap, Search, BookOpen, ThumbsUp, Eye, Lock,
  Crown, Star, TrendingUp, HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function KnowledgeBase() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledgeBase'],
    queryFn: () => base44.entities.KnowledgeBase.filter({ is_published: true }, '-created_date'),
    initialData: [],
  });

  const userTier = user?.subscription_tier || 'free';

  const canAccess = (article) => {
    if (article.access_level === 'free') return true;
    if (article.access_level === 'members' && user) return true;
    if (article.access_level === 'premium' && ['premium', 'vip'].includes(userTier)) return true;
    if (article.access_level === 'vip' && userTier === 'vip') return true;
    return false;
  };

  const filteredArticles = articles.filter(article =>
    article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category) => {
    const icons = {
      getting_started: "🚀",
      faith: "✝️",
      ministry: "🙏",
      theology: "📖",
      practical: "🛠️",
      faq: "❓"
    };
    return icons[category] || icons.faq;
  };

  const getCategoryColor = (category) => {
    const colors = {
      getting_started: "from-blue-500 to-cyan-500",
      faith: "from-purple-500 to-pink-500",
      ministry: "from-green-500 to-emerald-500",
      theology: "from-amber-500 to-orange-500",
      practical: "from-indigo-500 to-blue-500",
      faq: "from-slate-500 to-gray-500"
    };
    return colors[category] || colors.faq;
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Knowledge Base</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Learn about faith, ministry, theology, and spiritual growth
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <BookOpen className="w-4 h-4 mr-2" />
                {articles.length} Articles
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Growing Library
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Articles</TabsTrigger>
            <TabsTrigger value="getting_started" className="data-[state=active]:bg-cyan-500">Getting Started</TabsTrigger>
            <TabsTrigger value="faith" className="data-[state=active]:bg-cyan-500">Faith</TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-cyan-500">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => {
                const hasAccess = canAccess(article);
                
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all h-full ${!hasAccess ? 'opacity-75' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(article.category)} flex items-center justify-center text-2xl`}>
                            {getCategoryIcon(article.category)}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`capitalize ${
                              article.access_level === 'free' ? 'bg-green-500' :
                              article.access_level === 'members' ? 'bg-blue-500' :
                              article.access_level === 'premium' ? 'bg-purple-500' :
                              'bg-amber-500'
                            }`}>
                              {article.access_level === 'free' && 'Free'}
                              {article.access_level === 'members' && 'Members'}
                              {article.access_level === 'premium' && <><Crown className="w-3 h-3 mr-1" />Premium</>}
                              {article.access_level === 'vip' && <><Crown className="w-3 h-3 mr-1" />VIP</>}
                            </Badge>
                            {!hasAccess && (
                              <Lock className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                        </div>

                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{article.excerpt}</p>

                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {article.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-700 text-sm">
                          <div className="flex items-center gap-3 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.views || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {article.helpful_count || 0}
                            </div>
                          </div>
                          
                          {hasAccess ? (
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                              Read
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                              <Lock className="w-3 h-3 mr-1" />
                              Upgrade
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="getting_started" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredArticles.filter(a => a.category === 'getting_started').map((article) => (
                <Card key={article.id} className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                        🚀
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-2">{article.title}</h4>
                        <p className="text-slate-300 text-sm">{article.excerpt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faith" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {filteredArticles.filter(a => a.category === 'faith').map((article) => (
                <Card key={article.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <h4 className="text-white font-bold mb-2">{article.title}</h4>
                    <p className="text-slate-400 text-sm line-clamp-3">{article.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-6">
            <div className="space-y-4">
              {filteredArticles.filter(a => a.category === 'faq').map((article) => (
                <Card key={article.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-white font-bold mb-2">{article.title}</h4>
                        <p className="text-slate-400 text-sm">{article.excerpt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {!user && (
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 mt-12">
            <CardContent className="p-8 text-center">
              <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-black text-2xl mb-3">Unlock Full Access</h3>
              <p className="text-slate-300 mb-6">
                Sign in to access members-only articles and premium content
              </p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="bg-purple-500 hover:bg-purple-600 font-bold">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}