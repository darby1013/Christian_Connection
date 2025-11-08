
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Eye, Heart, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_date'),
    initialData: [],
  });

  const categories = ["all", ...new Set(posts.map(p => p.category).filter(Boolean))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.slice(0, 3);
  const recentPosts = filteredPosts.slice(3);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Faith & Life Blog</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Inspiration, insights, and practical wisdom for your spiritual journey
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
          <div className="flex justify-center">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="flex-wrap h-auto bg-[#1a1f3a] border border-slate-700">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="capitalize data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <Link key={post.id} to={createPageUrl(`BlogPost?id=${post.id}`)}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden h-full bg-[#1a1f3a] text-white">
                    <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500">
                      <img
                        src={post.featured_image || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <Badge className="mb-2 bg-cyan-500 hover:bg-cyan-600 text-white">{post.category}</Badge>
                        <h3 className="text-white font-bold text-xl line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-slate-300 mb-4 line-clamp-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span className="font-medium">{post.author_name}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.likes}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-slate-100 mb-8">Recent Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <Link key={post.id} to={createPageUrl(`BlogPost?id=${post.id}`)}>
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full bg-[#1a1f3a] text-white border border-slate-700">
                    <div className="relative aspect-video bg-slate-200">
                      <img
                        src={post.featured_image || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600'}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-5">
                      <Badge variant="outline" className="mb-3 bg-slate-800 text-slate-300 border-slate-600">{post.category}</Badge>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-500 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{post.author_name}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(post.published_date), "MMM d")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No articles found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
