import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, Mic2, Radio, Volume2, Share2, Heart, MessageSquare, Clock
} from "lucide-react";
import { format } from "date-fns";
import RealtimeChat from "../components/stream/RealtimeChat";
import RealTimeTipJar from "../components/stream/RealTimeTipJar";

export default function LivePodcastPlayer() {
  const [user, setUser] = useState(null);
  const [messageIndex, setMessageIndex] = useState(0);

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

  // Fetch current live podcast with 5-second refresh
  const { data: livePodcast = null } = useQuery({
    queryKey: ['livePodcast'],
    queryFn: async () => {
      const podcasts = await base44.entities.Podcast.filter({ is_live: true, content_type: 'video' });
      
      if (podcasts.length === 0) return null;
      
      // Check if any podcast was updated in last 6 seconds (LIVE NOW)
      const now = new Date();
      const sixSecondsAgo = new Date(now.getTime() - 6 * 1000);
      
      const activePodcast = podcasts.find(p => {
        const updatedDate = new Date(p.updated_date || p.published_date || p.created_date);
        return updatedDate > sixSecondsAgo;
      });
      
      return activePodcast || podcasts[0];
    },
    refetchInterval: 5000,
    initialData: null,
  });

  // Fetch upcoming scheduled podcasts
  const { data: upcomingPodcasts = [] } = useQuery({
    queryKey: ['upcomingPodcasts'],
    queryFn: async () => {
      const now = new Date();
      const podcasts = await base44.entities.Podcast.filter({ is_live: false }, '-published_date', 3);
      return podcasts.filter(p => new Date(p.published_date) > now);
    },
    initialData: [],
  });

  // Fetch site settings for screensaver
  const { data: siteSettings = [] } = useQuery({
    queryKey: ['siteSettingsLivePodcast'],
    queryFn: () => base44.entities.SiteSettings.list(),
    initialData: [],
  });

  const screensaverMessages = siteSettings
    .filter(s => s.category === 'hero' && s.setting_key.includes('message'))
    .map(s => s.setting_value);

  const screensaverImages = siteSettings
    .filter(s => s.category === 'hero' && s.setting_key.includes('image'))
    .map(s => s.setting_value);

  useEffect(() => {
    if (!livePodcast && screensaverMessages.length > 0) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % screensaverMessages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [livePodcast, screensaverMessages.length]);

  const isLive = livePodcast !== null;
  const currentImage = screensaverImages[messageIndex % screensaverImages.length] || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200';
  const currentMessage = screensaverMessages[messageIndex] || 'No live podcast at the moment';

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLive ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Podcast Player */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
                <div className="relative aspect-video bg-black">
                  {livePodcast.video_url ? (
                    <video
                      src={livePodcast.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      poster={livePodcast.video_thumbnail_url || livePodcast.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mic2 className="w-24 h-24 text-purple-500 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="destructive" className="animate-pulse shadow-xl">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE PODCAST
                    </Badge>
                    <Badge className="bg-black/80 backdrop-blur-sm border-0">
                      <Users className="w-3 h-3 mr-1" />
                      {livePodcast.plays || 0} listening
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-black text-white mb-2">{livePodcast.title}</h1>
                      <div className="flex items-center gap-3 text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Mic2 className="w-4 h-4" />
                          {livePodcast.host_name}
                        </span>
                        <span>•</span>
                        <span>S{livePodcast.season}E{livePodcast.episode_number}</span>
                        <span>•</span>
                        <Badge className="bg-purple-500">{livePodcast.category}</Badge>
                      </div>
                      <p className="text-slate-300">{livePodcast.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-purple-500 hover:bg-purple-600">
                      <Heart className="w-4 h-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Podcast Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#1a1f3a] border-0">
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{livePodcast.plays || 0}</p>
                    <p className="text-xs text-slate-400">Listening Now</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1f3a] border-0">
                  <CardContent className="p-4 text-center">
                    <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">0</p>
                    <p className="text-xs text-slate-400">Likes</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1f3a] border-0">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">0</p>
                    <p className="text-xs text-slate-400">Comments</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Chat & Tips Sidebar */}
            <div className="space-y-4">
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="w-full bg-[#1a1f3a] border border-slate-700">
                  <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-purple-500">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="tips" className="flex-1 data-[state=active]:bg-purple-500">
                    <Heart className="w-4 h-4 mr-2" />
                    Support
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="mt-4">
                  <RealtimeChat roomId={livePodcast.id} roomType="podcast" user={user} />
                </TabsContent>

                <TabsContent value="tips" className="mt-4">
                  <RealTimeTipJar podcastId={livePodcast.id} hostName={livePodcast.host_name} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          /* Screensaver Mode */
          <div className="space-y-8">
            <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900">
                <img
                  src={currentImage}
                  alt="Screensaver"
                  className="w-full h-full object-cover opacity-40 animate-fadeIn"
                  key={currentImage}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <Mic2 className="w-24 h-24 text-purple-400 mb-6 animate-pulse" />
                  <h1 className="text-4xl font-black text-white mb-4 animate-fadeIn" key={messageIndex}>
                    {currentMessage}
                  </h1>
                  <Badge className="bg-slate-700 text-slate-300 text-sm">
                    <Radio className="w-3 h-3 mr-1" />
                    No Live Podcast
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Upcoming Podcasts */}
            {upcomingPodcasts.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-white mb-4">Upcoming Podcasts</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {upcomingPodcasts.map((podcast) => (
                    <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
                      <CardContent className="p-5">
                        <div className="w-full h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-3 overflow-hidden">
                          {podcast.image_url && (
                            <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <h3 className="text-white font-bold mb-2 line-clamp-2">{podcast.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                          <Clock className="w-4 h-4" />
                          {format(new Date(podcast.published_date), 'MMM d, h:mm a')}
                        </div>
                        <Badge className="bg-purple-500">{podcast.category}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sign-in CTA */}
            {!user && (
              <Card className="bg-gradient-to-br from-purple-600 to-pink-600 border-0">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-black text-white mb-3">Join the Conversation</h3>
                  <p className="text-purple-100 mb-6">Sign in to chat, support hosts, and get notified when podcasts go live</p>
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-white text-purple-600 hover:bg-purple-50 font-bold"
                  >
                    Sign In Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}