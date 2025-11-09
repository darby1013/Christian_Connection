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
  Video, Plus, Search, TrendingUp, Play, Trash2, Edit, Upload,
  Eye, BarChart3, Clock, ThumbsUp, MessageSquare, Download
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

export default function AdminVideos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    category: '',
    tags: [],
    host_name: ''
  });

  const queryClient = useQueryClient();

  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: () => base44.entities.Video.list('-recorded_date'),
    initialData: [],
  });

  const createVideoMutation = useMutation({
    mutationFn: (data) => base44.entities.Video.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Video.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id) => base44.entities.Video.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoForm(prev => ({
          ...prev,
          video_url: file_url,
          duration: Math.floor(video.duration)
        }));
        URL.revokeObjectURL(video.src);
        setUploadingVideo(false);
      };
      video.src = URL.createObjectURL(file);
    } catch (error) {
      alert('Error uploading video: ' + error.message);
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoForm(prev => ({ ...prev, thumbnail_url: file_url }));
    } catch (error) {
      alert('Error uploading thumbnail: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data: videoForm });
    } else {
      createVideoMutation.mutate({ ...videoForm, recorded_date: new Date().toISOString() });
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setVideoForm(video);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this video?')) {
      deleteVideoMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setVideoForm({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      duration: 0,
      category: '',
      tags: [],
      host_name: ''
    });
    setEditingVideo(null);
  };

  const filteredVideos = videos.filter(v =>
    v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
  const avgDuration = videos.length > 0
    ? Math.floor(videos.reduce((sum, v) => sum + (v.duration || 0), 0) / videos.length / 60)
    : 0;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Video Management</h2>
          <p className="text-slate-400 font-semibold">Manage video content and analytics</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Video Title *</Label>
                <Input
                  placeholder="Video title"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Video description"
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({...videoForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white mb-2 block">Host Name</Label>
                  <Input
                    placeholder="Host name"
                    value={videoForm.host_name}
                    onChange={(e) => setVideoForm({...videoForm, host_name: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g., Worship"
                    value={videoForm.category}
                    onChange={(e) => setVideoForm({...videoForm, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Video File *</Label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {uploadingVideo && <Badge className="bg-amber-500 mt-2">Uploading...</Badge>}
                {videoForm.video_url && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ Video uploaded ({formatDuration(videoForm.duration)})
                  </p>
                )}
              </div>

              <div>
                <Label className="text-white mb-2 block">Thumbnail</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {videoForm.thumbnail_url && (
                  <img src={videoForm.thumbnail_url} alt="Thumbnail" className="mt-2 w-full h-40 object-cover rounded" />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!videoForm.title || !videoForm.video_url}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {editingVideo ? 'Update' : 'Create'} Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-8 h-8 text-blue-400" />
              <Badge className="bg-blue-500">{videos.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{videos.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Videos</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalViews.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Views</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ThumbsUp className="w-8 h-8 text-pink-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalLikes.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Likes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{avgDuration} min</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="bg-[#1a1f3a] border-slate-700 overflow-hidden">
            <div className="relative aspect-video bg-black">
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-16 h-16 text-slate-600" />
                </div>
              )}
              <Badge className="absolute bottom-2 right-2 bg-black/80">
                {formatDuration(video.duration || 0)}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="text-white font-bold mb-2 line-clamp-2">{video.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{video.host_name}</p>
              <div className="flex items-center gap-4 text-slate-400 text-sm mb-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {video.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {video.likes || 0}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(video)} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(video.id)}
                  className="border-red-500/30 text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Videos</h3>
            <p className="text-slate-400 mb-6">Start by uploading your first video</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add First Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}