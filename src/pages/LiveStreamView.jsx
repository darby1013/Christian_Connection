import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Users, Radio, Heart, MessageSquare, DollarSign, 
  TrendingUp, Play, Calendar, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import RealtimeChat from "../components/stream/RealtimeChat";
import RealTimeTipJar from "../components/stream/RealTimeTipJar";
import SubscriptionOffer from "../components/stream/SubscriptionOffer";

export default function LiveStreamView() {
  const [user, setUser] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  
  const urlParams = new URLSearchParams(window.location.search);
  const streamId = urlParams.get('id');

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

  const { data: stream, isLoading } = useQuery({
    queryKey: ['liveStream', streamId],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter({ id: streamId });
      return streams[0];
    },
    enabled: !!streamId,
    refetchInterval: stream?.status === 'live' ? 5000 : false,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['streamTips', streamId],
    queryFn: () => base44.entities.StreamTip.filter({ stream_id: streamId }, '-created_date'),
    enabled: !!streamId,
    refetchInterval: 3000,
  });

  const { data: recentTips = [] } = useQuery({
    queryKey: ['recentStreamTips', streamId],
    queryFn: () => base44.entities.StreamTip.filter({ stream_id: streamId }, '-created_date', 5),
    enabled: !!streamId,
    refetchInterval: 2000,
  });

  const { data: nextStream } = useQuery({
    queryKey: ['nextScheduledStream'],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter({ status: 'scheduled' }, 'scheduled_time', 1);
      return streams[0];
    },
  });

  useEffect(() => {
    if (stream && stream.status === 'live') {
      const interval = setInterval(() => {
        const variance = Math.floor(Math.random() * 10) - 5;
        setViewerCount(Math.max(0, (stream.viewer_count || 0) + variance));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [stream]);

  const totalTips = tips.reduce((sum, tip) => sum + (tip.amount || 0), 0);
  const isLive = stream?.status === 'live';
  const isEnded = stream?.status === 'ended';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <Radio className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Stream Not Found</h2>
          <p className="text-slate-400">This stream may not exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="bg-[#1a1f3a] border-slate-700 overflow-hidden">
              <div className="relative aspect-video bg-black">
                {isLive && stream.stream_url ? (
                  <video
                    src={stream.stream_url}
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={stream.thumbnail_url}
                  />
                ) : isEnded && stream.stream_url ? (
                  <>
                    <video
                      src={stream.stream_url}
                      controls
                      className="w-full h-full"
                      poster={stream.thumbnail_url}
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-slate-600 text-sm">
                        <Play className="w-3 h-3 mr-1" />
                        Replay
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Radio className="w-16 h-16 text-slate-600 mx-auto mb-4 animate-pulse" />
                      <p className="text-white font-bold text-xl mb-2">Stream Ended</p>
                      <p className="text-slate-400 mb-4">This live stream has concluded</p>
                      {nextStream && (
                        <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-cyan-400 font-semibold mb-2">Next Live Stream:</p>
                          <p className="text-white font-bold">{nextStream.title}</p>
                          <p className="text-slate-300 text-sm mt-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {format(new Date(nextStream.scheduled_time), 'EEEE, MMMM d @ h:mm a')}
                          </p>
                        </div>
                      )}
                      {!nextStream && (
                        <p className="text-slate-500">Check back soon for the next stream</p>
                      )}
                    </div>
                  </div>
                )}
                {isLive && (
                  <>
                    <Badge variant="destructive" className="absolute top-4 left-4 animate-pulse shadow-xl text-sm">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                    <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-0 shadow-xl text-sm">
                      <Eye className="w-3 h-3 mr-1" />
                      {viewerCount} watching
                    </Badge>
                  </>
                )}
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-black text-white">{stream.title}</h1>
                      {isLive && <Badge variant="destructive" className="animate-pulse">LIVE</Badge>}
                      {isEnded && <Badge className="bg-slate-600">Replay</Badge>}
                    </div>
                    <p className="text-slate-400 mb-4">{stream.description}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {stream.host_name?.[0] || 'H'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{stream.host_name}</p>
                          <p className="text-xs text-slate-400">{stream.category}</p>
                        </div>
                      </div>
                      {stream.tags && stream.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-cyan-500/30 text-cyan-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real-time Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                  {isLive ? (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-center p-3 bg-slate-900/50 rounded-lg"
                    >
                      <Eye className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-2xl font-black text-white">{viewerCount}</p>
                      <p className="text-xs text-slate-400">Watching</p>
                    </motion.div>
                  ) : (
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                      <Eye className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                      <p className="text-2xl font-black text-white">{stream.viewer_count || 0}</p>
                      <p className="text-xs text-slate-400">Watched</p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <Heart className="w-5 h-5 text-red-400 mx-auto mb-1 fill-red-400" />
                    <p className="text-2xl font-black text-white">{tips.length}</p>
                    <p className="text-xs text-slate-400">Tips</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="text-center p-3 bg-slate-900/50 rounded-lg"
                  >
                    <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-black text-white">${totalTips.toFixed(0)}</p>
                    <p className="text-xs text-slate-400">Raised</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tips Alert */}
            {recentTips.length > 0 && (
              <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <CardContent className="p-4">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Recent Support
                  </h3>
                  <div className="space-y-2">
                    {recentTips.map((tip) => (
                      <motion.div
                        key={tip.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2 bg-slate-900/30 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-white font-bold text-sm">
                            {tip.is_anonymous ? "Anonymous" : tip.tipper_name}
                          </span>
                        </div>
                        <span className="text-amber-400 font-black">${tip.amount}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="w-full bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-cyan-500">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="support" className="flex-1 data-[state=active]:bg-cyan-500">
                  <Heart className="w-4 h-4 mr-2" />
                  Support
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <RealtimeChat 
                  roomId={streamId} 
                  roomType={isLive ? "livestream" : "replay"} 
                  user={user} 
                />
                {isEnded && (
                  <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-400 text-sm font-semibold mb-2">💬 Replay Chat</p>
                    <p className="text-slate-300 text-xs">
                      Connect with other viewers watching this replay. Your messages are visible to everyone viewing now.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="support" className="mt-4 space-y-4">
                <RealTimeTipJar stream={stream} user={user} />
                <SubscriptionOffer user={user} />
                {isEnded && (
                  <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-4">
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-purple-400 fill-purple-400" />
                        Support the Mission
                      </h3>
                      <p className="text-slate-300 text-sm mb-3">
                        Enjoyed this message? Support {stream.host_name} and help spread the word!
                      </p>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-purple-500 hover:bg-purple-600">
                          💝 Give Tip
                        </Button>
                        <Button className="flex-1 bg-pink-500 hover:bg-pink-600">
                          ✨ Subscribe
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}