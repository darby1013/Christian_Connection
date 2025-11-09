import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play, Download, Heart, Crown, Clock, Search, Star, Trash2,
  CheckCircle, Calendar, DollarSign, Package, Headphones, Video
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function MyPodcastLibrary() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: library = [] } = useQuery({
    queryKey: ['myLibrary', user?.id],
    queryFn: () => base44.entities.UserPodcastLibrary.filter({ user_id: user.id }),
    enabled: !!user,
    initialData: [],
  });

  const { data: podcasts = [] } = useQuery({
    queryKey: ['libraryPodcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['myPurchases', user?.id],
    queryFn: () => base44.entities.PodcastPurchase.filter({ buyer_id: user.id }),
    enabled: !!user,
    initialData: [],
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['mySubscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user.id, status: 'active' }),
    enabled: !!user,
    initialData: [],
  });

  const removeFromLibraryMutation = useMutation({
    mutationFn: (id) => base44.entities.UserPodcastLibrary.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLibrary'] });
    },
  });

  const getPodcastDetails = (podcastId) => {
    return podcasts.find(p => p.id === podcastId);
  };

  const filteredLibrary = library.filter(item => {
    const podcast = getPodcastDetails(item.podcast_id);
    return podcast?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const subscribedPodcasts = filteredLibrary.filter(l => l.library_type === 'subscribed');
  const purchasedPodcasts = filteredLibrary.filter(l => l.library_type === 'purchased');
  const favoritePodcasts = filteredLibrary.filter(l => l.library_type === 'favorite');
  const downloadedPodcasts = filteredLibrary.filter(l => l.library_type === 'downloaded');
  const inProgressPodcasts = filteredLibrary.filter(l => l.last_played_position > 0 && !l.is_completed);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (item, podcast) => {
    if (!podcast || !podcast.duration) return 0;
    return (item.last_played_position / podcast.duration) * 100;
  };

  const handleRemove = (id) => {
    if (confirm('Remove from library?')) {
      removeFromLibraryMutation.mutate(id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-3">My Podcast Library</h1>
          <p className="text-slate-400 font-semibold">Your subscribed, purchased, and favorite episodes</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Headphones className="w-7 h-7 text-purple-400" />
                <Badge className="bg-purple-500">{library.length}</Badge>
              </div>
              <p className="text-xl font-black text-white mb-1">{library.length}</p>
              <p className="text-slate-400 text-xs font-semibold">Total Episodes</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-7 h-7 text-amber-400" />
                <Badge className="bg-amber-500">{subscriptions.length}</Badge>
              </div>
              <p className="text-xl font-black text-white mb-1">{subscriptions.length}</p>
              <p className="text-slate-400 text-xs font-semibold">Subscriptions</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-7 h-7 text-green-400" />
                <Badge className="bg-green-500">{purchases.length}</Badge>
              </div>
              <p className="text-xl font-black text-white mb-1">{purchases.length}</p>
              <p className="text-slate-400 text-xs font-semibold">Purchased</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-7 h-7 text-red-400" />
                <Badge className="bg-red-500">{favoritePodcasts.length}</Badge>
              </div>
              <p className="text-xl font-black text-white mb-1">{favoritePodcasts.length}</p>
              <p className="text-slate-400 text-xs font-semibold">Favorites</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Download className="w-7 h-7 text-cyan-400" />
                <Badge className="bg-cyan-500">{downloadedPodcasts.length}</Badge>
              </div>
              <p className="text-xl font-black text-white mb-1">{downloadedPodcasts.length}</p>
              <p className="text-slate-400 text-xs font-semibold">Downloaded</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
              All ({library.length})
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-cyan-500">
              <Clock className="w-4 h-4 mr-1" />
              Continue ({inProgressPodcasts.length})
            </TabsTrigger>
            <TabsTrigger value="subscribed" className="data-[state=active]:bg-cyan-500">
              <Crown className="w-4 h-4 mr-1" />
              Subscribed ({subscribedPodcasts.length})
            </TabsTrigger>
            <TabsTrigger value="purchased" className="data-[state=active]:bg-cyan-500">
              <Package className="w-4 h-4 mr-1" />
              Purchased ({purchasedPodcasts.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-cyan-500">
              <Heart className="w-4 h-4 mr-1" />
              Favorites ({favoritePodcasts.length})
            </TabsTrigger>
            <TabsTrigger value="downloads" className="data-[state=active]:bg-cyan-500">
              <Download className="w-4 h-4 mr-1" />
              Downloads ({downloadedPodcasts.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-cyan-500">
              <DollarSign className="w-4 h-4 mr-1" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {filteredLibrary.map((item) => {
              const podcast = getPodcastDetails(item.podcast_id);
              if (!podcast) return null;
              
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                        {podcast.video_thumbnail_url || podcast.image_url ? (
                          <img 
                            src={podcast.video_thumbnail_url || podcast.image_url} 
                            alt={podcast.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {podcast.content_type === 'video' ? (
                              <Video className="w-10 h-10 text-white" />
                            ) : (
                              <Headphones className="w-10 h-10 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                            <p className="text-slate-400 text-sm">
                              S{podcast.season}E{podcast.episode_number} • {podcast.host_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.library_type === 'subscribed' && <Badge className="bg-purple-500">Subscribed</Badge>}
                            {item.library_type === 'purchased' && <Badge className="bg-green-500">Purchased</Badge>}
                            {item.library_type === 'favorite' && <Badge className="bg-red-500">Favorite</Badge>}
                            {item.library_type === 'downloaded' && <Badge className="bg-cyan-500">Downloaded</Badge>}
                          </div>
                        </div>

                        {item.last_played_position > 0 && !item.is_completed && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Progress: {formatTime(item.last_played_position)} / {formatTime(podcast.duration)}</span>
                              <span>{Math.round(getProgressPercentage(item, podcast))}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 transition-all"
                                style={{ width: `${getProgressPercentage(item, podcast)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.is_completed && (
                          <div className="mb-3 flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Completed {item.play_count > 1 && `• Played ${item.play_count} times`}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Link to={createPageUrl("PodcastPlayer") + `?id=${podcast.id}`}>
                            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                              <Play className="w-3 h-3 mr-1" />
                              {item.last_played_position > 0 && !item.is_completed ? 'Continue' : 'Play'}
                            </Button>
                          </Link>
                          {item.library_type === 'downloaded' && item.download_url && (
                            <Button
                              size="sm"
                              onClick={() => window.open(item.download_url, '_blank')}
                              className="bg-slate-700 hover:bg-slate-600"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemove(item.id)}
                            className="border-red-500/30 text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="progress" className="space-y-3">
            {inProgressPodcasts.map((item) => {
              const podcast = getPodcastDetails(item.podcast_id);
              if (!podcast) return null;
              
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-slate-700 border-l-4 border-l-cyan-500">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex-shrink-0 overflow-hidden">
                        {podcast.video_thumbnail_url || podcast.image_url ? (
                          <img 
                            src={podcast.video_thumbnail_url || podcast.image_url} 
                            alt={podcast.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Clock className="w-8 h-8 text-white m-auto mt-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2">{podcast.title}</h3>
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span>{formatTime(item.last_played_position)} left</span>
                            <span>{Math.round(getProgressPercentage(item, podcast))}% complete</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500"
                              style={{ width: `${getProgressPercentage(item, podcast)}%` }}
                            />
                          </div>
                        </div>
                        <Link to={createPageUrl("PodcastPlayer") + `?id=${podcast.id}`}>
                          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                            <Play className="w-3 h-3 mr-1" />
                            Continue Listening
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {inProgressPodcasts.length === 0 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg mb-2">No Episodes in Progress</h3>
                  <p className="text-slate-400">Start listening to see your progress here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscribed" className="grid md:grid-cols-2 gap-4">
            {subscribedPodcasts.map((item) => {
              const podcast = getPodcastDetails(item.podcast_id);
              if (!podcast) return null;
              
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-purple-500/30">
                  <CardContent className="p-5">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
                        {podcast.image_url && (
                          <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold line-clamp-2">{podcast.title}</h3>
                        <Badge className="bg-purple-500 mt-1">Subscribed</Badge>
                      </div>
                    </div>
                    <Link to={createPageUrl("PodcastPlayer") + `?id=${podcast.id}`}>
                      <Button size="sm" className="w-full bg-purple-500 hover:bg-purple-600">
                        <Play className="w-3 h-3 mr-1" />
                        Listen Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="purchased" className="grid md:grid-cols-2 gap-4">
            {purchasedPodcasts.map((item) => {
              const podcast = getPodcastDetails(item.podcast_id);
              if (!podcast) return null;
              
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-green-500/30">
                  <CardContent className="p-5">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 rounded bg-gradient-to-br from-green-500 to-emerald-500 overflow-hidden">
                        {podcast.image_url && (
                          <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold line-clamp-2">{podcast.title}</h3>
                        <Badge className="bg-green-500 mt-1">Purchased</Badge>
                      </div>
                    </div>
                    <Link to={createPageUrl("PodcastPlayer") + `?id=${podcast.id}`}>
                      <Button size="sm" className="w-full bg-green-500 hover:bg-green-600">
                        <Play className="w-3 h-3 mr-1" />
                        Play Episode
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="favorites" className="grid md:grid-cols-2 gap-4">
            {favoritePodcasts.map((item) => {
              const podcast = getPodcastDetails(item.podcast_id);
              if (!podcast) return null;
              
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-red-500/30">
                  <CardContent className="p-5">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 rounded bg-gradient-to-br from-red-500 to-pink-500 overflow-hidden flex items-center justify-center">
                        {podcast.image_url ? (
                          <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                        ) : (
                          <Heart className="w-8 h-8 text-white fill-current" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold line-clamp-2">{podcast.title}</h3>
                        <Badge className="bg-red-500 mt-1">Favorite</Badge>
                      </div>
                    </div>
                    <Link to={createPageUrl("PodcastPlayer") + `?id=${podcast.id}`}>
                      <Button size="sm" className="w-full bg-red-500 hover:bg-red-600">
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="downloads" className="space-y-3">
            {downloadedPodcasts.map((item) => {
              const podcast = getPodcastDetails(item.podcast_id);
              if (!podcast) return null;
              
              return (
                <Card key={item.id} className="bg-[#1a1f3a] border-cyan-500/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Download className="w-12 h-12 text-cyan-400" />
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{podcast.title}</h3>
                        <p className="text-slate-400 text-sm">
                          Downloaded {format(new Date(item.downloaded_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        onClick={() => window.open(item.download_url, '_blank')}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-black">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-900/30 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold">{sub.plan_name}</h3>
                        <p className="text-slate-400 text-sm capitalize">{sub.plan_type} Plan</p>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Price</p>
                        <p className="text-white font-bold">${sub.price}/mo</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Next Billing</p>
                        <p className="text-white font-semibold">
                          {sub.next_billing_date ? format(new Date(sub.next_billing_date), 'MMM d') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {subscriptions.length === 0 && (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No active subscriptions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-black">Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="p-3 bg-slate-900/30 rounded flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">{purchase.podcast_title}</p>
                        <p className="text-slate-400 text-xs">
                          {format(new Date(purchase.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className="bg-green-500">${purchase.amount}</Badge>
                    </div>
                  ))}
                  {purchases.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No purchases yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}