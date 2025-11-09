import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download, Eye, Star, FileText, Video, Headphones,
  BookOpen, GraduationCap, File, Lock, Crown, Search
} from "lucide-react";

export default function Resources() {
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

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.ResourceLibrary.list('-created_date'),
    initialData: [],
  });

  const filteredResources = resources.filter(res =>
    res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userTier = user?.subscription_tier || 'free';

  const canAccess = (resource) => {
    if (resource.access_level === 'free') return true;
    if (resource.access_level === 'members' && user) return true;
    if (resource.access_level === 'premium' && ['premium', 'vip'].includes(userTier)) return true;
    if (resource.access_level === 'vip' && userTier === 'vip') return true;
    return false;
  };

  const getResourceIcon = (type) => {
    const icons = {
      document: FileText,
      video: Video,
      audio: Headphones,
      ebook: BookOpen,
      course: GraduationCap,
      template: File
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type) => {
    const colors = {
      document: "from-blue-500 to-cyan-500",
      video: "from-red-500 to-rose-500",
      audio: "from-purple-500 to-pink-500",
      ebook: "from-green-500 to-emerald-500",
      course: "from-amber-500 to-orange-500",
      template: "from-indigo-500 to-blue-500"
    };
    return colors[type] || colors.document;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Resource Library</h1>
          <p className="text-lg text-slate-400">Access Bible studies, courses, and faith-building materials</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">All Resources</TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-cyan-500">Courses</TabsTrigger>
            <TabsTrigger value="ebooks" className="data-[state=active]:bg-cyan-500">eBooks</TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-cyan-500">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const ResourceIcon = getResourceIcon(resource.resource_type);
                const hasAccess = canAccess(resource);

                return (
                  <Card key={resource.id} className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all ${!hasAccess ? 'opacity-75' : ''}`}>
                    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
                      {resource.thumbnail_url ? (
                        <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getTypeColor(resource.resource_type)} flex items-center justify-center`}>
                          <ResourceIcon className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <Lock className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 right-3 ${
                        resource.access_level === 'free' ? 'bg-green-500' :
                        resource.access_level === 'members' ? 'bg-blue-500' :
                        resource.access_level === 'premium' ? 'bg-purple-500' :
                        'bg-amber-500'
                      }`}>
                        {resource.access_level === 'free' && 'Free'}
                        {resource.access_level === 'members' && 'Members'}
                        {resource.access_level === 'premium' && <><Crown className="w-3 h-3 mr-1" />Premium</>}
                        {resource.access_level === 'vip' && <><Crown className="w-3 h-3 mr-1" />VIP</>}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-slate-700 capitalize">{resource.resource_type}</Badge>
                        {resource.is_featured && (
                          <Badge className="bg-amber-500">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{resource.title}</h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{resource.description}</p>
                      <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {resource.downloads || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {resource.views || 0}
                          </span>
                        </div>
                        {resource.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-amber-400">{resource.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {hasAccess ? (
                        <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <Button className="w-full bg-purple-500 hover:bg-purple-600" onClick={() => base44.auth.redirectToLogin()}>
                          <Lock className="w-4 h-4 mr-2" />
                          Upgrade to Access
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {filteredResources.filter(r => r.resource_type === 'course').map((resource) => (
                <Card key={resource.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                  <CardContent className="p-5">
                    <GraduationCap className="w-12 h-12 text-amber-400 mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">{resource.title}</h3>
                    <p className="text-slate-300 text-sm mb-4">{resource.description}</p>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600">
                      Start Course
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ebooks" className="mt-6">
            <div className="grid md:grid-cols-4 gap-4">
              {filteredResources.filter(r => r.resource_type === 'ebook').map((resource) => (
                <Card key={resource.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-4">
                    <BookOpen className="w-10 h-10 text-green-400 mb-2" />
                    <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{resource.title}</h4>
                    <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 mt-2">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.filter(r => r.resource_type === 'video').map((resource) => (
                <Card key={resource.id} className="bg-[#1a1f3a] border-slate-700">
                  <div className="aspect-video bg-slate-900">
                    {resource.thumbnail_url && (
                      <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="text-white font-bold text-sm mb-2">{resource.title}</h4>
                    <Button size="sm" className="w-full bg-red-500 hover:bg-red-600">
                      <Video className="w-4 h-4 mr-2" />
                      Watch
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}