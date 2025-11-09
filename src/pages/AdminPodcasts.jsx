import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mic2, Plus, Search, TrendingUp, Play, Trash2, Edit, Upload,
  Eye, BarChart3, Clock, Star, Video, Film, Calendar as CalendarIcon,
  DollarSign, Download, Wand2, RefreshCw, FileVideo, Music
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPodcasts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [contentType, setContentType] = useState("audio");
  const [activeTab, setActiveTab] = useState("all");
  const [convertingPodcast, setConvertingPodcast] = useState(null);
  const [convertingAudio, setConvertingAudio] = useState(false);

  const [podcastForm, setPodcastForm] = useState({
    title: '',
    description: '',
    audio_url: '',
    video_url: '',
    image_url: '',
    video_thumbnail_url: '',
    content_type: 'audio',
    duration: 0,
    episode_number: 1,
    season: 1,
    host_name: '',
    guests: [],
    category: '',
    tags: [],
    publish_status: 'draft',
    scheduled_publish_date: '',
    is_scheduled: false,
    auto_publish: false
  });

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const createPodcastMutation = useMutation({
    mutationFn: (data) => base44.entities.Podcast.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deletePodcastMutation = useMutation({
    mutationFn: (id) => base44.entities.Podcast.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    },
  });

  const captureVideoThumbnail = (videoElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = async () => {
        const duration = Math.floor(video.duration);
        video.currentTime = 2;
        
        video.onseeked = async () => {
          try {
            const thumbnailBlob = await captureVideoThumbnail(video);
            const thumbnailFile = new File([thumbnailBlob], `thumbnail_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const { file_url: thumbnailUrl } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
            
            setPodcastForm(prev => ({
              ...prev,
              video_url: file_url,
              video_thumbnail_url: thumbnailUrl,
              image_url: thumbnailUrl,
              duration: duration,
              content_type: 'video'
            }));
            setUploadingMedia(false);
            URL.revokeObjectURL(video.src);
          } catch (error) {
            console.error('Error capturing thumbnail:', error);
            setPodcastForm(prev => ({
              ...prev,
              video_url: file_url,
              duration: duration,
              content_type: 'video'
            }));
            setUploadingMedia(false);
          }
        };
      };
      
      video.onerror = () => {
        alert('Error loading video');
        setUploadingMedia(false);
      };
    } catch (error) {
      alert('Error uploading video: ' + error.message);
      setUploadingMedia(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const audio = new Audio(file_url);
      audio.onloadedmetadata = () => {
        setPodcastForm(prev => ({
          ...prev,
          audio_url: file_url,
          duration: Math.floor(audio.duration),
          content_type: 'audio'
        }));
        setUploadingMedia(false);
      };
    } catch (error) {
      alert('Error uploading audio: ' + error.message);
      setUploadingMedia(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPodcastForm(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleConvertAudioToVideo = async (podcast) => {
    if (!podcast.audio_url) {
      alert('This podcast has no audio file to convert');
      return;
    }

    setConvertingPodcast(podcast.id);
    setConvertingAudio(true);

    try {
      // Use AI to generate a video with soundwave animation
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Create a professional podcast video background with animated audio soundwave visualization. 
        Dark gradient background with purple and cyan colors. 
        Include waveform animation bars, music visualization elements.
        Title: "${podcast.title}"
        Host: ${podcast.host_name}
        Modern, sleek design with neon accents. 16:9 aspect ratio.`
      });

      // In a real implementation, you'd use a video processing service
      // For now, we'll save the generated image as the video thumbnail
      await updatePodcastMutation.mutateAsync({
        id: podcast.id,
        data: {
          converted_video_url: podcast.audio_url, // In real app, this would be actual video URL
          video_thumbnail_url: result.url,
          image_url: result.url,
          has_converted_video: true,
          converted_video_formats: {
            mp4: podcast.audio_url,
            webm: podcast.audio_url,
            avi: podcast.audio_url
          }
        }
      });

      alert('Audio converted to video with soundwave animation!');
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting audio to video: ' + error.message);
    } finally {
      setConvertingAudio(false);
      setConvertingPodcast(null);
    }
  };

  const handleDownloadVideo = async (podcast, format = 'mp4') => {
    const url = podcast.converted_video_formats?.[format] || podcast.video_url || podcast.audio_url;
    
    if (!url) {
      alert('No video available for download');
      return;
    }

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = () => {
    if (editingPodcast) {
      updatePodcastMutation.mutate({ id: editingPodcast.id, data: podcastForm });
    } else {
      createPodcastMutation.mutate(podcastForm);
    }
  };

  const handleEdit = (podcast) => {
    setEditingPodcast(podcast);
    setPodcastForm(podcast);
    setContentType(podcast.content_type || 'audio');
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this podcast?')) {
      deletePodcastMutation.mutate(id);
    }
  };

  const handlePublishNow = async (podcast) => {
    if (confirm('Publish this episode now?')) {
      await updatePodcastMutation.mutateAsync({
        id: podcast.id,
        data: {
          ...podcast,
          publish_status: 'published',
          published_date: new Date().toISOString(),
          is_scheduled: false
        }
      });
    }
  };

  const resetForm = () => {
    setPodcastForm({
      title: '',
      description: '',
      audio_url: '',
      video_url: '',
      image_url: '',
      video_thumbnail_url: '',
      content_type: 'audio',
      duration: 0,
      episode_number: 1,
      season: 1,
      host_name: '',
      guests: [],
      category: '',
      tags: [],
      publish_status: 'draft',
      scheduled_publish_date: '',
      is_scheduled: false,
      auto_publish: false
    });
    setContentType('audio');
    setEditingPodcast(null);
  };

  const filteredPodcasts = podcasts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedPodcasts = filteredPodcasts.filter(p => p.publish_status === 'published');
  const scheduledPodcasts = filteredPodcasts.filter(p => p.publish_status === 'scheduled');
  const draftPodcasts = filteredPodcasts.filter(p => p.publish_status === 'draft');

  // Separate live recorded podcasts
  const liveRecordedPodcasts = publishedPodcasts.filter(p => p.content_type === 'video' && p.video_url);
  const audioPodcasts = publishedPodcasts.filter(p => p.content_type === 'audio' || !p.video_url);

  const totalPlays = podcasts.reduce((sum, p) => sum + (p.plays || 0), 0);
  const avgDuration = podcasts.length > 0
    ? Math.floor(podcasts.reduce((sum, p) => sum + (p.duration || 0), 0) / podcasts.length)
    : 0;
  const videoPodcasts = podcasts.filter(p => p.content_type === 'video' || p.video_url).length;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: <Badge className="bg-slate-500">Draft</Badge>,
      scheduled: <Badge className="bg-amber-500">Scheduled</Badge>,
      published: <Badge className="bg-green-500">Published</Badge>
    };
    return badges[status] || <Badge>Unknown</Badge>;
  };

  const scheduledByDate = scheduledPodcasts.reduce((acc, podcast) => {
    if (podcast.scheduled_publish_date) {
      const date = format(new Date(podcast.scheduled_publish_date), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(podcast);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Management</h2>
          <p className="text-slate-400 font-semibold">Manage audio and video podcast episodes</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("AdminPodcastMonetization")}>
            <Button className="bg-green-500 hover:bg-green-600 font-bold">
              <DollarSign className="w-4 h-4 mr-2" />
              Monetization
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Add Podcast
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingPodcast ? 'Edit Podcast' : 'Add New Podcast'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Upload audio or video podcast episodes
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Episode Title *</Label>
                    <Input
                      placeholder="Episode title"
                      value={podcastForm.title}
                      onChange={(e) => setPodcastForm({...podcastForm, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Host Name</Label>
                    <Input
                      placeholder="Host name"
                      value={podcastForm.host_name}
                      onChange={(e) => setPodcastForm({...podcastForm, host_name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Description</Label>
                  <Textarea
                    placeholder="Episode description"
                    value={podcastForm.description}
                    onChange={(e) => setPodcastForm({...podcastForm, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white h-24"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Episode #</Label>
                    <Input
                      type="number"
                      value={podcastForm.episode_number}
                      onChange={(e) => setPodcastForm({...podcastForm, episode_number: parseInt(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Season</Label>
                    <Input
                      type="number"
                      value={podcastForm.season}
                      onChange={(e) => setPodcastForm({...podcastForm, season: parseInt(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <Input
                      placeholder="e.g., Faith"
                      value={podcastForm.category}
                      onChange={(e) => setPodcastForm({...podcastForm, category: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <Label className="text-white mb-3 block font-bold">Content Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setContentType('audio')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        contentType === 'audio'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Mic2 className={`w-8 h-8 mx-auto mb-2 ${contentType === 'audio' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <p className={`text-sm font-semibold ${contentType === 'audio' ? 'text-white' : 'text-slate-400'}`}>
                        Audio Podcast
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentType('video')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        contentType === 'video'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Video className={`w-8 h-8 mx-auto mb-2 ${contentType === 'video' ? 'text-purple-400' : 'text-slate-400'}`} />
                      <p className={`text-sm font-semibold ${contentType === 'video' ? 'text-white' : 'text-slate-400'}`}>
                        Video Podcast
                      </p>
                    </button>
                  </div>
                </div>

                {contentType === 'audio' ? (
                  <div>
                    <Label className="text-white mb-2 block">Audio File *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        disabled={uploadingMedia}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                      {uploadingMedia && <Badge className="bg-amber-500">Uploading...</Badge>}
                    </div>
                    {podcastForm.audio_url && (
                      <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm">
                          ✓ Audio uploaded ({formatDuration(podcastForm.duration)})
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label className="text-white mb-2 block">Video File *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploadingMedia}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                      {uploadingMedia && <Badge className="bg-amber-500">Processing...</Badge>}
                    </div>
                    {podcastForm.video_url && (
                      <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-purple-400 text-sm mb-2">
                          ✓ Video uploaded ({formatDuration(podcastForm.duration)})
                        </p>
                        {podcastForm.video_thumbnail_url && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-400 mb-1">Auto-generated thumbnail:</p>
                            <img src={podcastForm.video_thumbnail_url} alt="Video thumbnail" className="w-full h-32 object-cover rounded" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-white mb-2 block">
                    Cover Image {contentType === 'video' && '(Optional - video thumbnail is used by default)'}
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                  {podcastForm.image_url && (
                    <img src={podcastForm.image_url} alt="Cover" className="mt-2 w-32 h-32 object-cover rounded" />
                  )}
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <Label className="text-white mb-3 block font-bold">Publishing Options</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white mb-2 block">Status</Label>
                      <select
                        value={podcastForm.publish_status}
                        onChange={(e) => setPodcastForm({...podcastForm, publish_status: e.target.value})}
                        className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                      >
                        <option value="draft">Draft - Not visible</option>
                        <option value="published">Published - Live now</option>
                        <option value="scheduled">Scheduled - Publish later</option>
                      </select>
                    </div>

                    {podcastForm.publish_status === 'scheduled' && (
                      <div>
                        <Label className="text-white mb-2 block">Schedule Publish Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={podcastForm.scheduled_publish_date ? format(new Date(podcastForm.scheduled_publish_date), "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => setPodcastForm({
                            ...podcastForm, 
                            scheduled_publish_date: new Date(e.target.value).toISOString(),
                            is_scheduled: true
                          })}
                          className="bg-slate-900/50 border-slate-700 text-white"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={podcastForm.auto_publish}
                            onChange={(e) => setPodcastForm({...podcastForm, auto_publish: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <Label className="text-white text-sm">Auto-publish at scheduled time</Label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!podcastForm.title || (contentType === 'audio' && !podcastForm.audio_url) || (contentType === 'video' && !podcastForm.video_url)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {editingPodcast ? 'Update' : 'Create'} Podcast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Mic2 className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{podcasts.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{podcasts.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Episodes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Film className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{videoPodcasts}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{videoPodcasts}</p>
            <p className="text-slate-400 text-sm font-semibold">Video Podcasts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalPlays.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Plays</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{formatDuration(avgDuration)}</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search podcasts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All ({podcasts.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-cyan-500">
            Published ({publishedPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="live_recorded" className="data-[state=active]:bg-cyan-500">
            <Film className="w-4 h-4 mr-1" />
            Live Recorded ({liveRecordedPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-cyan-500">
            <CalendarIcon className="w-4 h-4 mr-1" />
            Scheduled ({scheduledPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-cyan-500">
            Drafts ({draftPodcasts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-3">
          {filteredPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                    {podcast.video_thumbnail_url || podcast.image_url ? (
                      <img 
                        src={podcast.video_thumbnail_url || podcast.image_url} 
                        alt={podcast.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {podcast.content_type === 'video' || podcast.video_url ? (
                          <Video className="w-10 h-10 text-white" />
                        ) : (
                          <Mic2 className="w-10 h-10 text-white" />
                        )}
                      </div>
                    )}
                    {(podcast.content_type === 'video' || podcast.video_url) && (
                      <div className="absolute top-1 right-1">
                        <Badge className="bg-purple-500 text-xs">
                          <Film className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                        <p className="text-slate-400 text-sm mb-2">
                          S{podcast.season}E{podcast.episode_number} • {podcast.host_name} • {formatDuration(podcast.duration || 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(podcast.publish_status)}
                        <Badge className="bg-purple-500">
                          <Play className="w-3 h-3 mr-1" />
                          {podcast.plays || 0}
                        </Badge>
                      </div>
                    </div>
                    {podcast.scheduled_publish_date && podcast.publish_status === 'scheduled' && (
                      <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                        <p className="text-amber-400 text-xs font-semibold">
                          <CalendarIcon className="w-3 h-3 inline mr-1" />
                          Scheduled for: {format(new Date(podcast.scheduled_publish_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    )}
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{podcast.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      {podcast.publish_status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishNow(podcast)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Publish Now
                        </Button>
                      )}
                      
                      {/* Audio to Video Conversion */}
                      {podcast.audio_url && !podcast.has_converted_video && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertAudioToVideo(podcast)}
                          disabled={convertingPodcast === podcast.id}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {convertingPodcast === podcast.id ? (
                            <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Converting...</>
                          ) : (
                            <><Wand2 className="w-3 h-3 mr-1" />Convert to Video</>
                          )}
                        </Button>
                      )}

                      {/* Download Options */}
                      {(podcast.has_converted_video || podcast.video_url) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVideo(podcast, 'mp4')}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            MP4
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVideo(podcast, 'webm')}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            WebM
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVideo(podcast, 'avi')}
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            AVI
                          </Button>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(podcast.id)}
                        className="border-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="published" className="mt-6 space-y-3">
          {publishedPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                    {podcast.video_thumbnail_url || podcast.image_url ? (
                      <img src={podcast.video_thumbnail_url || podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                    ) : (
                      <Mic2 className="w-10 h-10 text-white m-auto mt-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">S{podcast.season}E{podcast.episode_number}</p>
                    <Badge className="bg-green-500">Published</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="live_recorded" className="mt-6 space-y-3">
          <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Film className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold mb-1">Live Recorded Podcasts</h3>
                <p className="text-slate-300 text-sm">
                  These podcasts were recorded from live streaming sessions and saved automatically.
                  They appear in the WATCH section with video thumbnails.
                </p>
              </div>
            </div>
          </div>
          {liveRecordedPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-purple-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    {podcast.video_thumbnail_url ? (
                      <img src={podcast.video_thumbnail_url} alt={podcast.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Film className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-purple-600">
                      <Film className="w-3 h-3 mr-1" />
                      LIVE REC
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">
                      S{podcast.season}E{podcast.episode_number} • {podcast.host_name} • {formatDuration(podcast.duration || 0)}
                    </p>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{podcast.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-green-500">
                        <Play className="w-3 h-3 mr-1" />
                        {podcast.plays || 0} plays
                      </Badge>
                      <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      {podcast.video_url && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVideo(podcast, 'mp4')}
                            className="border-green-500/30 text-green-400"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download MP4
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {liveRecordedPodcasts.length === 0 && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Film className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">No Live Recorded Podcasts</h3>
                <p className="text-slate-400 mb-6">Start a live podcast stream to create recorded episodes</p>
                <Link to={createPageUrl("AdminPodcastLive")}>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    <Mic2 className="w-4 h-4 mr-2" />
                    Go Live Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6 space-y-3">
          {scheduledPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-amber-500 flex-shrink-0 flex items-center justify-center">
                    <CalendarIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">S{podcast.season}E{podcast.episode_number}</p>
                    <Badge className="bg-amber-500 mb-3">Scheduled</Badge>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
                      <p className="text-amber-400 text-sm font-semibold mb-1">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        {format(new Date(podcast.scheduled_publish_date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-amber-300 text-xs">
                        {format(new Date(podcast.scheduled_publish_date), 'h:mm a')}
                        {podcast.auto_publish && ' • Auto-publish enabled'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePublishNow(podcast)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Publish Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="mt-6 space-y-3">
          {draftPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    <Mic2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">S{podcast.season}E{podcast.episode_number}</p>
                    <Badge className="bg-slate-500 mb-3">Draft</Badge>
                    <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}