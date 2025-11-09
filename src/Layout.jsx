
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Video, Radio, BookOpen, Users, MessageSquare, Calendar,
  ShoppingBag, Heart, Settings, LogOut, Bell, Search,
  LayoutDashboard, PlayCircle, Mic2, FileText, UsersRound, MessagesSquare,
  CalendarDays, Store, DollarSign, User as UserIcon, Shield, Settings as SettingsIcon,
  Image, Film, Palette, Crown, Package, Download, CreditCard, BarChart3, Sparkles,
  AlertOctagon, TrendingUp, Globe, Star, Book, Rss, UserPlus
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "./components/notifications/NotificationBell";
import GlobalSearch from "./components/search/GlobalSearch";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAdminPage = currentPageName?.startsWith('Admin');
  const isBroadcastPage = currentPageName === 'BroadcastStream';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser?.role === 'admin');
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: streamStatus = { active: [], justEnded: [] } } = useQuery({
    queryKey: ['activeLiveStreams'],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter({ status: 'live' });
      
      const now = new Date();
      const sixSecondsAgo = new Date(now.getTime() - 6 * 1000);
      const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);
      
      const activeStreams = streams.filter(stream => {
        const updatedDate = new Date(stream.updated_date || stream.started_at || stream.created_date);
        return updatedDate > sixSecondsAgo;
      });
      
      const justEndedStreams = streams.filter(stream => {
        const updatedDate = new Date(stream.updated_date || stream.started_at || stream.created_date);
        return updatedDate <= sixSecondsAgo && updatedDate > tenSecondsAgo;
      });
      
      const endedStreams = await base44.entities.LiveStream.filter({ status: 'ended' });
      const recentlyEnded = endedStreams.filter(stream => {
        const endedDate = new Date(stream.ended_at || stream.updated_date || stream.created_date);
        return endedDate > tenSecondsAgo;
      });
      
      return {
        active: activeStreams,
        justEnded: [...justEndedStreams, ...recentlyEnded]
      };
    },
    initialData: { active: [], justEnded: [] },
    refetchInterval: 3000,
  });

  const { data: podcastStatus = { active: [], justEnded: [] } } = useQuery({
    queryKey: ['activeLivePodcasts'],
    queryFn: async () => {
      const podcasts = await base44.entities.Podcast.filter({ is_live: true, content_type: 'video' });
      
      const now = new Date();
      const sixSecondsAgo = new Date(now.getTime() - 6 * 1000);
      const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);
      
      const activePodcasts = podcasts.filter(podcast => {
        const updatedDate = new Date(podcast.updated_date || podcast.published_date || podcast.created_date);
        return updatedDate > sixSecondsAgo;
      });
      
      const justEndedPodcasts = podcasts.filter(podcast => {
        const updatedDate = new Date(podcast.updated_date || podcast.published_date || podcast.created_date);
        return updatedDate <= sixSecondsAgo && updatedDate > tenSecondsAgo;
      });
      
      return {
        active: activePodcasts,
        justEnded: justEndedPodcasts
      };
    },
    initialData: { active: [], justEnded: [] },
    refetchInterval: 3000,
  });

  const hasActiveLiveStream = streamStatus.active.length > 0;
  const streamJustEnded = streamStatus.justEnded.length > 0;
  const hasActiveLivePodcast = podcastStatus.active.length > 0;
  const podcastJustEnded = podcastStatus.justEnded.length > 0;


  const publicNavItems = [
    { title: "Home", url: createPageUrl("Home"), icon: Home },
    { title: "Watch Videos", url: createPageUrl("WatchVideos"), icon: Video },
    { title: "Store", url: createPageUrl("Store"), icon: ShoppingBag },
    { title: "Give", url: createPageUrl("Donate"), icon: Heart },
  ];

  const communityItems = [
    { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen, description: "Latest articles & teachings" },
    { title: "Events", url: createPageUrl("Events"), icon: Calendar, description: "Upcoming gatherings" },
    { title: "Groups", url: createPageUrl("Groups"), icon: Users, description: "Join communities" },
    { title: "Forums", url: createPageUrl("Forum"), icon: MessagesSquare, description: "Engage in discussions" },
    { title: "Chatrooms", url: createPageUrl("Chatrooms"), icon: MessageSquare, description: "Real-time conversations" },
    { title: "Prayer Wall", url: createPageUrl("PrayerWall"), icon: Heart, description: "Share prayer requests" },
    { title: "Community Board", url: createPageUrl("CommunityBoard"), icon: Globe, description: "Announcements & updates" },
    { title: "Testimonies", url: createPageUrl("Testimonies"), icon: Star, description: "Share faith stories" },
    { title: "Member Directory", url: createPageUrl("MemberDirectory"), icon: UsersRound, description: "Connect with members" },
    { title: "Knowledge Base", url: createPageUrl("KnowledgeBase"), icon: Book, description: "Learn and grow" },
    { title: "Volunteer", url: createPageUrl("Volunteer"), icon: UserPlus, description: "Serve the community" },
    { title: "Resources", url: createPageUrl("Resources"), icon: Download, description: "Bible studies & courses" },
    { title: "RSS Feeds", url: createPageUrl("RSSFeeds"), icon: Rss, description: "Stay updated" },
  ];

  const isCommunityPage = communityItems.some(item => location.pathname === item.url) || 
                         location.pathname === createPageUrl("Community");

  const adminNavItems = [
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard, section: "OVERVIEW" },
    { title: "Analytics", url: createPageUrl("AdminAnalytics"), icon: BarChart3, section: "OVERVIEW" },
    { title: "Site Settings", url: createPageUrl("AdminSiteSettings"), icon: SettingsIcon, section: "OVERVIEW" },
    { title: "Go Live Studio", url: createPageUrl("AdminBroadcastStudio"), icon: Radio, section: "CONTENT" },
    { title: "Live Streams", url: createPageUrl("AdminLiveStreams"), icon: Video, section: "CONTENT" },
    { title: "Live Podcast Studio", url: createPageUrl("AdminPodcastLive"), icon: Mic2, section: "CONTENT" },
    { title: "AI Script Generator", url: createPageUrl("AdminAIScriptGenerator"), icon: Sparkles, section: "CONTENT" },
    { title: "Podcasts", url: createPageUrl("AdminPodcasts"), icon: Mic2, section: "CONTENT" },
    { title: "Podcast Marketing", url: createPageUrl("AdminPodcastMarketing"), icon: TrendingUp, section: "CONTENT" },
    { title: "Podcast Analytics", url: createPageUrl("AdminPodcastAnalytics"), icon: BarChart3, section: "CONTENT" },
    { title: "Videos", url: createPageUrl("AdminVideos"), icon: PlayCircle, section: "CONTENT" },
    { title: "Blog Posts", url: createPageUrl("AdminBlog"), icon: FileText, section: "CONTENT" },
    { title: "Groups", url: createPageUrl("AdminGroups"), icon: UsersRound, section: "COMMUNITY" },
    { title: "Forum", url: createPageUrl("AdminForum"), icon: MessagesSquare, section: "COMMUNITY" },
    { title: "Events", url: createPageUrl("AdminEvents"), icon: CalendarDays, section: "COMMUNITY" },
    { title: "Products", url: createPageUrl("AdminProducts"), icon: Store, section: "COMMERCE" },
    { title: "Digital Products", url: createPageUrl("AdminDigitalProducts"), icon: Download, section: "COMMERCE" },
    { title: "Product Variants", url: createPageUrl("AdminProductVariants"), icon: Package, section: "COMMERCE" },
    { title: "Orders", url: createPageUrl("AdminOrders"), icon: ShoppingBag, section: "COMMERCE" },
    { title: "Subscriptions", url: createPageUrl("AdminSubscriptions"), icon: Crown, section: "COMMERCE" },
    { title: "Donations", url: createPageUrl("AdminDonations"), icon: DollarSign, section: "COMMERCE" },
    { title: "Payment Gateways", url: createPageUrl("AdminPaymentGateways"), icon: CreditCard, section: "COMMERCE" },
    { title: "AI Pricing Strategy", url: createPageUrl("AdminAIPricing"), icon: TrendingUp, section: "AI TOOLS" },
    { title: "Content Moderation", url: createPageUrl("AdminContentModeration"), icon: AlertOctagon, section: "AI TOOLS" },
    { title: "Users", url: createPageUrl("AdminUsers"), icon: UserIcon, section: "MANAGEMENT" },
    { title: "Roles & Permissions", url: createPageUrl("AdminRoles"), icon: Shield, section: "MANAGEMENT" },
  ];

  const groupedAdminItems = adminNavItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isBroadcastPage) {
    return <div className="w-full">{children}</div>;
  }

  if (isAdminPage) {
    return (
      <SidebarProvider>
        <style>{`
          :root {
            --sidebar-background: #0f1629 !important;
            --sidebar-foreground: #ffffff !important;
            --sidebar-primary: #22d3ee !important;
            --sidebar-primary-foreground: #ffffff !important;
            --sidebar-accent: rgba(255, 255, 255, 0.05) !important;
            --sidebar-accent-foreground: #ffffff !important;
            --sidebar-border: rgba(255, 255, 255, 0.05) !important;
          }
          
          [data-sidebar] {
            background-color: #0f1629 !important;
            border-color: rgba(255, 255, 255, 0.05) !important;
          }
          
          [data-sidebar-header],
          [data-sidebar-content],
          [data-sidebar-footer] {
            background-color: #0f1629 !important;
          }
          
          [data-sidebar] * {
            border-color: rgba(255, 255, 255, 0.05) !important;
          }
          
          .admin-layout {
            background: #0a0e27 !important;
            min-height: 100vh;
            width: 100%;
          }
          
          .admin-main {
            background: #0a0e27 !important;
            flex: 1;
            width: 100%;
            max-width: 100%;
          }
          
          .admin-header {
            background: #0f1629 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            width: 100%;
          }
          
          .admin-content {
            width: 100%;
            max-width: 100%;
            padding: 1.5rem;
          }
          
          .admin-card {
            background: linear-gradient(135deg, #1a1f3a 0%, #0f1629 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 16px;
          }
          
          .sidebar-label {
            color: #22d3ee !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
          }
          
          .sidebar-menu-item {
            color: #94a3b8 !important;
          }
          
          .sidebar-menu-item:hover {
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: #ffffff !important;
          }
          
          .sidebar-menu-item.active {
            background-color: #22d3ee !important;
            color: #ffffff !important;
          }
          
          .sidebar-menu-item svg {
            color: inherit !important;
          }
        `}</style>
        <div className="flex min-h-screen w-full admin-layout">
          <Sidebar className="border-r border-white/5" style={{ backgroundColor: '#0f1629' }}>
            <SidebarHeader className="border-b border-white/5 p-4" style={{ backgroundColor: '#0f1629' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Admin Panel</span>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-2" style={{ backgroundColor: '#0f1629' }}>
              {Object.entries(groupedAdminItems).map(([section, items]) => (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel className="sidebar-label px-3 py-2 mb-0.5">
                    {section}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <Link 
                                to={item.url} 
                                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg mb-0.5 transition-all sidebar-menu-item ${isActive ? 'active' : ''}`}
                                style={isActive ? { backgroundColor: '#22d3ee', color: '#ffffff' } : { color: '#94a3b8' }}
                              >
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-white/5 p-3" style={{ backgroundColor: '#0f1629' }}>
              <div className="flex items-center gap-2.5 mb-2 px-1">
                <Avatar className="w-8 h-8 border border-cyan-500/30">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold text-xs">
                    {user?.full_name?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-xs truncate">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = createPageUrl("Home")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs h-8"
                >
                  <Home className="w-3 h-3 mr-1" />
                  Site
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 h-8 px-2"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden admin-main w-full">
            <header className="admin-header px-6 py-4 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg" />
                  <h1 className="text-xl font-bold text-white">{currentPageName?.replace('Admin', '')}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationBell user={user} />
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto admin-content w-full">
              <div className="w-full max-w-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <>
      <style>{`
        .glory-gradient {
          background: #0a0e27;
        }
        
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .live-pulse {
          animation: pulse-red 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .fade-out {
          animation: fade-out 10s ease-in-out forwards;
        }
        
        .community-dropdown {
          min-width: 280px;
        }
      `}</style>

      <div className="min-h-screen glory-gradient">
        <nav className="bg-[#0f1629] border-b border-slate-800/50 sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xl">G</span>
                </div>
                <h1 className="text-xl font-black text-white">Glory Wave</h1>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {publicNavItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all ${
                      location.pathname === item.url
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                ))}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all ${
                        isCommunityPage
                          ? 'bg-cyan-500 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Community
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="community-dropdown bg-[#1a1f3a] border-slate-700 p-2">
                    {communityItems.map((item) => (
                      <DropdownMenuItem key={item.title} asChild className="cursor-pointer">
                        <Link 
                          to={item.url}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{item.title}</p>
                            <p className="text-slate-400 text-xs">{item.description}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* LIVE Stream Button - Now has permanent spot in navigation */}
                {hasActiveLiveStream ? (
                  <Link to={createPageUrl("LiveStreamPlayer")}>
                    <button className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all bg-red-600 hover:bg-red-700 text-white relative overflow-hidden">
                      <span className="absolute inset-0 bg-red-500 live-pulse"></span>
                      <Radio className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">LIVE NOW</span>
                    </button>
                  </Link>
                ) : streamJustEnded ? (
                  <button 
                    disabled
                    className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all bg-amber-600/50 text-amber-200 cursor-not-allowed fade-out"
                  >
                    <Radio className="w-4 h-4" />
                    LIVE Ended
                  </button>
                ) : (
                  <button 
                    disabled
                    className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                  >
                    <Radio className="w-4 h-4" />
                    LIVE
                  </button>
                )}

                {/* LIVE Podcast Button - Now has permanent spot in navigation */}
                {hasActiveLivePodcast ? (
                  <Link to={createPageUrl("LivePodcastPlayer")}>
                    <button className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all bg-purple-600 hover:bg-purple-700 text-white relative overflow-hidden">
                      <span className="absolute inset-0 bg-purple-500 live-pulse"></span>
                      <Mic2 className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">PODCAST</span>
                    </button>
                  </Link>
                ) : podcastJustEnded ? (
                  <button 
                    disabled
                    className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all bg-pink-600/50 text-pink-200 cursor-not-allowed fade-out"
                  >
                    <Mic2 className="w-4 h-4" />
                    PODCAST Ended
                  </button>
                ) : (
                  <button 
                    disabled
                    className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                  >
                    <Mic2 className="w-4 h-4" />
                    PODCAST
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <Search className="w-5 h-5" />
                </Button>
                
                {user ? (
                  <div className="flex items-center gap-3">
                    <NotificationBell user={user} />
                    {isAdmin && (
                      <Link to={createPageUrl("AdminDashboard")}>
                        <Button variant="outline" className="border-slate-700 bg-white/5 text-slate-300 hover:bg-white/10">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Link to={createPageUrl("UserProfile")}>
                      <Avatar className="cursor-pointer border-2 border-cyan-500/40 hover:border-cyan-500 transition-colors">
                        <AvatarImage src={user.profile_image} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                          {user.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-[#0f1629] border-t border-slate-800 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-xl">G</span>
                  </div>
                  <h3 className="text-xl font-black">Glory Wave</h3>
                </div>
                <p className="text-slate-400 font-medium">
                  Experience faith together through live worship, teachings, and community.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-cyan-400">Quick Links</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl("Home")} className="block text-slate-400 hover:text-white transition-colors">Home</Link>
                  <Link to={createPageUrl("Blog")} className="block text-slate-400 hover:text-white transition-colors">Blog</Link>
                  <Link to={createPageUrl("Events")} className="block text-slate-400 hover:text-white transition-colors">Events</Link>
                  <Link to={createPageUrl("Store")} className="block text-slate-400 hover:text-white transition-colors">Store</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-cyan-400">Connect</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl("Community")} className="block text-slate-400 hover:text-white transition-colors">Community</Link>
                  <Link to={createPageUrl("Groups")} className="block text-slate-400 hover:text-white transition-colors">Groups</Link>
                  <Link to={createPageUrl("Forum")} className="block text-slate-400 hover:text-white transition-colors">Forum</Link>
                  <Link to={createPageUrl("Donate")} className="block text-slate-400 hover:text-white transition-colors">Give</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
              <p>&copy; 2025 Glory Wave. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
