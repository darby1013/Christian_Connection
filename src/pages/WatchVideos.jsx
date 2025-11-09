import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play, Eye, Heart, Clock, Search, X, Volume2, Video as VideoIcon, Mic2
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WatchVideos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Fetch pre-recorded live stream videos
  const { data: liveVideos = [] } = useQuery({
    queryKey: ['liveVideos'],
    queryFn: () => base44.entities.LiveStream.filter({ status: 'ended' }, '-ended_at'),
    initialData: [],
  });

  // Fetch regular videos
  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.Video.list('-created_date'),
    initialData: [],
  });

  // Fetch podcasts
  const { data: podcasts = [] } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const allContent = [
    ...liveVideos.map(v => ({ ...v, type: 'live_replay', category: v.category || 'Live Stream' })),
    ...videos.map(v => ({ ...v, type: 'video' })),
    ...podcasts.map(p => ({ ...p, type: 'podcast' }))
  ];

  const filteredContent = allContent.filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenVideo = (item, type) => {
    setSelectedVideo(item);
    setSelectedType(type);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
    setSelectedType(null);
  };

  const getContentIcon = (type) => {
    if (type === 'live_replay') return Play;
    if (type === 'video') return VideoIcon;
    return Mic2;
  };

  const getContentBadgeColor = (type) => {
    if (type === 'live_replay') return 'bg-purple-500';
    if (type === 'video') return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Watch Videos</h1>
          <p className="text-lg text-slate-400">Explore our library of sermons, teachings, and podcasts</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search videos and podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
              All Content
            </TabsTrigger>
            <TabsTrigger value="live_replays" className="data-[state=active]:bg-cyan-500">
              <Play className="w-4 h-4 mr-2" />
              Live Replays
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-cyan-500">
              <VideoIcon className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="data-[state=active]:bg-cyan-500">
              <Mic2 className="w-4 h-4 mr-2" />
              Podcasts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContent.map((item) => {
                const Icon = getContentIcon(item.type);
                return (
                  <Card 
                    key={`${item.type}-${item.id}`}
                    className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all cursor-pointer group"
                    onClick={() => handleOpenVideo(item, item.type)}
                  >
                    <div className="relative aspect-video bg-slate-900">
                      <img
                        src={item.thumbnail_url || item.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                      <Badge className={`absolute top-3 left-3 ${getContentBadgeColor(item.type)}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {item.type === 'live_replay' ? 'Replay' : item.type === 'video' ? 'Video' : 'Podcast'}
                      </Badge>
                      <Badge className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm border-0">
                        {item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{item.host_name || item.author_name || 'Glory Wave'}</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views || item.viewer_count || item.plays || 0}
                          </span>
                        </div>
                      </div>
                      {(item.created_date || item.published_date || item.ended_at) && (
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(item.created_date || item.published_date || item.ended_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="live_replays" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveVideos.map((item) => (
                <Card 
                  key={item.id}
                  className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all cursor-pointer group"
                  onClick={() => handleOpenVideo(item, 'live_replay')}
                >
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={item.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                    <Badge className="absolute top-3 left-3 bg-purple-500">
                      <Play className="w-3 h-3 mr-1" />
                      Replay
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{item.host_name}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.viewer_count || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((item) => (
                <Card 
                  key={item.id}
                  className="bg-[#1a1f3a] border-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
                  onClick={() => handleOpenVideo(item, 'video')}
                >
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={item.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                    <Badge className="absolute top-3 left-3 bg-blue-500">
                      <VideoIcon className="w-3 h-3 mr-1" />
                      Video
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{item.host_name}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.views || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="podcasts" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {podcasts.map((item) => (
                <Card 
                  key={item.id}
                  className="bg-[#1a1f3a] border-slate-700 hover:border-green-500 transition-all cursor-pointer group"
                  onClick={() => handleOpenVideo(item, 'podcast')}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Volume2 className="w-16 h-16 text-white opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                    <Badge className="absolute top-3 left-3 bg-green-500">
                      <Mic2 className="w-3 h-3 mr-1" />
                      Podcast
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{item.host_name}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.plays || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={handleCloseVideo}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-5xl p-0">
          {selectedVideo && (
            <>
              <div className="relative aspect-video bg-black">
                {selectedType === 'podcast' ? (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center p-8">
                    <div className="text-center">
                      <Volume2 className="w-24 h-24 text-white mx-auto mb-4" />
                      <audio controls className="w-full mt-4">
                        <source src={selectedVideo.audio_url} type="audio/mpeg" />
                      </audio>
                    </div>
                  </div>
                ) : (
                  <video
                    src={selectedVideo.video_url || selectedVideo.stream_url}
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={selectedVideo.thumbnail_url || selectedVideo.image_url}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseVideo}
                  className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6">
                <h2 className="text-white font-bold text-2xl mb-2">{selectedVideo.title}</h2>
                <p className="text-slate-400 mb-4">{selectedVideo.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{selectedVideo.host_name || selectedVideo.author_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedVideo.views || selectedVideo.viewer_count || selectedVideo.plays || 0} views
                  </span>
                  {selectedVideo.likes && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {selectedVideo.likes}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}