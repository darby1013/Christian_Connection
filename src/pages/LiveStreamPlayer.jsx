import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Eye, Users, Radio, Heart, MessageSquare, DollarSign, 
  Calendar, Clock, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import RealtimeChat from "../components/stream/RealtimeChat";
import RealTimeTipJar from "../components/stream/RealTimeTipJar";

export default function LiveStreamPlayer() {
  const [user, setUser] = useState(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

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

  // Check for active live stream
  const { data: liveStream } = useQuery({
    queryKey: ['currentLiveStream'],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter({ status: 'live' });
      return streams[0] || null;
    },
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Get upcoming scheduled streams
  const { data: upcomingStreams = [] } = useQuery({
    queryKey: ['upcomingStreams'],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter(
        { status: 'scheduled' }, 
        'scheduled_time', 
        3
      );
      return streams;
    },
    initialData: [],
  });

  // Get admin messages for screen saver
  const { data: siteSettings = [] } = useQuery({
    queryKey: ['screenSaverSettings'],
    queryFn: () => base44.entities.SiteSettings.filter({ category: 'screensaver' }),
    initialData: [],
  });

  const screenSaverMessages = siteSettings
    .filter(s => s.setting_key.startsWith('message_'))
    .map(s => s.setting_value);

  const screenSaverImages = siteSettings
    .filter(s => s.setting_key.startsWith('image_'))
    .map(s => s.setting_value);

  // Rotate messages every 5 seconds
  useEffect(() => {
    if (screenSaverMessages.length > 0 && !liveStream) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => 
          (prev + 1) % screenSaverMessages.length
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [screenSaverMessages.length, liveStream]);

  const isLive = !!liveStream;

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="bg-[#1a1f3a] border-slate-700 overflow-hidden">
              <div className="relative aspect-video bg-black">
                {isLive ? (
                  <>
                    {/* Live Stream Video */}
                    {liveStream.stream_url ? (
                      <video
                        src={liveStream.stream_url}
                        controls
                        autoPlay
                        className="w-full h-full"
                        poster={liveStream.thumbnail_url}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-900 to-rose-900 flex items-center justify-center">
                        <div className="text-center">
                          <Radio className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                          <p className="text-white font-bold text-xl">Connecting to live stream...</p>
                        </div>
                      </div>
                    )}
                    <Badge variant="destructive" className="absolute top-4 left-4 animate-pulse shadow-xl">
                      <Radio className="w-4 h-4 mr-2" />
                      LIVE NOW
                    </Badge>
                    <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                      <Eye className="w-4 h-4 mr-1" />
                      {liveStream.viewer_count || 0} watching
                    </Badge>
                  </>
                ) : (
                  /* Screen Saver Mode */
                  <div className="w-full h-full relative">
                    {/* Background Image Slideshow */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentMessageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                      >
                        {screenSaverImages[currentMessageIndex] ? (
                          <img
                            src={screenSaverImages[currentMessageIndex]}
                            alt="Background"
                            className="w-full h-full object-cover opacity-30"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900" />
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Overlay Content */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col items-center justify-center p-8">
                      <div className="text-center max-w-3xl">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-2xl">
                          <Radio className="w-12 h-12 text-white" />
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                          No Live Stream Right Now
                        </h1>

                        {/* Scrolling Messages */}
                        <AnimatePresence mode="wait">
                          {screenSaverMessages.length > 0 && (
                            <motion.div
                              key={currentMessageIndex}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.5 }}
                              className="mb-8"
                            >
                              <p className="text-xl text-slate-300 font-medium">
                                {screenSaverMessages[currentMessageIndex]}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Upcoming Streams */}
                        {upcomingStreams.length > 0 && (
                          <div className="mt-8 space-y-4">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center justify-center gap-2">
                              <Calendar className="w-5 h-5 text-cyan-400" />
                              Upcoming Streams
                            </h3>
                            {upcomingStreams.map((stream) => (
                              <Card key={stream.id} className="bg-white/10 backdrop-blur-md border-white/20">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                      <Radio className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <h4 className="text-white font-bold">{stream.title}</h4>
                                      <div className="flex items-center gap-2 text-cyan-400 text-sm mt-1">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(stream.scheduled_time), 'EEEE, MMMM d @ h:mm a')}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Stream Info (only when live) */}
            {isLive && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-white font-black text-2xl mb-2">{liveStream.title}</h1>
                      <p className="text-slate-400">{liveStream.description}</p>
                    </div>
                    <Badge className="bg-red-500">LIVE</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{liveStream.host_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold">{liveStream.host_name}</p>
                        <p className="text-xs">{liveStream.category}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-2xl font-black text-white">{liveStream.viewer_count || 0}</p>
                      <p className="text-xs text-slate-400">Watching</p>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                      <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <p className="text-2xl font-black text-white">0</p>
                      <p className="text-xs text-slate-400">Likes</p>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-2xl font-black text-white">${liveStream.total_donations || 0}</p>
                      <p className="text-xs text-slate-400">Raised</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isLive ? (
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="w-full bg-[#1a1f3a] border border-slate-700">
                  <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-cyan-500">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="support" className="flex-1 data-[state=active]:bg-cyan-500">
                    <Heart className="w-4 h-4 mr-2" />
                    Give
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-4">
                  <RealtimeChat 
                    roomId={liveStream.id} 
                    roomType="livestream" 
                    user={user} 
                  />
                </TabsContent>

                <TabsContent value="support" className="mt-4">
                  <RealTimeTipJar stream={liveStream} user={user} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-cyan-500/30">
                <CardContent className="p-6 text-center">
                  <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">Join Us Live!</h3>
                  <p className="text-slate-300 mb-4">
                    Be notified when we go live. Check upcoming streams above.
                  </p>
                  {!user && (
                    <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600 w-full">
                      Sign In for Notifications
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}