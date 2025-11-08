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
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard, section: "Overview" },
    { title: "Site Settings", url: createPageUrl("AdminSiteSettings"), icon: SettingsIcon, section: "Overview" },
    { title: "Live Streams", url: createPageUrl("AdminLiveStreams"), icon: Video, section: "Content" },
    { title: "Podcasts", url: createPageUrl("AdminPodcasts"), icon: Mic2, section: "Content" },
    { title: "Videos", url: createPageUrl("AdminVideos"), icon: PlayCircle, section: "Content" },
    { title: "Blog Posts", url: createPageUrl("AdminBlog"), icon: FileText, section: "Content" },
    { title: "Groups", url: createPageUrl("AdminGroups"), icon: UsersRound, section: "Community" },
    { title: "Forum", url: createPageUrl("AdminForum"), icon: MessagesSquare, section: "Community" },
    { title: "Events", url: createPageUrl("AdminEvents"), icon: CalendarDays, section: "Community" },
    { title: "Products", url: createPageUrl("AdminProducts"), icon: Store, section: "Commerce" },
    { title: "Orders", url: createPageUrl("AdminOrders"), icon: ShoppingBag, section: "Commerce" },
    { title: "Donations", url: createPageUrl("AdminDonations"), icon: DollarSign, section: "Commerce" },
    { title: "Users", url: createPageUrl("AdminUsers"), icon: UserIcon, section: "Management" },
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
            --admin-bg: #0a0e27;
            --admin-card: #1a1f3a;
            --admin-cyan: #00d9ff;
            --admin-purple: #7c3aed;
            --admin-red: #ef4444;
            --admin-green: #10b981;
          }
          .admin-layout {
            background: #0a0e27;
            min-height: 100vh;
          }
          .admin-sidebar {
            background: #0f1629;
            border-right: 1px solid #1a1f3a;
          }
          .admin-card {
            background: #1a1f3a;
            border: 1px solid #2a2f4a;
            border-radius: 12px;
          }
          .glow-cyan {
            box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
          }
        `}</style>
        <div className="flex min-h-screen admin-layout">
          <Sidebar className="admin-sidebar">
            <SidebarHeader className="border-b border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-xl">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-white text-xl">Glory Wave</h2>
                  <p className="text-xs text-cyan-400 font-semibold">Admin Panel</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
              {Object.entries(groupedAdminItems).map(([section, items]) => (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel className="text-xs font-bold text-cyan-400 uppercase tracking-wider px-3 py-3">
                    {section}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-lg mb-1 transition-all font-semibold ${
                              location.pathname === item.url
                                ? 'bg-cyan-500 text-white shadow-lg glow-cyan'
                                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                              <item.icon className="w-5 h-5" />
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-cyan-500/40">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold">
                      {user?.full_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{user?.full_name || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = createPageUrl("Home")}
                  className="flex-1 bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Site
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-[#0f1629] border-b border-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden text-white hover:bg-slate-800 p-2 rounded-lg" />
                  <h1 className="text-2xl font-black text-white">{currentPageName?.replace('Admin', '')}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">
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

  // Public Site Layout
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
                        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
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