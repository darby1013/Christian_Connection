import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home, Video, Radio, BookOpen, Users, MessageSquare, Calendar,
  ShoppingBag, Heart, Settings, LogOut, Menu, X, Bell, Search,
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
    { title: "Live Streams", url: createPageUrl("LiveStreams"), icon: Video },
    { title: "Podcasts", url: createPageUrl("Podcasts"), icon: Radio },
    { title: "Videos", url: createPageUrl("VideoLibrary"), icon: PlayCircle },
    { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
    { title: "Groups", url: createPageUrl("Groups"), icon: Users },
    { title: "Forum", url: createPageUrl("Forum"), icon: MessageSquare },
    { title: "Events", url: createPageUrl("Events"), icon: Calendar },
    { title: "Store", url: createPageUrl("Store"), icon: ShoppingBag },
    { title: "Donate", url: createPageUrl("Donate"), icon: Heart },
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

  if (isAdminPage) {
    return (
      <SidebarProvider>
        <style>{`
          :root {
            --admin-bg-primary: #0f172a;
            --admin-bg-secondary: #1e293b;
            --admin-bg-card: #334155;
            --admin-accent: #f97316;
            --admin-accent-light: #fb923c;
            --admin-cyan: #06b6d4;
            --admin-purple: #a855f7;
            --admin-text: #f8fafc;
            --admin-text-muted: #cbd5e1;
            --admin-border: rgba(249, 115, 22, 0.2);
          }
          .admin-layout {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%);
            min-height: 100vh;
          }
          .admin-sidebar {
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            border-right: 2px solid var(--admin-border);
          }
          .admin-card {
            background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
            border: 2px solid var(--admin-border);
            border-radius: 16px;
          }
          .glow-orange {
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
          }
        `}</style>
        <div className="flex min-h-screen admin-layout">
          <Sidebar className="admin-sidebar">
            <SidebarHeader className="border-b-2 border-orange-500/20 p-6 bg-gradient-to-br from-orange-600/10 to-red-600/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-xl glow-orange">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-white text-xl tracking-tight">ADMIN CONTROL</h2>
                  <p className="text-xs text-orange-300 font-bold">Faith Community</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
              {Object.entries(groupedAdminItems).map(([section, items]) => (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel className="text-xs font-black text-orange-400 uppercase tracking-widest px-3 py-3">
                    {section}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl mb-1.5 transition-all duration-200 font-semibold ${
                              location.pathname === item.url
                                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg glow-orange'
                                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
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

            <SidebarFooter className="border-t-2 border-orange-500/20 p-4 bg-gradient-to-br from-orange-600/5 to-red-600/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-3 border-orange-500/40 shadow-lg">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold">
                      {user?.full_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{user?.full_name || 'Admin'}</p>
                    <p className="text-xs text-orange-300 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = createPageUrl("Home")}
                  className="flex-1 bg-slate-800/70 border-orange-500/30 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Site
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-slate-800/70 border-orange-500/30 text-slate-300 hover:bg-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-slate-900/60 backdrop-blur-xl border-b-2 border-orange-500/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden text-white hover:bg-slate-800 p-2 rounded-lg" />
                  <h1 className="text-2xl font-black text-white tracking-tight">{currentPageName?.replace('Admin', '')}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl">
                    <Bell className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl">
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

  // Public Site Layout - Bold Christian Theme
  return (
    <>
      <style>{`
        :root {
          --faith-primary: #f97316;
          --faith-secondary: #dc2626;
          --faith-accent: #fbbf24;
          --faith-gold: #eab308;
        }
        .faith-gradient {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        }
        .nav-hover {
          transition: all 0.3s ease;
        }
        .nav-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div className="min-h-screen faith-gradient">
        <nav className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 backdrop-blur-xl border-b-3 border-orange-800/30 sticky top-0 z-50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-400/50 transition-all transform group-hover:scale-105">
                  <span className="text-orange-600 font-black text-3xl">✝</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">
                    FAITH COMMUNITY
                  </h1>
                  <p className="text-xs text-orange-200 font-bold tracking-widest">LIVE • WORSHIP • CONNECT</p>
                </div>
              </Link>

              <div className="hidden lg:flex items-center gap-2">
                {publicNavItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`nav-hover px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${
                      location.pathname === item.url
                        ? 'bg-white text-orange-600 shadow-xl'
                        : 'text-white hover:bg-white/20 border-2 border-white/20'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Link to={createPageUrl("AdminDashboard")}>
                        <Button className="bg-white/20 border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Avatar className="cursor-pointer border-3 border-white hover:border-orange-300 transition-all shadow-xl">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-white text-orange-600 font-black">
                        {user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-white text-orange-600 hover:bg-orange-50 font-black shadow-xl"
                  >
                    SIGN IN
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 backdrop-blur-lg border-b-2 border-orange-300/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-3 overflow-x-auto">
              {publicNavItems.slice(5).map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`nav-hover px-5 py-2 rounded-full flex items-center gap-2 font-bold text-sm whitespace-nowrap transition-all ${
                    location.pathname === item.url
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                      : 'text-orange-800 hover:bg-white/50 border-2 border-orange-300/40'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 text-white mt-20 border-t-4 border-orange-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-black text-2xl">✝</span>
                  </div>
                  <h3 className="text-2xl font-black">FAITH COMMUNITY</h3>
                </div>
                <p className="text-orange-200 mb-4 font-semibold">
                  Building a vibrant online Christian community through live streaming, content, and connection.
                </p>
              </div>
              <div>
                <h4 className="font-black mb-3 text-orange-400">QUICK LINKS</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl("Home")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Home</Link>
                  <Link to={createPageUrl("Blog")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Blog</Link>
                  <Link to={createPageUrl("Events")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Events</Link>
                  <Link to={createPageUrl("Store")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Store</Link>
                </div>
              </div>
              <div>
                <h4 className="font-black mb-3 text-orange-400">CONNECT</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl("Groups")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Groups</Link>
                  <Link to={createPageUrl("Forum")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Forum</Link>
                  <Link to={createPageUrl("Donate")} className="block text-orange-200 hover:text-white transition-colors font-semibold">Donate</Link>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-orange-800/50 mt-8 pt-8 text-center text-orange-300 font-semibold">
              <p>&copy; 2025 Faith Community. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}