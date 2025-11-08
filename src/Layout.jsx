import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home, Video, Radio, BookOpen, Users, MessageSquare, Calendar,
  ShoppingBag, Heart, Settings, LogOut, Bell,
  LayoutDashboard, PlayCircle, Mic2, FileText, UsersRound, MessagesSquare,
  CalendarDays, Store, DollarSign, User as UserIcon, Shield, Settings as SettingsIcon,
  Image, Film, Palette
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  const publicNavItems = [
    { title: "Home", url: createPageUrl("Home"), icon: Home },
    { title: "Watch", url: createPageUrl("LiveStreams"), icon: Video },
    { title: "Events", url: createPageUrl("Events"), icon: Calendar },
    { title: "Store", url: createPageUrl("Store"), icon: ShoppingBag },
    { title: "Give", url: createPageUrl("Donate"), icon: Heart },
    { title: "Community", url: createPageUrl("Groups"), icon: Users },
  ];

  const adminNavItems = [
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard, section: "OVERVIEW" },
    { title: "Site Settings", url: createPageUrl("AdminSiteSettings"), icon: SettingsIcon, section: "OVERVIEW" },
    { title: "Live Streams", url: createPageUrl("AdminLiveStreams"), icon: Video, section: "CONTENT" },
    { title: "Podcasts", url: createPageUrl("AdminPodcasts"), icon: Mic2, section: "CONTENT" },
    { title: "Videos", url: createPageUrl("AdminVideos"), icon: PlayCircle, section: "CONTENT" },
    { title: "Blog Posts", url: createPageUrl("AdminBlog"), icon: FileText, section: "CONTENT" },
    { title: "Groups", url: createPageUrl("AdminGroups"), icon: UsersRound, section: "COMMUNITY" },
    { title: "Forum", url: createPageUrl("AdminForum"), icon: MessagesSquare, section: "COMMUNITY" },
    { title: "Events", url: createPageUrl("AdminEvents"), icon: CalendarDays, section: "COMMUNITY" },
    { title: "Products", url: createPageUrl("AdminProducts"), icon: Store, section: "COMMERCE" },
    { title: "Orders", url: createPageUrl("AdminOrders"), icon: ShoppingBag, section: "COMMERCE" },
    { title: "Donations", url: createPageUrl("AdminDonations"), icon: DollarSign, section: "COMMERCE" },
    { title: "Users", url: createPageUrl("AdminUsers"), icon: UserIcon, section: "MANAGEMENT" },
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
    return <div>{children}</div>;
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
          }
          
          .admin-main {
            background: #0a0e27 !important;
          }
          
          .admin-header {
            background: #0f1629 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
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
        <div className="flex min-h-screen admin-layout">
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

          <main className="flex-1 flex flex-col overflow-hidden admin-main">
            <header className="admin-header px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg" />
                  <h1 className="text-xl font-bold text-white">{currentPageName?.replace('Admin', '')}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
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
          background: #0a0e27;
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
                {user && (
                  <Link to={createPageUrl("BroadcastStream")}>
                    <Button className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
                      <Radio className="w-4 h-4 mr-2" />
                      Live
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Link to={createPageUrl("AdminDashboard")}>
                        <Button variant="outline" className="border-slate-700 bg-white/5 text-slate-300 hover:bg-white/10">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Avatar className="cursor-pointer border-2 border-cyan-500/40">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                        {user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
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