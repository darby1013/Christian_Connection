import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, X, FileText, Video, Mic2, GraduationCap, ShoppingBag,
  Calendar, Users, Sparkles, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GlobalSearch({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  const { data: blogs = [] } = useQuery({
    queryKey: ['searchBlogs'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-created_date', 50),
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['searchVideos'],
    queryFn: () => base44.entities.Video.list('-created_date', 50),
    initialData: [],
  });

  const { data: podcasts = [] } = useQuery({
    queryKey: ['searchPodcasts'],
    queryFn: () => base44.entities.Podcast.filter({ publish_status: 'published' }, '-published_date', 50),
    initialData: [],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['searchCourses'],
    queryFn: () => base44.entities.Course.filter({ is_published: true }, '-created_date', 50),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['searchProducts'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }, '-created_date', 50),
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['searchEvents'],
    queryFn: () => base44.entities.Event.list('-start_date', 50),
    initialData: [],
  });

  const handleAISearch = async () => {
    if (searchQuery.length < 3) return;

    setSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this search query and provide intelligent search results:
        Query: "${searchQuery}"
        
        Available content types: blog posts, videos, podcasts, courses, products, events
        
        Understand user intent and suggest:
        1. What type of content they're looking for
        2. Related search terms
        3. Category suggestions
        4. Relevant tags
        
        Be conversational and helpful.`,
        response_json_schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            content_types: {
              type: "array",
              items: { type: "string" }
            },
            related_searches: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: { type: "string" }
          }
        }
      });

      setAiResults(result);
    } catch (error) {
      console.error('AI search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Basic text search
  const searchResults = {
    blogs: blogs.filter(item => 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    videos: videos.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    podcasts: podcasts.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    courses: courses.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    products: products.filter(item =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    events: events.filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  };

  const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);

  React.useEffect(() => {
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        handleAISearch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const getResultIcon = (type) => {
    const icons = {
      blogs: FileText,
      videos: Video,
      podcasts: Mic2,
      courses: GraduationCap,
      products: ShoppingBag,
      events: Calendar
    };
    return icons[type] || Search;
  };

  const getResultLink = (type, item) => {
    const links = {
      blogs: createPageUrl("BlogDetail") + `?id=${item.id}`,
      videos: createPageUrl("WatchVideos") + `#${item.id}`,
      podcasts: createPageUrl("PodcastPlayer") + `?id=${item.id}`,
      courses: createPageUrl("CourseDetail") + `?id=${item.id}`,
      products: createPageUrl("Store") + `#${item.id}`,
      events: createPageUrl("EventDetail") + `?id=${item.id}`
    };
    return links[type];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[80vh] overflow-hidden p-0">
        <div className="sticky top-0 bg-[#1a1f3a] border-b border-slate-700 p-6 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white text-lg h-12"
              autoFocus
            />
            {searching && (
              <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5 animate-spin" />
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {searchQuery.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Start Searching</h3>
              <p className="text-slate-400">Type to search across all content</p>
            </div>
          ) : (
            <div className="space-y-6">
              {aiResults && (
                <Card className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-white font-semibold mb-2">AI Insights</p>
                        <p className="text-slate-300 text-sm mb-3">{aiResults.suggestions}</p>
                        {aiResults.related_searches && aiResults.related_searches.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {aiResults.related_searches.map((term, idx) => (
                              <Badge 
                                key={idx} 
                                className="bg-purple-500/20 text-purple-300 cursor-pointer hover:bg-purple-500/30"
                                onClick={() => setSearchQuery(term)}
                              >
                                {term}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {totalResults === 0 && !searching ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg mb-2">No Results Found</h3>
                  <p className="text-slate-400">Try different keywords</p>
                </div>
              ) : (
                <>
                  {Object.entries(searchResults).map(([type, items]) => {
                    if (items.length === 0) return null;
                    
                    const Icon = getResultIcon(type);
                    
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h3 className="text-white font-bold capitalize">{type}</h3>
                          <Badge className="bg-slate-700">{items.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <Link
                              key={item.id}
                              to={getResultLink(type, item)}
                              onClick={onClose}
                              className="block p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                            >
                              <h4 className="text-white font-semibold mb-1">
                                {item.title || item.name}
                              </h4>
                              <p className="text-slate-400 text-sm line-clamp-1">
                                {item.description || item.excerpt}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}