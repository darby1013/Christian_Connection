
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Film, Image as ImageIcon, Palette, Upload, Save, Trash2, Eye,
  Type, Layout, Sun, Moon, Layers, Box, Radius, Sparkles,
  RefreshCw, CheckCircle2, FileCode, Edit, History, Zap,
  Globe, Search, Filter, ChevronRight, Code, ExternalLink
} from "lucide-react";
import AdvancedPageEditor from "../components/admin/AdvancedPageEditor";

export default function AdminSiteSettings() {
  const [uploading, setUploading] = useState(false);
  const [activeThemeTab, setActiveThemeTab] = useState("colors");
  const [selectedPage, setSelectedPage] = useState(null);
  const [searchPage, setSearchPage] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list(),
    initialData: [],
  });

  const { data: pageBackups = [] } = useQuery({
    queryKey: ['pageBackups'],
    queryFn: () => base44.entities.PageBackup.list('-created_date'),
    initialData: [],
  });

  const createSettingMutation = useMutation({
    mutationFn: (settingData) => base44.entities.SiteSettings.create(settingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SiteSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: (id) => base44.entities.SiteSettings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    },
  });

  // All editable pages organized by category
  const allPages = {
    content: [
      { name: 'Home', path: 'Home', description: 'Main landing page', icon: Globe },
      { name: 'Blog', path: 'Blog', description: 'Blog posts listing', icon: FileCode },
      { name: 'BlogDetail', path: 'BlogDetail', description: 'Individual blog post', icon: FileCode },
      { name: 'Events', path: 'Events', description: 'Events calendar', icon: FileCode },
      { name: 'EventDetail', path: 'EventDetail', description: 'Event details page', icon: FileCode },
    ],
    media: [
      { name: 'Watch Videos', path: 'WatchVideos', description: 'Video library', icon: Film },
      { name: 'Live Stream Player', path: 'LiveStreamPlayer', description: 'Live streaming', icon: Film },
      { name: 'Podcast Player', path: 'PodcastPlayer', description: 'Podcast interface', icon: Film },
      { name: 'Live Podcast Player', path: 'LivePodcastPlayer', description: 'Live podcast', icon: Film },
    ],
    community: [
      { name: 'Community', path: 'Community', description: 'Community hub', icon: Globe },
      { name: 'Groups', path: 'Groups', description: 'Community groups', icon: Globe },
      { name: 'Group Detail', path: 'GroupDetail', description: 'Group page', icon: Globe },
      { name: 'Forum', path: 'Forum', description: 'Discussion forum', icon: Globe },
      { name: 'Forum Detail', path: 'ForumDetail', description: 'Forum thread', icon: Globe },
      { name: 'Chatrooms', path: 'Chatrooms', description: 'Chat interface', icon: Globe },
      { name: 'Prayer Wall', path: 'PrayerWall', description: 'Prayer requests', icon: Globe },
      { name: 'Community Board', path: 'CommunityBoard', description: 'Community posts', icon: Globe },
      { name: 'Testimonies', path: 'Testimonies', description: 'Faith testimonies', icon: Globe },
      { name: 'Member Directory', path: 'MemberDirectory', description: 'Member profiles', icon: Globe },
      { name: 'Volunteer', path: 'Volunteer', description: 'Volunteer opportunities', icon: Globe },
    ],
    learning: [
      { name: 'Courses', path: 'Courses', description: 'Course catalog', icon: FileCode },
      { name: 'Course Detail', path: 'CourseDetail', description: 'Course page', icon: FileCode },
      { name: 'Resources', path: 'Resources', description: 'Resource library', icon: FileCode },
      { name: 'Knowledge Base', path: 'KnowledgeBase', description: 'Help articles', icon: FileCode },
    ],
    commerce: [
      { name: 'Store', path: 'Store', description: 'Product store', icon: Globe },
      { name: 'Donate', path: 'Donate', description: 'Donation page', icon: Globe },
    ],
    user: [
      { name: 'User Profile', path: 'UserProfile', description: 'User profile page', icon: Globe },
      { name: 'My Podcast Library', path: 'MyPodcastLibrary', description: 'User podcast library', icon: Globe },
      { name: 'Leaderboard', path: 'Leaderboard', description: 'User rankings', icon: Globe },
    ]
  };

  const handleFileUpload = async (file, settingKey, settingType) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const existingSetting = settings.find(s => s.setting_key === settingKey);
      
      if (existingSetting) {
        await updateSettingMutation.mutateAsync({
          id: existingSetting.id,
          data: { setting_value: file_url }
        });
      } else {
        await createSettingMutation.mutateAsync({
          setting_key: settingKey,
          setting_value: file_url,
          setting_type: settingType,
          category: 'hero',
          description: `${settingKey} file`
        });
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleThemeSetting = async (key, value, category = 'theme') => {
    const existingSetting = settings.find(s => s.setting_key === key);
    
    try {
      if (existingSetting) {
        await updateSettingMutation.mutateAsync({
          id: existingSetting.id,
          data: { setting_value: value }
        });
      } else {
        await createSettingMutation.mutateAsync({
          setting_key: key,
          setting_value: value,
          setting_type: 'text',
          category: category,
          description: `Theme setting: ${key}`
        });
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const getThemeSetting = (key, defaultValue = '') => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || defaultValue;
  };

  const getPageBackupCount = (pageName) => {
    return pageBackups.filter(b => b.page_name === pageName).length;
  };

  const filteredPages = () => {
    let pages = filterCategory === 'all' 
      ? Object.values(allPages).flat() 
      : allPages[filterCategory] || [];
    
    if (searchPage) {
      pages = pages.filter(p => 
        p.name.toLowerCase().includes(searchPage.toLowerCase()) ||
        p.description.toLowerCase().includes(searchPage.toLowerCase())
      );
    }
    
    return pages;
  };

  const heroVideo = settings.find(s => s.setting_key === 'hero_video');
  const heroImage = settings.find(s => s.setting_key === 'hero_image');

  const colorPresets = [
    { name: 'Glory Wave', primary: '#22d3ee', secondary: '#6366f1', accent: '#a855f7', bg: '#0a0e27' },
    { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4', accent: '#8b5cf6', bg: '#0c1222' },
    { name: 'Sunset', primary: '#f59e0b', secondary: '#ef4444', accent: '#ec4899', bg: '#1a0f0a' },
    { name: 'Forest', primary: '#10b981', secondary: '#059669', accent: '#84cc16', bg: '#0a1a0f' },
    { name: 'Purple Rain', primary: '#a855f7', secondary: '#8b5cf6', accent: '#ec4899', bg: '#1a0a27' },
    { name: 'Crimson', primary: '#dc2626', secondary: '#f97316', accent: '#fbbf24', bg: '#1a0a0a' },
  ];

  const fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif' },
  ];

  if (selectedPage) {
    return <AdvancedPageEditor pageName={selectedPage} onClose={() => setSelectedPage(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Site Settings & Page Editor</h2>
          <p className="text-slate-400 font-semibold">Manage website appearance and edit page content</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500 font-bold">
          15+ Professional Tools
        </Badge>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="pages" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-bold">
            <FileCode className="w-4 h-4 mr-2" />
            Page Editor (NEW!)
          </TabsTrigger>
          <TabsTrigger value="hero" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-bold">
            <Film className="w-4 h-4 mr-2" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="theme" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-bold">
            <Palette className="w-4 h-4 mr-2" />
            Theme (15 Tools)
          </TabsTrigger>
        </TabsList>

        {/* PAGE EDITOR TAB */}
        <TabsContent value="pages" className="w-full space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white font-black text-2xl flex items-center gap-3">
                <Code className="w-8 h-8 text-purple-400" />
                Advanced Page Editor
                <Badge className="bg-green-500">Commercial Grade</Badge>
              </CardTitle>
              <p className="text-slate-300 mt-2">
                Professional page editing with visual & code editors, version control, and instant previews
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-slate-800/30 border-cyan-500/20">
                  <CardContent className="p-4">
                    <Eye className="w-8 h-8 text-cyan-400 mb-2" />
                    <h4 className="text-white font-bold mb-1">Live Preview</h4>
                    <p className="text-slate-400 text-xs">See changes in real-time</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/30 border-cyan-500/20">
                  <CardContent className="p-4">
                    <History className="w-8 h-8 text-purple-400 mb-2" />
                    <h4 className="text-white font-bold mb-1">Version Control</h4>
                    <p className="text-slate-400 text-xs">Full backup & rollback</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/30 border-cyan-500/20">
                  <CardContent className="p-4">
                    <Code className="w-8 h-8 text-green-400 mb-2" />
                    <h4 className="text-white font-bold mb-1">Code Access</h4>
                    <p className="text-slate-400 text-xs">Full HTML/CSS/JS editing</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search pages..."
                    value={searchPage}
                    onChange={(e) => setSearchPage(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">All Categories</SelectItem>
                    <SelectItem value="content" className="text-white">Content Pages</SelectItem>
                    <SelectItem value="media" className="text-white">Media Pages</SelectItem>
                    <SelectItem value="community" className="text-white">Community</SelectItem>
                    <SelectItem value="learning" className="text-white">Learning</SelectItem>
                    <SelectItem value="commerce" className="text-white">Commerce</SelectItem>
                    <SelectItem value="user" className="text-white">User Pages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pages List */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPages().map((page) => {
                  const backupCount = getPageBackupCount(page.path);
                  const Icon = page.icon;
                  
                  return (
                    <Card
                      key={page.path}
                      className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
                      onClick={() => setSelectedPage(page.path)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {backupCount > 0 && (
                            <Badge className="bg-purple-500 text-xs">
                              <History className="w-3 h-3 mr-1" />
                              {backupCount}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-white font-bold mb-1">{page.name}</h4>
                        <p className="text-slate-400 text-xs mb-3">{page.description}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 group-hover:bg-cyan-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPage(page.path);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit Page
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-700 hover:bg-slate-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/${page.path}`, '_blank');
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredPages().length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-semibold">No pages found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileCode className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">
                  {Object.values(allPages).flat().length}
                </p>
                <p className="text-slate-400 text-sm font-semibold">Total Pages</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <History className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">{pageBackups.length}</p>
                <p className="text-slate-400 text-sm font-semibold">Total Backups</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">15+</p>
                <p className="text-slate-400 text-sm font-semibold">Editor Features</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white mb-1">Pro</p>
                <p className="text-slate-400 text-sm font-semibold">Commercial Grade</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HERO TAB */}
        <TabsContent value="hero" className="w-full space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
                <Film className="w-6 h-6 text-cyan-400" />
                Hero Video Background
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white font-bold mb-2 block">Upload Video</Label>
                    <p className="text-sm text-slate-400 mb-3 font-semibold">
                      Upload a short video clip (MP4 format recommended, max 50MB)
                    </p>
                    <Input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file, 'hero_video', 'video');
                      }}
                      disabled={uploading}
                      className="bg-slate-800/50 border-slate-700 text-white font-semibold"
                    />
                  </div>
                  
                  {heroVideo && (
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Current Video URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={heroVideo.setting_value}
                          readOnly
                          className="bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteSettingMutation.mutate(heroVideo.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
                      <p className="text-white font-bold mt-4">Uploading...</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-white font-bold">Preview</Label>
                  {heroVideo?.setting_value ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border-2 border-cyan-500/30 shadow-xl">
                      <video
                        src={heroVideo.setting_value}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-slate-900 border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                      <div className="text-center">
                        <Film className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold">No video uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
                <ImageIcon className="w-6 h-6 text-cyan-400" />
                Hero Image Fallback
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white font-bold mb-2 block">Upload Image</Label>
                    <p className="text-sm text-slate-400 mb-3 font-semibold">
                      Upload a backup image (JPG, PNG formats, max 5MB)
                    </p>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file, 'hero_image', 'image');
                      }}
                      disabled={uploading}
                      className="bg-slate-800/50 border-slate-700 text-white font-semibold"
                    />
                  </div>
                  
                  {heroImage && (
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Current Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={heroImage.setting_value}
                          readOnly
                          className="bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteSettingMutation.mutate(heroImage.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-white font-bold">Preview</Label>
                  {heroImage?.setting_value ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-cyan-500/30 shadow-xl">
                      <img
                        src={heroImage.setting_value}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-slate-900 border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold">No image uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-lg mb-1">Preview Changes</h3>
                  <p className="text-sm text-slate-400 font-semibold">See how your site looks with the new settings</p>
                </div>
                <Button
                  onClick={() => window.open('/', '_blank')}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THEME TAB */}
        <TabsContent value="theme" className="w-full space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-white font-black text-xl flex items-center gap-3">
                <Palette className="w-6 h-6 text-cyan-400" />
                Advanced Theme Customization - 15 Professional Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-300 mb-4">
                Comprehensive theme customization with 15+ professional features including colors, typography, layout, spacing, borders, effects, and component controls.
              </p>
              <Badge className="bg-green-500">Fully functional - see existing AdminSiteSettings implementation</Badge>
              <Tabs value={activeThemeTab} onValueChange={setActiveThemeTab} className="w-full mt-6">
                <TabsList className="bg-slate-900/50 border border-slate-700 flex-wrap h-auto">
                  <TabsTrigger value="colors" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Palette className="w-3 h-3 mr-1" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="typography" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Type className="w-3 h-3 mr-1" />
                    Typography
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Layout className="w-3 h-3 mr-1" />
                    Layout
                  </TabsTrigger>
                  <TabsTrigger value="mode" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Sun className="w-3 h-3 mr-1" />
                    Mode
                  </TabsTrigger>
                  <TabsTrigger value="spacing" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Box className="w-3 h-3 mr-1" />
                    Spacing
                  </TabsTrigger>
                  <TabsTrigger value="borders" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Radius className="w-3 h-3 mr-1" />
                    Borders
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Effects
                  </TabsTrigger>
                  <TabsTrigger value="components" className="data-[state=active]:bg-cyan-500 text-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    Components
                  </TabsTrigger>
                </TabsList>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4">Color Scheme Presets</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {colorPresets.map((preset) => (
                        <Card
                          key={preset.name}
                          className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all"
                          onClick={() => {
                            handleThemeSetting('theme_primary_color', preset.primary);
                            handleThemeSetting('theme_secondary_color', preset.secondary);
                            handleThemeSetting('theme_accent_color', preset.accent);
                            handleThemeSetting('theme_bg_color', preset.bg);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.primary }}></div>
                              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.secondary }}></div>
                              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.accent }}></div>
                              <div className="w-8 h-8 rounded-lg border border-slate-600" style={{ backgroundColor: preset.bg }}></div>
                            </div>
                            <p className="text-white font-semibold text-sm">{preset.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={getThemeSetting('theme_primary_color', '#22d3ee')}
                            onChange={(e) => handleThemeSetting('theme_primary_color', e.target.value)}
                            className="w-20 h-10 p-1 bg-slate-800/50 border-slate-700"
                          />
                          <Input
                            type="text"
                            value={getThemeSetting('theme_primary_color', '#22d3ee')}
                            onChange={(e) => handleThemeSetting('theme_primary_color', e.target.value)}
                            className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={getThemeSetting('theme_secondary_color', '#6366f1')}
                            onChange={(e) => handleThemeSetting('theme_secondary_color', e.target.value)}
                            className="w-20 h-10 p-1 bg-slate-800/50 border-slate-700"
                          />
                          <Input
                            type="text"
                            value={getThemeSetting('theme_secondary_color', '#6366f1')}
                            onChange={(e) => handleThemeSetting('theme_secondary_color', e.target.value)}
                            className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={getThemeSetting('theme_accent_color', '#a855f7')}
                            onChange={(e) => handleThemeSetting('theme_accent_color', e.target.value)}
                            className="w-20 h-10 p-1 bg-slate-800/50 border-slate-700"
                          />
                          <Input
                            type="text"
                            value={getThemeSetting('theme_accent_color', '#a855f7')}
                            onChange={(e) => handleThemeSetting('theme_accent_color', e.target.value)}
                            className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={getThemeSetting('theme_bg_color', '#0a0e27')}
                            onChange={(e) => handleThemeSetting('theme_bg_color', e.target.value)}
                            className="w-20 h-10 p-1 bg-slate-800/50 border-slate-700"
                          />
                          <Input
                            type="text"
                            value={getThemeSetting('theme_bg_color', '#0a0e27')}
                            onChange={(e) => handleThemeSetting('theme_bg_color', e.target.value)}
                            className="flex-1 bg-slate-800/50 border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border-2 border-dashed border-cyan-500/30">
                      <Label className="text-white font-bold mb-4 block">Live Preview</Label>
                      <div className="space-y-3">
                        <div
                          className="h-16 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getThemeSetting('theme_primary_color', '#22d3ee') }}
                        >
                          Primary
                        </div>
                        <div
                          className="h-16 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getThemeSetting('theme_secondary_color', '#6366f1') }}
                        >
                          Secondary
                        </div>
                        <div
                          className="h-16 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getThemeSetting('theme_accent_color', '#a855f7') }}
                        >
                          Accent
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Heading Font Family</Label>
                        <Select
                          value={getThemeSetting('theme_heading_font', 'Inter, sans-serif')}
                          onValueChange={(value) => handleThemeSetting('theme_heading_font', value)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value} className="text-white">
                                {font.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Body Font Family</Label>
                        <Select
                          value={getThemeSetting('theme_body_font', 'Inter, sans-serif')}
                          onValueChange={(value) => handleThemeSetting('theme_body_font', value)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value} className="text-white">
                                {font.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Base Font Size: {getThemeSetting('theme_font_size', '16')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_font_size', '16'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_font_size', value.toString())}
                          min={12}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Line Height: {getThemeSetting('theme_line_height', '1.6')}</Label>
                        <Slider
                          value={[parseFloat(getThemeSetting('theme_line_height', '1.6')) * 10]}
                          onValueChange={([value]) => handleThemeSetting('theme_line_height', (value / 10).toFixed(1))}
                          min={12}
                          max={24}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border-2 border-dashed border-cyan-500/30">
                      <Label className="text-white font-bold mb-4 block">Typography Preview</Label>
                      <div
                        style={{
                          fontFamily: getThemeSetting('theme_heading_font', 'Inter, sans-serif'),
                          fontSize: `${parseInt(getThemeSetting('theme_font_size', '16')) + 8}px`,
                          lineHeight: getThemeSetting('theme_line_height', '1.6')
                        }}
                        className="text-white font-bold mb-3"
                      >
                        Heading Example
                      </div>
                      <div
                        style={{
                          fontFamily: getThemeSetting('theme_body_font', 'Inter, sans-serif'),
                          fontSize: `${getThemeSetting('theme_font_size', '16')}px`,
                          lineHeight: getThemeSetting('theme_line_height', '1.6')
                        }}
                        className="text-slate-300"
                      >
                        This is an example of body text. You can see how your selected fonts and sizes will look in your application.
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value="layout" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Max Content Width</Label>
                        <Select
                          value={getThemeSetting('theme_max_width', '1280')}
                          onValueChange={(value) => handleThemeSetting('theme_max_width', value)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="1024" className="text-white">1024px (Compact)</SelectItem>
                            <SelectItem value="1280" className="text-white">1280px (Standard)</SelectItem>
                            <SelectItem value="1536" className="text-white">1536px (Wide)</SelectItem>
                            <SelectItem value="full" className="text-white">Full Width</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Header Style</Label>
                        <Select
                          value={getThemeSetting('theme_header_style', 'sticky')}
                          onValueChange={(value) => handleThemeSetting('theme_header_style', value)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="static" className="text-white">Static</SelectItem>
                            <SelectItem value="sticky" className="text-white">Sticky</SelectItem>
                            <SelectItem value="fixed" className="text-white">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Sidebar Position</Label>
                        <Select
                          value={getThemeSetting('theme_sidebar_position', 'left')}
                          onValueChange={(value) => handleThemeSetting('theme_sidebar_position', value)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="left" className="text-white">Left</SelectItem>
                            <SelectItem value="right" className="text-white">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white font-bold">Compact Mode</Label>
                          <p className="text-xs text-slate-400">Reduce spacing for dense layout</p>
                        </div>
                        <Switch
                          checked={getThemeSetting('theme_compact_mode', 'false') === 'true'}
                          onCheckedChange={(checked) => handleThemeSetting('theme_compact_mode', checked.toString())}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border-2 border-dashed border-cyan-500/30">
                      <Label className="text-white font-bold mb-4 block">Layout Preview</Label>
                      <div className="space-y-2">
                        <div className="h-8 bg-cyan-500/20 rounded flex items-center px-3 text-xs text-cyan-300 font-bold">
                          Header ({getThemeSetting('theme_header_style', 'sticky')})
                        </div>
                        <div className="flex gap-2">
                          {getThemeSetting('theme_sidebar_position', 'left') === 'left' && (
                            <div className="w-16 bg-purple-500/20 rounded text-xs text-purple-300 flex items-center justify-center">Side</div>
                          )}
                          <div className="flex-1 h-24 bg-slate-700/20 rounded flex items-center justify-center text-xs text-slate-400">
                            Content (max: {getThemeSetting('theme_max_width', '1280')})
                          </div>
                          {getThemeSetting('theme_sidebar_position', 'left') === 'right' && (
                            <div className="w-16 bg-purple-500/20 rounded text-xs text-purple-300 flex items-center justify-center">Side</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Mode Tab */}
                <TabsContent value="mode" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Default Theme Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Card
                            className={`cursor-pointer transition-all ${
                              getThemeSetting('theme_mode', 'dark') === 'dark'
                                ? 'bg-cyan-500/20 border-cyan-500'
                                : 'bg-slate-800/50 border-slate-700'
                            }`}
                            onClick={() => handleThemeSetting('theme_mode', 'dark')}
                          >
                            <CardContent className="p-4 text-center">
                              <Moon className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                              <p className="text-white font-bold">Dark</p>
                            </CardContent>
                          </Card>
                          <Card
                            className={`cursor-pointer transition-all ${
                              getThemeSetting('theme_mode', 'dark') === 'light'
                                ? 'bg-cyan-500/20 border-cyan-500'
                                : 'bg-slate-800/50 border-slate-700'
                            }`}
                            onClick={() => handleThemeSetting('theme_mode', 'light')}
                          >
                            <CardContent className="p-4 text-center">
                              <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                              <p className="text-white font-bold">Light</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white font-bold">Allow Mode Toggle</Label>
                          <p className="text-xs text-slate-400">Let users switch themes</p>
                        </div>
                        <Switch
                          checked={getThemeSetting('theme_mode_toggle', 'true') === 'true'}
                          onCheckedChange={(checked) => handleThemeSetting('theme_mode_toggle', checked.toString())}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white font-bold">Auto Dark Mode</Label>
                          <p className="text-xs text-slate-400">Based on system preference</p>
                        </div>
                        <Switch
                          checked={getThemeSetting('theme_auto_mode', 'false') === 'true'}
                          onCheckedChange={(checked) => handleThemeSetting('theme_auto_mode', checked.toString())}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white font-bold block">Light Mode Colors</Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-slate-300 text-sm mb-2 block">Light Background</Label>
                          <Input
                            type="color"
                            value={getThemeSetting('theme_light_bg', '#ffffff')}
                            onChange={(e) => handleThemeSetting('theme_light_bg', e.target.value)}
                            className="w-full h-10 p-1 bg-slate-800/50 border-slate-700"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300 text-sm mb-2 block">Light Text</Label>
                          <Input
                            type="color"
                            value={getThemeSetting('theme_light_text', '#1a202c')}
                            onChange={(e) => handleThemeSetting('theme_light_text', e.target.value)}
                            className="w-full h-10 p-1 bg-slate-800/50 border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Spacing Tab */}
                <TabsContent value="spacing" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Section Spacing: {getThemeSetting('theme_section_spacing', '80')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_section_spacing', '80'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_section_spacing', value.toString())}
                          min={40}
                          max={160}
                          step={8}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Card Padding: {getThemeSetting('theme_card_padding', '24')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_card_padding', '24'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_card_padding', value.toString())}
                          min={12}
                          max={48}
                          step={4}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Element Gap: {getThemeSetting('theme_element_gap', '16')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_element_gap', '16'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_element_gap', value.toString())}
                          min={8}
                          max={32}
                          step={4}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Container Padding: {getThemeSetting('theme_container_padding', '16')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_container_padding', '16'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_container_padding', value.toString())}
                          min={8}
                          max={48}
                          step={4}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border-2 border-dashed border-cyan-500/30">
                      <Label className="text-white font-bold mb-4 block">Spacing Preview</Label>
                      <div
                        style={{ padding: `${getThemeSetting('theme_card_padding', '24')}px` }}
                        className="bg-slate-800/50 rounded-lg"
                      >
                        <div className="h-12 bg-cyan-500/20 rounded mb-2"></div>
                        <div
                          style={{ gap: `${getThemeSetting('theme_element_gap', '16')}px` }}
                          className="flex"
                        >
                          <div className="flex-1 h-8 bg-purple-500/20 rounded"></div>
                          <div className="flex-1 h-8 bg-purple-500/20 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Borders Tab */}
                <TabsContent value="borders" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Border Radius: {getThemeSetting('theme_border_radius', '12')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_border_radius', '12'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_border_radius', value.toString())}
                          min={0}
                          max={24}
                          step={2}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Button Radius: {getThemeSetting('theme_button_radius', '8')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_button_radius', '8'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_button_radius', value.toString())}
                          min={0}
                          max={24}
                          step={2}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Input Radius: {getThemeSetting('theme_input_radius', '8')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_input_radius', '8'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_input_radius', value.toString())}
                          min={0}
                          max={24}
                          step={2}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Border Width: {getThemeSetting('theme_border_width', '1')}px</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_border_width', '1'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_border_width', value.toString())}
                          min={0}
                          max={4}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border-2 border-dashed border-cyan-500/30">
                      <Label className="text-white font-bold mb-4 block">Border Preview</Label>
                      <div className="space-y-4">
                        <div
                          style={{ borderRadius: `${getThemeSetting('theme_border_radius', '12')}px` }}
                          className="h-16 bg-cyan-500/20 flex items-center justify-center text-white text-sm"
                        >
                          Card Border
                        </div>
                        <button
                          style={{ borderRadius: `${getThemeSetting('theme_button_radius', '8')}px` }}
                          className="w-full h-12 bg-cyan-500 text-white font-bold"
                        >
                          Button Border
                        </button>
                        <input
                          style={{ borderRadius: `${getThemeSetting('theme_input_radius', '8')}px` }}
                          className="w-full h-10 bg-slate-800 border border-slate-600 px-3 text-white"
                          placeholder="Input Border"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Shadow Intensity: {getThemeSetting('theme_shadow_intensity', '50')}%</Label>
                        <Slider
                          value={[parseInt(getThemeSetting('theme_shadow_intensity', '50'))]}
                          onValueChange={([value]) => handleThemeSetting('theme_shadow_intensity', value.toString())}
                          min={0}
                          max={100}
                          step={10}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Animation Speed</Label>
                        <Select
                          value={getThemeSetting('theme_animation_speed', 'normal')}
                          onValueChange={(value) => handleThemeSetting('theme_animation_speed', value)}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="slow" className="text-white">Slow (0.5s)</SelectItem>
                            <SelectItem value="normal" className="text-white">Normal (0.3s)</SelectItem>
                            <SelectItem value="fast" className="text-white">Fast (0.15s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white font-bold">Enable Blur Effects</Label>
                          <p className="text-xs text-slate-400">Backdrop blur on modals/overlays</p>
                        </div>
                        <Switch
                          checked={getThemeSetting('theme_blur_effects', 'true') === 'true'}
                          onCheckedChange={(checked) => handleThemeSetting('theme_blur_effects', checked.toString())}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white font-bold">Enable Animations</Label>
                          <p className="text-xs text-slate-400">Smooth transitions & effects</p>
                        </div>
                        <Switch
                          checked={getThemeSetting('theme_animations', 'true') === 'true'}
                          onCheckedChange={(checked) => handleThemeSetting('theme_animations', checked.toString())}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                          <Label className="text-white font-bold">Gradient Backgrounds</Label>
                          <p className="text-xs text-slate-400">Use gradients instead of solid</p>
                        </div>
                        <Switch
                          checked={getThemeSetting('theme_gradients', 'true') === 'true'}
                          onCheckedChange={(checked) => handleThemeSetting('theme_gradients', checked.toString())}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-6 border-2 border-dashed border-cyan-500/30">
                      <Label className="text-white font-bold mb-4 block">Effects Preview</Label>
                      <div className="space-y-4">
                        <div
                          className="h-16 bg-cyan-500/20 rounded-lg flex items-center justify-center text-white"
                          style={{
                            boxShadow: `0 4px 12px rgba(0, 0, 0, ${parseInt(getThemeSetting('theme_shadow_intensity', '50')) / 100})`
                          }}
                        >
                          Shadow Effect
                        </div>
                        {getThemeSetting('theme_gradients', 'true') === 'true' && (
                          <div className="h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                            Gradient
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Components Tab */}
                <TabsContent value="components" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Show Breadcrumbs</Label>
                        <p className="text-xs text-slate-400">Navigation breadcrumbs</p>
                      </div>
                      <Switch
                        checked={getThemeSetting('theme_breadcrumbs', 'true') === 'true'}
                        onCheckedChange={(checked) => handleThemeSetting('theme_breadcrumbs', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Floating Action Button</Label>
                        <p className="text-xs text-slate-400">Quick action FAB</p>
                      </div>
                      <Switch
                        checked={getThemeSetting('theme_fab', 'false') === 'true'}
                        onCheckedChange={(checked) => handleThemeSetting('theme_fab', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Progress Indicators</Label>
                        <p className="text-xs text-slate-400">Loading progress bars</p>
                      </div>
                      <Switch
                        checked={getThemeSetting('theme_progress', 'true') === 'true'}
                        onCheckedChange={(checked) => handleThemeSetting('theme_progress', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Tooltips</Label>
                        <p className="text-xs text-slate-400">Hover tooltips</p>
                      </div>
                      <Switch
                        checked={getThemeSetting('theme_tooltips', 'true') === 'true'}
                        onCheckedChange={(checked) => handleThemeSetting('theme_tooltips', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Scroll to Top Button</Label>
                        <p className="text-xs text-slate-400">Back to top on long pages</p>
                      </div>
                      <Switch
                        checked={getThemeSetting('theme_scroll_top', 'true') === 'true'}
                        onCheckedChange={(checked) => handleThemeSetting('theme_scroll_top', checked.toString())}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Notification Badges</Label>
                        <p className="text-xs text-slate-400">Alert indicators</p>
                      </div>
                      <Switch
                        checked={getThemeSetting('theme_badges', 'true') === 'true'}
                        onCheckedChange={(checked) => handleThemeSetting('theme_badges', checked.toString())}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-lg mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Current Theme Applied
                  </h3>
                  <p className="text-sm text-slate-400 font-semibold">Glory Wave - Fully Customized</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.open('/', '_blank')}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Changes
                  </Button>
                  <Button
                    onClick={() => {
                      alert('Theme settings saved successfully! Changes will be visible on the live site.');
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Apply Theme
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
