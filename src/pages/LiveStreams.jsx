import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Search, Video, Radio, Play, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function LiveStreams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ['liveStreams'],
    queryFn: () => base44.entities.LiveStream.list('-created_date'),
    initialData: [],
  });

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.host_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || stream.status === filter;
    return matchesSearch && matchesFilter;
  });

  const liveStreams = filteredStreams.filter(s => s.status === 'live');
  const scheduledStreams = filteredStreams.filter(s => s.status === 'scheduled');
  const endedStreams = filteredStreams.filter(s => s.status === 'ended');

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Live Streams</h1>
          <p className="text-lg text-slate-400">Watch live worship, teachings, and events</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-[#1a1f3a] border border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="live" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Live</TabsTrigger>
              <TabsTrigger value="scheduled" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Upcoming</TabsTrigger>
              <TabsTrigger value="ended" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Replays</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Live Now Section */}
        {liveStreams.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-white">LIVE NOW</h2>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                {liveStreams.length} Streaming
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                  <Card className="group hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 border-0 shadow-lg overflow-hidden bg-[#1a1f3a]">
                    <div className="relative aspect-video bg-gradient-to-br from-red-500 to-pink-500">
                      <img
                        src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive" className="animate-pulse shadow-lg">
                          <Radio className="w-3 h-3 mr-1" />
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {stream.viewer_count || 0}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-xl mb-2 text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">{stream.host_name}</span>
                        {stream.category && (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">{stream.category}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Replays Section */}
        {endedStreams.length > 0 && (filter === 'all' || filter === 'ended') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">Watch Replays</h2>
              <Badge className="bg-purple-500">{endedStreams.length} Available</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {endedStreams.map((stream) => (
                <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                  <Card className="group hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden bg-[#1a1f3a] border-slate-700">
                    <div className="relative aspect-video bg-slate-900">
                      <img
                        src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                        alt={stream.title}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-purple-500 shadow-lg">
                          <Play className="w-3 h-3 mr-1" />
                          Replay
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stream.viewer_count || 0}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-sm mb-1 text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{stream.host_name}</span>
                        {stream.ended_at && (
                          <span className="text-slate-500">
                            {format(new Date(stream.ended_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Streams */}
        {scheduledStreams.length > 0 && (filter === 'all' || filter === 'scheduled') && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Streams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledStreams.map((stream) => (
                <Card key={stream.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden bg-[#1a1f3a] border-slate-700">
                  <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500">
                    <img
                      src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                      alt={stream.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-blue-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        Scheduled
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-2 text-white line-clamp-2">
                      {stream.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{stream.description}</p>
                    {stream.scheduled_time && (
                      <p className="text-sm text-cyan-400 font-semibold mb-2">
                        {format(new Date(stream.scheduled_time), 'EEEE, MMMM d @ h:mm a')}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 font-medium">{stream.host_name}</span>
                      {stream.category && (
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400">{stream.category}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredStreams.length === 0 && (
          <div className="text-center py-20">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No streams found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}