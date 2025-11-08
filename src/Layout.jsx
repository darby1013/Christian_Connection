import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home, Video, Radio, BookOpen, Users, MessageSquare, Calendar,
  ShoppingBag, Heart, Settings, LogOut, Menu, X, Bell, Search,
  LayoutDashboard, PlayCircle, Mic2, FileText, UsersRound, MessagesSquare,
  CalendarDays, Store, DollarSign, User as UserIcon, Shield
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
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: LayoutDashboard },
    { title: "Live Streams", url: createPageUrl("AdminLiveStreams"), icon: Video },
    { title: "Podcasts", url: createPageUrl("AdminPodcasts"), icon: Mic2 },
    { title: "Videos", url: createPageUrl("AdminVideos"), icon: PlayCircle },
    { title: "Blog Posts", url: createPageUrl("AdminBlog"), icon: FileText },
    { title: "Groups", url: createPageUrl("AdminGroups"), icon: UsersRound },
    { title: "Forum", url: createPageUrl("AdminForum"), icon: MessagesSquare },
    { title: "Events", url: createPageUrl("AdminEvents"), icon: CalendarDays },
    { title: "Products", url: createPageUrl("AdminProducts"), icon: Store },
    { title: "Orders", url: createPageUrl("AdminOrders"), icon: ShoppingBag },
    { title: "Donations", url: createPageUrl("AdminDonations"), icon: DollarSign },
    { title: "Users", url: createPageUrl("AdminUsers"), icon: UserIcon },
  ];

  const navItems = isAdminPage ? adminNavItems : publicNavItems;

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isAdminPage) {
    // Admin Dark Theme Layout
    return (
      <SidebarProvider>
        <style>{`
          :root {
            --admin-bg-primary: #0a0e1a;
            --admin-bg-secondary: #111827;
            --admin-bg-card: #1e293b;
            --admin-accent: #6366f1;
            --admin-accent-light: #818cf8;
            --admin-cyan: #06b6d4;
            --admin-purple: #8b5cf6;
            --admin-text: #f8fafc;
            --admin-text-muted: #94a3b8;
          }
          .admin-layout {
            background: linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 100%);
            min-height: 100vh;
          }
          .admin-sidebar {
            background: var(--admin-bg-secondary);
            border-right: 1px solid rgba(99, 102, 241, 0.1);
          }
          .admin-card {
            background: var(--admin-bg-card);
            border: 1px solid rgba(99, 102, 241, 0.1);
            border-radius: 12px;
          }
        `}</style>
        <div className="flex min-h-screen admin-layout">
          <Sidebar className="admin-sidebar border-r border-indigo-500/10">
            <SidebarHeader className="border-b border-indigo-500/10 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Admin Panel</h2>
                  <p className="text-xs text-slate-400">Faith Community</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                  Management
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`rounded-lg mb-1 transition-all duration-200 ${
                            location.pathname === item.url
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-indigo-500/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border-2 border-indigo-500/30">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm">
                      {user?.full_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{user?.full_name || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = createPageUrl("Home")}
                  className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Public Site
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-slate-900/50 backdrop-blur-xl border-b border-indigo-500/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden text-white hover:bg-slate-800 p-2 rounded-lg" />
                  <h1 className="text-xl font-bold text-white">{currentPageName?.replace('Admin', '')}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    <Bell className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
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

  // Public Site Layout - Clean Christian Theme
  return (
    <>
      <style>{`
        :root {
          --faith-primary: #2563eb;
          --faith-secondary: #7c3aed;
          --faith-accent: #06b6d4;
          --faith-gold: #f59e0b;
        }
        .faith-gradient {
          background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%);
        }
        .nav-hover {
          transition: all 0.3s ease;
        }
        .nav-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div className="min-h-screen faith-gradient">
        {/* Top Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <span className="text-white font-bold text-xl">✝</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Faith Community
                  </h1>
                  <p className="text-xs text-slate-500">Live. Connect. Grow.</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {publicNavItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`nav-hover px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                      location.pathname === item.url
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Search className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="w-5 h-5" />
                </Button>
                {user ? (
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Link to={createPageUrl("AdminDashboard")}>
                        <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Avatar className="cursor-pointer border-2 border-blue-200 hover:border-blue-400 transition-all">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Secondary Navigation Bar */}
        <div className="bg-white/60 backdrop-blur-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-2 overflow-x-auto">
              {publicNavItems.slice(5).map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`nav-hover px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all ${
                    location.pathname === item.url
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">✝</span>
                  </div>
                  <h3 className="text-xl font-bold">Faith Community</h3>
                </div>
                <p className="text-slate-400 mb-4">
                  Building a vibrant online Christian community through live streaming, content, and connection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl("Home")} className="block text-slate-400 hover:text-white transition-colors">Home</Link>
                  <Link to={createPageUrl("Blog")} className="block text-slate-400 hover:text-white transition-colors">Blog</Link>
                  <Link to={createPageUrl("Events")} className="block text-slate-400 hover:text-white transition-colors">Events</Link>
                  <Link to={createPageUrl("Store")} className="block text-slate-400 hover:text-white transition-colors">Store</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Connect</h4>
                <div className="space-y-2">
                  <Link to={createPageUrl("Groups")} className="block text-slate-400 hover:text-white transition-colors">Groups</Link>
                  <Link to={createPageUrl("Forum")} className="block text-slate-400 hover:text-white transition-colors">Forum</Link>
                  <Link to={createPageUrl("Donate")} className="block text-slate-400 hover:text-white transition-colors">Donate</Link>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
              <p>&copy; 2025 Faith Community. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}