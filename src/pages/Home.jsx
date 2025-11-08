import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video, Radio, Calendar, BookOpen, Users, ArrowRight,
  PlayCircle, Clock, Eye, Heart, TrendingUp, Sparkles
} from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: liveStreams = [], isLoading: liveLoading } = useQuery({
    queryKey: ['liveStreams'],
    queryFn: () => base44.entities.LiveStream.filter({ status: 'live' }, '-created_date', 3),
    initialData: [],
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }, 'start_date', 3),
    initialData: [],
  });

  const { data: recentPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['recentPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_date', 3),
    initialData: [],
  });

  const { data: featuredGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['featuredGroups'],
    queryFn: () => base44.entities.Group.filter({ privacy: 'public' }, '-member_count', 4),
    initialData: [],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section - Always visible */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1920')] opacity-10 bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Welcome to our Community</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Experience Faith
              <span className="block bg-gradient-to-r from-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                Together Online
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Join live worship, connect with believers worldwide, and grow in your spiritual journey
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl("LiveStreams")}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all">
                  <Video className="w-5 h-5 mr-2" />
                  Watch Live Now
                </Button>
              </Link>
              <Link to={createPageUrl("Groups")}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 backdrop-blur-md">
                  <Users className="w-5 h-5 mr-2" />
                  Join a Group
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      {/* Live Now Section */}
      {(liveStreams.length > 0 || liveLoading) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <Badge variant="destructive" className="text-sm">LIVE NOW</Badge>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Currently Streaming</h2>
            </div>
            <Link to={createPageUrl("LiveStreams")}>
              <Button variant="outline">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {liveLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-lg">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              liveStreams.map((stream) => (
                <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500">
                      <img
                        src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive" className="animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stream.viewer_count}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium">{stream.host_name}</span>
                        <Badge variant="outline" className="text-xs">{stream.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* Features Grid - Always visible, no loading needed */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-slate-600">Tools to connect, grow, and serve together</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "Live Streaming",
                description: "Watch worship services, Bible studies, and special events in real-time",
                link: createPageUrl("LiveStreams"),
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Radio,
                title: "Podcasts",
                description: "Listen to sermons, teachings, and inspiring conversations anytime",
                link: createPageUrl("Podcasts"),
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Users,
                title: "Small Groups",
                description: "Find your community in Bible study groups and fellowship circles",
                link: createPageUrl("Groups"),
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Calendar,
                title: "Events",
                description: "Stay updated on church events, conferences, and gatherings",
                link: createPageUrl("Events"),
                color: "from-orange-500 to-red-500"
              },
              {
                icon: BookOpen,
                title: "Blog & Resources",
                description: "Read devotionals, articles, and resources for spiritual growth",
                link: createPageUrl("Blog"),
                color: "from-indigo-500 to-blue-500"
              },
              {
                icon: Heart,
                title: "Give & Support",
                description: "Support ministries and make a difference in the community",
                link: createPageUrl("Donate"),
                color: "from-rose-500 to-pink-500"
              }
            ].map((feature, index) => (
              <Link key={index} to={feature.link}>
                <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg h-full">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {(upcomingEvents.length > 0 || eventsLoading) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Upcoming Events</h2>
              <p className="text-slate-600 mt-2">Mark your calendar and join us</p>
            </div>
            <Link to={createPageUrl("Events")}>
              <Button variant="outline">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {eventsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-lg">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              upcomingEvents.map((event) => (
                <Link key={event.id} to={createPageUrl(`EventView?id=${event.id}`)}>
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg">
                    <div className="relative aspect-video bg-gradient-to-br from-orange-500 to-rose-500">
                      <img
                        src={event.image_url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.start_date), "MMM d, yyyy · h:mm a")}
                      </div>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* Recent Blog Posts */}
      {(recentPosts.length > 0 || postsLoading) && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Latest from the Blog</h2>
                <p className="text-slate-600 mt-2">Inspiration and insights for your journey</p>
              </div>
              <Link to={createPageUrl("Blog")}>
                <Button variant="outline">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {postsLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border-0 shadow-lg">
                      <Skeleton className="aspect-video w-full" />
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                recentPosts.map((post) => (
                  <Link key={post.id} to={createPageUrl(`BlogPost?id=${post.id}`)}>
                    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg">
                      <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-500">
                        <img
                          src={post.featured_image || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800'}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2">{post.category}</Badge>
                        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{post.author_name}</span>
                          <span>{format(new Date(post.published_date), "MMM d, yyyy")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Groups */}
      {(featuredGroups.length > 0 || groupsLoading) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Join a Community</h2>
            <p className="text-xl text-slate-600">Find your place to grow and connect</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {groupsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-0 shadow-lg">
                    <CardContent className="p-6 text-center space-y-3">
                      <Skeleton className="w-20 h-20 rounded-full mx-auto" />
                      <Skeleton className="h-6 w-3/4 mx-auto" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              featuredGroups.map((group) => (
                <Link key={group.id} to={createPageUrl(`GroupView?id=${group.id}`)}>
                  <Card className="group hover:shadow-xl transition-all duration-300 text-center border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <img
                          src={group.profile_image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200'}
                          alt={group.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        <span>{group.member_count} members</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of believers connecting, growing, and serving together online
          </p>
          <Button
            size="lg"
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}