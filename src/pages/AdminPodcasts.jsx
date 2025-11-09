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
  Download, Eye, BarChart3, Users, Clock, Star
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminPodcasts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [podcastForm, setPodcastForm] = useState({
    title: '',
    description: '',
    audio_url: '',
    image_url: '',
    duration: 0,
    episode_number: 1,
    season: 1,
    host_name: '',
    guests: [],
    category: '',
    tags: []
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

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Get audio duration
      const audio = new Audio(file_url);
      audio.onloadedmetadata = () => {
        setPodcastForm(prev => ({
          ...prev,
          audio_url: file_url,
          duration: Math.floor(audio.duration)
        }));
        setUploadingAudio(false);
      };
    } catch (error) {
      alert('Error uploading audio: ' + error.message);
      setUploadingAudio(false);
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

  const handleSubmit = () => {
    if (editingPodcast) {
      updatePodcastMutation.mutate({ id: editingPodcast.id, data: podcastForm });
    } else {
      createPodcastMutation.mutate({ ...podcastForm, published_date: new Date().toISOString() });
    }
  };

  const handleEdit = (podcast) => {
    setEditingPodcast(podcast);
    setPodcastForm(podcast);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this podcast?')) {
      deletePodcastMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setPodcastForm({
      title: '',
      description: '',
      audio_url: '',
      image_url: '',
      duration: 0,
      episode_number: 1,
      season: 1,
      host_name: '',
      guests: [],
      category: '',
      tags: []
    });
    setEditingPodcast(null);
  };

  const filteredPodcasts = podcasts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPlays = podcasts.reduce((sum, p) => sum + (p.plays || 0), 0);
  const avgDuration = podcasts.length > 0
    ? Math.floor(podcasts.reduce((sum, p) => sum + (p.duration || 0), 0) / podcasts.length)
    : 0;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Management</h2>
          <p className="text-slate-400 font-semibold">Manage your podcast episodes and analytics</p>
        </div>
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
                Upload and manage podcast episodes
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

              <div>
                <Label className="text-white mb-2 block">Audio File *</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={uploadingAudio}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                  {uploadingAudio && <Badge className="bg-amber-500">Uploading...</Badge>}
                </div>
                {podcastForm.audio_url && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ Audio uploaded ({formatDuration(podcastForm.duration)})
                  </p>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Cover Image</Label>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!podcastForm.title || !podcastForm.audio_url}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {editingPodcast ? 'Update' : 'Create'} Podcast
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {podcasts.filter(p => p.plays > 1000).length}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Top Episodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search podcasts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      {/* Podcasts List */}
      <div className="space-y-3">
        {filteredPodcasts.map((podcast) => (
          <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                  {podcast.image_url ? (
                    <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mic2 className="w-10 h-10 text-white" />
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
                      <Badge className="bg-purple-500">
                        <Play className="w-3 h-3 mr-1" />
                        {podcast.plays || 0}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{podcast.description}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                      <Eye className="w-3 h-3 mr-1" />
                      Analytics
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(podcast.id)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
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
      </div>

      {filteredPodcasts.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Mic2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Podcasts</h3>
            <p className="text-slate-400 mb-6">Start by adding your first podcast episode</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add First Podcast
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}