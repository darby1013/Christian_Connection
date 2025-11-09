import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar, MapPin, Clock, Users, Star, Search, Ticket,
  Video, CheckCircle, TrendingUp, Filter, Download
} from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { motion } from "framer-motion";

export default function Events() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

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

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-start_date'),
    initialData: [],
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['myRegistrations', user?.id],
    queryFn: () => base44.entities.EventRegistration.filter({ attendee_id: user.id }),
    initialData: [],
    enabled: !!user,
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const upcomingEvents = filteredEvents.filter(e => isFuture(new Date(e.start_date)));
  const pastEvents = filteredEvents.filter(e => isPast(new Date(e.start_date)) && !isToday(new Date(e.start_date)));
  const todayEvents = filteredEvents.filter(e => isToday(new Date(e.start_date)));
  const featuredEvents = upcomingEvents.filter(e => e.is_featured || e.attendee_count > 50);

  const categories = ["all", ...new Set(events.map(e => e.category).filter(Boolean))];

  const isRegistered = (eventId) => {
    return myRegistrations.some(r => r.event_id === eventId);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : null;

    if (isPast(start) && (!end || isPast(end))) return { text: "Ended", color: "bg-slate-600" };
    if (isToday(start)) return { text: "Today", color: "bg-green-500 animate-pulse" };
    if (event.status === 'ongoing') return { text: "Happening Now", color: "bg-red-500 animate-pulse" };
    if (event.attendee_count >= event.max_attendees && event.registration_required) {
      return { text: "Sold Out", color: "bg-amber-500" };
    }
    return { text: "Upcoming", color: "bg-blue-500" };
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Events</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Join us for worship services, conferences, and community gatherings
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                {upcomingEvents.length} Upcoming
              </Badge>
              {user && myRegistrations.length > 0 && (
                <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {myRegistrations.length} Registered
                </Badge>
              )}
            </div>
          </motion.div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 px-4 rounded-md bg-[#1a1f3a] border border-slate-700 text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="capitalize">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-500">
              Upcoming ({upcomingEvents.length})
            </TabsTrigger>
            {todayEvents.length > 0 && (
              <TabsTrigger value="today" className="data-[state=active]:bg-green-500">
                Today ({todayEvents.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="past" className="data-[state=active]:bg-cyan-500">
              Past Events
            </TabsTrigger>
            {user && myRegistrations.length > 0 && (
              <TabsTrigger value="myevents" className="data-[state=active]:bg-cyan-500">
                My Events
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="upcoming" className="mt-6 space-y-8">
            {/* Featured Events */}
            {featuredEvents.length > 0 && (
              <div>
                <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  Featured Events
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredEvents.slice(0, 2).map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <Card key={event.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 overflow-hidden">
                        <div className="relative aspect-video bg-slate-900">
                          <img
                            src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className={status.color}>
                              {status.text}
                            </Badge>
                          </div>
                          {event.is_online && (
                            <Badge className="absolute top-4 right-4 bg-purple-500">
                              <Video className="w-3 h-3 mr-1" />
                              Online
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-white font-black text-2xl mb-2">{event.title}</h3>
                          <p className="text-slate-300 mb-4 line-clamp-2">{event.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Calendar className="w-4 h-4 text-cyan-400" />
                              {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <Clock className="w-4 h-4 text-cyan-400" />
                              {format(new Date(event.start_date), 'h:mm a')}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-slate-300">
                                <MapPin className="w-4 h-4 text-cyan-400" />
                                {event.location}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-300">
                              <Users className="w-4 h-4 text-cyan-400" />
                              {event.attendee_count || 0} attending
                              {event.max_attendees && ` • ${event.max_attendees - (event.attendee_count || 0)} spots left`}
                            </div>
                          </div>

                          <Link to={createPageUrl(`EventDetail?id=${event.id}`)}>
                            <Button className="w-full bg-amber-500 hover:bg-amber-600 font-bold">
                              {isRegistered(event.id) ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  View Ticket
                                </>
                              ) : (
                                <>
                                  <Ticket className="w-4 h-4 mr-2" />
                                  Get Tickets
                                </>
                              )}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Upcoming Events */}
            <div>
              <h3 className="text-white font-bold text-xl mb-6">All Upcoming Events</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, index) => {
                  const status = getEventStatus(event);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all h-full">
                        <div className="relative aspect-video bg-slate-900">
                          <img
                            src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <Badge className={`absolute top-3 left-3 ${status.color}`}>
                            {status.text}
                          </Badge>
                          {event.is_online && (
                            <Badge className="absolute top-3 right-3 bg-purple-500">
                              <Video className="w-3 h-3 mr-1" />
                              Online
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{event.title}</h3>
                          <div className="space-y-1 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(event.start_date), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock className="w-3 h-3" />
                              {format(new Date(event.start_date), 'h:mm a')}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-slate-400">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {event.attendee_count || 0}
                            </span>
                            {event.category && (
                              <Badge className="bg-purple-500 capitalize text-xs">{event.category}</Badge>
                            )}
                          </div>

                          <Link to={createPageUrl(`EventDetail?id=${event.id}`)}>
                            <Button className="w-full bg-cyan-500 hover:bg-cyan-600" size="sm">
                              {isRegistered(event.id) ? 'View Details' : 'Register Now'}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {todayEvents.length > 0 && (
            <TabsContent value="today" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {todayEvents.map((event) => (
                  <Card key={event.id} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30">
                    <CardContent className="p-6">
                      <Badge className="bg-green-500 mb-3 animate-pulse">Happening Today</Badge>
                      <h3 className="text-white font-bold text-2xl mb-2">{event.title}</h3>
                      <p className="text-slate-300 mb-4">{event.description}</p>
                      <Link to={createPageUrl(`EventDetail?id=${event.id}`)}>
                        <Button className="bg-green-500 hover:bg-green-600">
                          View Event
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="past" className="mt-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <Card key={event.id} className="bg-[#1a1f3a] border-slate-700 opacity-75">
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                      alt={event.title}
                      className="w-full h-full object-cover grayscale"
                    />
                    <Badge className="absolute top-3 left-3 bg-slate-600">Ended</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="text-white font-bold text-sm mb-2 line-clamp-2">{event.title}</h4>
                    <p className="text-slate-500 text-xs">
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {user && myRegistrations.length > 0 && (
            <TabsContent value="myevents" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRegistrations.map((registration) => {
                  const event = events.find(e => e.id === registration.event_id);
                  if (!event) return null;
                  
                  return (
                    <Card key={registration.id} className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                      <div className="relative aspect-video bg-slate-900">
                        <img
                          src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-3 left-3 bg-cyan-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Registered
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-white font-bold mb-2">{event.title}</h3>
                        <div className="space-y-1 mb-4 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(event.start_date), 'MMM d, yyyy @ h:mm a')}
                          </div>
                          {registration.qr_code && (
                            <div className="flex items-center gap-2 text-cyan-400">
                              <Ticket className="w-3 h-3" />
                              Ticket available
                            </div>
                          )}
                        </div>
                        <Link to={createPageUrl(`EventDetail?id=${event.id}`)}>
                          <Button className="w-full bg-cyan-500 hover:bg-cyan-600" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            View Ticket
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}