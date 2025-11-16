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
  AlertOctagon, TrendingUp, Globe, Star, Book, Rss, UserPlus, Truck, Tag, Warehouse,
  Gift, Percent, Clock, Award,
  Database, Code, GitBranch, Upload, Archive, Link2,
  Activity, Zap, RefreshCw, Server, Sun, Moon, Eye, Lock,
  Webhook, Key, AlertCircle, GitCompare, UserX, Copy, CheckCircle, FolderOpen, Cpu,
  CreditCard as CreditCardIcon, FolderTree, Mail, MessageSquare as MessageIcon,
  ChevronDown, ChevronRight, Menu, X as CloseIcon, Layers, Ruler, FileSpreadsheet,
  Target, Video as VideoIcon, ShoppingCart
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "./components/notifications/NotificationBell";
import GlobalSearch from "./components/search/GlobalSearch";
import { ThemeProvider, useTheme } from "./components/theme/ThemeProvider";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set(['OVERVIEW', 'PRODUCTS']));
  const isAdminPage = currentPageName?.startsWith('Admin');
  const isBroadcastPage = currentPageName === 'BroadcastStream';
  const { theme, toggleMode } = useTheme();

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

  const adminNavSections = {
    "OVERVIEW": [
      { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard },
      { title: "Analytics", url: createPageUrl("AdminAnalytics"), icon: BarChart3 },
      { title: "Site Settings", url: createPageUrl("AdminSiteSettings"), icon: SettingsIcon },
      { title: "Activity Feed", url: createPageUrl("AdminActivityFeed"), icon: Activity },
      { title: "System Health", url: createPageUrl("AdminSystemHealth"), icon: Cpu }
    ],
    "PRODUCTS": [
      { title: "All Products", url: createPageUrl("AdminProductsEnhanced"), icon: Store },
      { title: "Categories", url: createPageUrl("AdminCategoryManagement"), icon: FolderTree },
      { title: "Category Hierarchy", url: createPageUrl("AdminCategoryHierarchy"), icon: Layers },
      { title: "Attributes", url: createPageUrl("AdminProductAttributes"), icon: Tag },
      { title: "Collections", url: createPageUrl("AdminCollectionManager"), icon: Package },
      { title: "Size Guides", url: createPageUrl("AdminSizeGuideManager"), icon: Ruler },
      { title: "Bulk Operations", url: createPageUrl("AdminBulkProductOperations"), icon: Zap },
      { title: "Import/Export", url: createPageUrl("AdminProductImportExport"), icon: Upload },
      { title: "Product Search", url: createPageUrl("AdminProductSearch"), icon: Search },
      { title: "Performance", url: createPageUrl("AdminProductPerformance"), icon: TrendingUp },
      { title: "Price Optimization", url: createPageUrl("AdminPriceOptimization"), icon: DollarSign },
      { title: "Inventory Forecast", url: createPageUrl("AdminInventoryForecasting"), icon: Target },
      { title: "Cross-Sell Rules", url: createPageUrl("AdminCrossSellManager"), icon: ShoppingCart },
      { title: "Lifecycle", url: createPageUrl("AdminProductLifecycle"), icon: Calendar },
      { title: "Product Badges", url: createPageUrl("AdminProductBadges"), icon: Award },
      { title: "Product Videos", url: createPageUrl("AdminProductVideos"), icon: VideoIcon },
      { title: "SEO Optimizer", url: createPageUrl("AdminProductSEO"), icon: Globe },
      { title: "Quick Actions", url: createPageUrl("AdminProductQuickActions"), icon: Sparkles }
    ],
    "ORDERS & SALES": [
      { title: "Orders", url: createPageUrl("AdminOrderManagement"), icon: ShoppingBag },
      { title: "Abandoned Carts", url: createPageUrl("AdminAbandonedCarts"), icon: Mail },
      { title: "Pre-Orders", url: createPageUrl("AdminPreOrders"), icon: Clock },
      { title: "Product Analytics", url: createPageUrl("AdminProductAnalytics"), icon: BarChart3 },
      { title: "Reviews", url: createPageUrl("AdminReviewsManagement"), icon: MessageIcon }
    ],
    "PRICING & PROMOTIONS": [
      { title: "Bundles", url: createPageUrl("AdminProductBundles"), icon: Package },
      { title: "Bulk Pricing", url: createPageUrl("AdminBulkPricing"), icon: Percent },
      { title: "Coupons", url: createPageUrl("AdminCouponManagement"), icon: Tag },
      { title: "Gift Cards", url: createPageUrl("AdminGiftCards"), icon: Gift },
      { title: "Loyalty Program", url: createPageUrl("AdminLoyaltyProgram"), icon: Award }
    ],
    "INVENTORY & SHIPPING": [
      { title: "Inventory", url: createPageUrl("AdminInventoryManagement"), icon: Warehouse },
      { title: "Shipping", url: createPageUrl("AdminShippingConfig"), icon: Truck },
      { title: "Payment Gateways", url: createPageUrl("AdminPaymentGateways"), icon: CreditCardIcon }
    ],
    "CONTENT": [
      { title: "Go Live Studio", url: createPageUrl("AdminBroadcastStudio"), icon: Radio },
      { title: "Live Streams", url: createPageUrl("AdminLiveStreams"), icon: Video },
      { title: "Podcasts", url: createPageUrl("AdminPodcasts"), icon: Mic2 },
      { title: "Videos", url: createPageUrl("AdminVideos"), icon: PlayCircle },
      { title: "Blog Posts", url: createPageUrl("AdminBlog"), icon: FileText }
    ],
    "DATABASE": [
      { title: "Database Center", url: createPageUrl("AdminDatabaseCenter"), icon: Database },
      { title: "Audit Log", url: createPageUrl("AdminAuditLog"), icon: Eye },
      { title: "Data Integrity", url: createPageUrl("AdminDataIntegrity"), icon: Shield },
      { title: "SQL Generator", url: createPageUrl("AdminSQLScriptGenerator"), icon: Sparkles },
      { title: "Query Builder", url: createPageUrl("AdminAdvancedQueryBuilder"), icon: Search }
    ],
    "MANAGEMENT": [
      { title: "Users", url: createPageUrl("AdminUsers"), icon: UserIcon },
      { title: "Roles & Permissions", url: createPageUrl("AdminRoles"), icon: Shield }
    ],
    "SYSTEM": [
      { title: "Website Files", url: createPageUrl("AdminWebsiteFilesManager"), icon: FolderOpen },
      { title: "API Management", url: createPageUrl("AdminAPIManagement"), icon: Key },
      { title: "Webhooks", url: createPageUrl("AdminWebhooks"), icon: Webhook },
      { title: "Notifications", url: createPageUrl("AdminNotificationCenter"), icon: Bell },
      { title: "Cache Manager", url: createPageUrl("AdminCacheManager"), icon: Zap }
    ]
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isBroadcastPage) {
    return <div className="w-full">{children}</div>;
  }

  if (isAdminPage) {
    return (
      <SidebarProvider defaultOpen={true}>
        <style>{`
          :root {
            --sidebar-background: #0a0f1e;
            --sidebar-foreground: #ffffff;
            --sidebar-width: 16rem;
          }
          
          [data-sidebar] {
            background: linear-gradient(180deg, #0a0f1e 0%, #050911 100%);
            border-right: 1px solid rgba(71, 85, 105, 0.3);
          }
          
          [data-sidebar][data-state="collapsed"] {
            width: 4rem;
          }
          
          .admin-layout {
            background: linear-gradient(135deg, #0a0e27 0%, #050911 100%);
            min-height: 100vh;
          }
          
          .sidebar-section-trigger {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem;
            border-radius: 0.5rem;
            color: #06b6d4;
            font-weight: 800;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .sidebar-section-trigger:hover {
            background: rgba(6, 182, 212, 0.1);
          }
          
          .sidebar-menu-item {
            color: #94a3b8;
            border-radius: 0.5rem;
            margin: 0.25rem 0.5rem;
            padding: 0.625rem 0.75rem;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .sidebar-menu-item:hover {
            background: linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%);
            color: #ffffff;
            transform: translateX(4px);
          }
          
          .sidebar-menu-item.active {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
            font-weight: 700;
          }
          
          [data-sidebar][data-state="collapsed"] .sidebar-menu-item {
            justify-content: center;
            padding: 0.625rem;
          }
          
          [data-sidebar][data-state="collapsed"] .sidebar-section-trigger {
            justify-content: center;
          }
        `}</style>
        <div className="flex min-h-screen w-full admin-layout">
          <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-slate-700/30 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <span className="text-white font-black text-base">Admin Panel</span>
                  <p className="text-cyan-400 text-xs font-bold">Enterprise</p>
                </div>
              </div>
            </SidebarHeader>
  
            <SidebarContent className="p-2 overflow-y-auto">
              {Object.entries(adminNavSections).map(([section, items]) => (
                <Collapsible
                  key={section}
                  open={expandedSections.has(section)}
                  onOpenChange={() => toggleSection(section)}
                  className="mb-2"
                >
                  <SidebarGroup>
                    <CollapsibleTrigger className="sidebar-section-trigger">
                      <span className="group-data-[collapsible=icon]:hidden">{section}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden ${expandedSections.has(section) ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {items.map((item) => {
                            const isActive = location.pathname === item.url;
                            return (
                              <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                  <Link 
                                    to={item.url} 
                                    className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                                  >
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              ))}
            </SidebarContent>
  
            <SidebarFooter className="border-t border-slate-700/30 p-4">
              <div className="flex items-center gap-3 mb-3 px-2 p-3 rounded-lg bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30">
                <Avatar className="w-10 h-10 border-2 border-cyan-500/40 shrink-0">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                    {user?.full_name?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="font-bold text-white text-sm truncate">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-cyan-400 truncate font-semibold">{user?.role || 'Administrator'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = createPageUrl("Home")}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white text-xs h-9 font-semibold border border-slate-700/30"
                >
                  <Home className="w-3 h-3 group-data-[collapsible=icon]:mx-0 mr-1.5" />
                  <span className="group-data-[collapsible=icon]:hidden">Site</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-slate-800/50 hover:bg-red-500/20 text-slate-300 hover:text-red-400 h-9 px-3 border border-slate-700/30 group-data-[collapsible=icon]:flex-1"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
  
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-[#0f1629]/80 backdrop-blur-xl border-b border-slate-800/50 px-8 py-5 sticky top-0 z-40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors" />
                  <div>
                    <h1 className="text-2xl font-black text-white">{currentPageName?.replace('Admin', '')}</h1>
                    <p className="text-cyan-400 text-xs font-semibold">Enterprise Administration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <NotificationBell user={user} />
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </header>
  
            <div className="flex-1 overflow-auto p-8">
              {children}
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
          background: var(--background-color, #0a0e27);
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
                  onClick={toggleMode}
                  className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  {theme.mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer border-2 border-cyan-500/40 hover:border-cyan-500 transition-colors">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                            {user.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1f3a] border-slate-700">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("UserProfile")} className="flex items-center cursor-pointer p-2 hover:bg-slate-800/50 rounded-md">
                            <UserIcon className="w-4 h-4 mr-2" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("UserProfileCustomization")} className="flex items-center cursor-pointer p-2 hover:bg-slate-800/50 rounded-md">
                            <Palette className="w-4 h-4 mr-2" />
                            Customize
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer p-2 hover:bg-slate-800/50 rounded-md">
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>
  );
}