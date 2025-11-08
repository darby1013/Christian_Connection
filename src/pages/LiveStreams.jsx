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
import { Eye, Search, Filter, Video } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Live Streams</h1>
          <p className="text-lg text-slate-600">Watch live worship, teachings, and events</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
              <TabsTrigger value="ended">Past</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Live Now Section */}
        {liveStreams.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-slate-900">LIVE NOW</h2>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                {liveStreams.length} Streaming
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="relative aspect-video bg-gradient-to-br from-red-500 to-pink-500">
                      <img
                        src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive" className="animate-pulse shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {stream.viewer_count || 0}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Video className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{stream.host_name}</span>
                        {stream.category && (
                          <Badge variant="outline">{stream.category}</Badge>
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
        {scheduledStreams.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Upcoming Streams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledStreams.map((stream) => (
                <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500">
                      <img
                        src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                        alt={stream.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-blue-600">Scheduled</Badge>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{stream.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">{stream.host_name}</span>
                        {stream.category && (
                          <Badge variant="outline">{stream.category}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Past Streams */}
        {endedStreams.length > 0 && filter === 'ended' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Past Streams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {endedStreams.map((stream) => (
                <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-video bg-slate-200">
                      <img
                        src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                      <span className="text-xs text-slate-500">{stream.host_name}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filteredStreams.length === 0 && (
          <div className="text-center py-20">
            <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No streams found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}