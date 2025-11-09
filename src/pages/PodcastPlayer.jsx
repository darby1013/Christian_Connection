import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Download,
  Heart, Share2, MessageSquare, Clock, User, Star, FileText,
  ChevronRight, Bookmark, Settings, List, Eye
} from "lucide-react";
import { format } from "date-fns";

export default function PodcastPlayer() {
  const [user, setUser] = useState(null);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const queryClient = useQueryClient();

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

  const { data: podcasts = [] } = useQuery({
    queryKey: ['publicPodcasts'],
    queryFn: () => base44.entities.Podcast.filter({ publish_status: 'published' }, '-published_date'),
    initialData: [],
  });

  const { data: transcript } = useQuery({
    queryKey: ['transcript', selectedPodcast?.id],
    queryFn: () => base44.entities.PodcastTranscript.filter({ podcast_id: selectedPodcast.id }),
    enabled: !!selectedPodcast,
    select: (data) => data[0]
  });

  const { data: userLibrary = [] } = useQuery({
    queryKey: ['userLibrary', user?.id],
    queryFn: () => base44.entities.UserPodcastLibrary.filter({ user_id: user.id }),
    enabled: !!user,
    initialData: [],
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', selectedPodcast?.id],
    queryFn: () => base44.entities.PodcastInteraction.filter({ podcast_id: selectedPodcast.id }),
    enabled: !!selectedPodcast,
    initialData: [],
  });

  const likeMutation = useMutation({
    mutationFn: () => base44.entities.PodcastInteraction.create({
      user_id: user.id,
      user_name: user.full_name,
      podcast_id: selectedPodcast.id,
      podcast_title: selectedPodcast.title,
      interaction_type: 'like'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      setIsLiked(true);
    },
  });

  const updateLibraryMutation = useMutation({
    mutationFn: (data) => {
      const existing = userLibrary.find(l => l.podcast_id === selectedPodcast.id);
      if (existing) {
        return base44.entities.UserPodcastLibrary.update(existing.id, data);
      } else {
        return base44.entities.UserPodcastLibrary.create({
          ...data,
          user_id: user.id,
          user_email: user.email,
          podcast_id: selectedPodcast.id,
          podcast_title: selectedPodcast.title
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLibrary'] });
    },
  });

  const updatePlaysMutation = useMutation({
    mutationFn: (podcastId) => {
      const podcast = podcasts.find(p => p.id === podcastId);
      return base44.entities.Podcast.update(podcastId, {
        plays: (podcast.plays || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicPodcasts'] });
    },
  });

  useEffect(() => {
    if (!selectedPodcast && podcasts.length > 0) {
      setSelectedPodcast(podcasts[0]);
    }
  }, [podcasts]);

  useEffect(() => {
    if (selectedPodcast) {
      const liked = interactions.find(i => 
        i.user_id === user?.id && i.interaction_type === 'like'
      );
      setIsLiked(!!liked);
    }
  }, [selectedPodcast, interactions, user]);

  useEffect(() => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
      
      // Save progress every 5 seconds
      if (user && Math.floor(mediaElement.currentTime) % 5 === 0) {
        updateLibraryMutation.mutate({
          library_type: 'favorite',
          last_played_position: mediaElement.currentTime
        });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (user) {
        updateLibraryMutation.mutate({
          library_type: 'favorite',
          is_completed: true,
          play_count: (userLibrary.find(l => l.podcast_id === selectedPodcast.id)?.play_count || 0) + 1
        });
      }
    };

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('ended', handleEnded);
    };
  }, [selectedPodcast, user]);

  const togglePlayPause = () => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play();
      if (!isPlaying) {
        updatePlaysMutation.mutate(selectedPodcast.id);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;
    mediaElement.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value) => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;
    const newVolume = value[0];
    mediaElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;
    if (isMuted) {
      mediaElement.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      mediaElement.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds) => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;
    mediaElement.currentTime = Math.max(0, Math.min(mediaElement.duration, mediaElement.currentTime + seconds));
  };

  const changePlaybackRate = (rate) => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;
    mediaElement.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleLike = () => {
    if (!user) {
      alert('Please sign in to like episodes');
      return;
    }
    if (!isLiked) {
      likeMutation.mutate();
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert('Please sign in to download episodes');
      return;
    }
    const url = selectedPodcast.content_type === 'video' ? selectedPodcast.video_url : selectedPodcast.audio_url;
    window.open(url, '_blank');
    
    updateLibraryMutation.mutate({
      library_type: 'downloaded',
      download_url: url,
      downloaded_at: new Date().toISOString()
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedPodcast.title,
        text: selectedPodcast.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToTimestamp = (timestamp) => {
    const mediaElement = selectedPodcast?.content_type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;
    mediaElement.currentTime = timestamp;
    setCurrentTime(timestamp);
    if (!isPlaying) {
      togglePlayPause();
    }
  };

  const likes = interactions.filter(i => i.interaction_type === 'like').length;
  const shares = interactions.filter(i => i.interaction_type === 'share').length;

  if (!selectedPodcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Loading podcasts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                {/* Media Display */}
                <div className="relative mb-6">
                  {selectedPodcast.content_type === 'video' ? (
                    <video
                      ref={videoRef}
                      src={selectedPodcast.video_url}
                      className="w-full aspect-video rounded-lg bg-black"
                      poster={selectedPodcast.video_thumbnail_url || selectedPodcast.image_url}
                    />
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={selectedPodcast.image_url || selectedPodcast.video_thumbnail_url} 
                        alt={selectedPodcast.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                  )}
                  <audio ref={audioRef} src={selectedPodcast.audio_url} className="hidden" />
                </div>

                {/* Episode Info */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h1 className="text-2xl font-black text-white mb-2">{selectedPodcast.title}</h1>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="bg-purple-500">
                          S{selectedPodcast.season}E{selectedPodcast.episode_number}
                        </Badge>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {selectedPodcast.host_name}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(selectedPodcast.duration)}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {selectedPodcast.plays || 0} plays
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedPodcast.description}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => skip(-10)}
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={togglePlayPause}
                      size="icon"
                      className="bg-cyan-500 hover:bg-cyan-600 w-14 h-14"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                    <Button
                      onClick={() => skip(10)}
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <div className="w-24">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                      />
                    </div>
                    <select
                      value={playbackRate}
                      onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                      className="h-8 px-2 rounded-md bg-slate-900/50 border border-slate-700 text-white text-sm"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleLike}
                    className={isLiked ? "bg-red-500 hover:bg-red-600" : "bg-slate-700 hover:bg-slate-600"}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {likes} Likes
                  </Button>
                  <Button onClick={handleShare} className="bg-slate-700 hover:bg-slate-600">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={handleDownload} className="bg-slate-700 hover:bg-slate-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {transcript && (
                    <Button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="bg-slate-700 hover:bg-slate-600"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Transcript
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transcript */}
            {showTranscript && transcript && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-cyan-400" />
                    Transcript
                  </h3>
                  <Tabs defaultValue="full" className="w-full">
                    <TabsList className="bg-slate-900/50 border border-slate-700 mb-4">
                      <TabsTrigger value="full">Full Transcript</TabsTrigger>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="notes">Show Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="full" className="space-y-2">
                      {transcript.segments && transcript.segments.length > 0 ? (
                        transcript.segments.map((segment, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 cursor-pointer transition-colors"
                            onClick={() => jumpToTimestamp(segment.timestamp)}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-cyan-400 font-mono text-sm">
                                {formatTime(segment.timestamp)}
                              </span>
                              <div className="flex-1">
                                {segment.speaker && (
                                  <span className="text-purple-400 font-semibold text-sm mr-2">
                                    {segment.speaker}:
                                  </span>
                                )}
                                <span className="text-slate-300 text-sm">{segment.text}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 whitespace-pre-wrap">{transcript.transcript_text}</p>
                      )}
                    </TabsContent>

                    <TabsContent value="summary">
                      <div className="p-4 bg-slate-900/30 rounded-lg">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {transcript.summary || 'No summary available'}
                        </p>
                        {transcript.key_topics && transcript.key_topics.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-white font-bold mb-2">Key Topics:</h4>
                            <div className="flex flex-wrap gap-2">
                              {transcript.key_topics.map((topic, idx) => (
                                <Badge key={idx} className="bg-purple-500">{topic}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="notes">
                      <div className="p-4 bg-slate-900/30 rounded-lg">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {transcript.show_notes || 'No show notes available'}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Episode List */}
          <div className="space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-cyan-400" />
                  All Episodes
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {podcasts.map((podcast) => (
                    <div
                      key={podcast.id}
                      onClick={() => setSelectedPodcast(podcast)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedPodcast?.id === podcast.id
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-slate-900/30 hover:bg-slate-900/50 border border-transparent'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                          {podcast.video_thumbnail_url || podcast.image_url ? (
                            <img 
                              src={podcast.video_thumbnail_url || podcast.image_url} 
                              alt={podcast.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                            {podcast.title}
                          </h4>
                          <p className="text-slate-400 text-xs">
                            S{podcast.season}E{podcast.episode_number} • {formatTime(podcast.duration)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}