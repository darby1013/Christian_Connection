import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Image as ImageIcon, Music, Video, Download,
  CheckCircle, Loader2, Play, FileAudio, Sparkles, Youtube,
  Facebook, Instagram
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminAudioUpload() {
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [audioInfo, setAudioInfo] = useState({
    title: '',
    description: '',
    category: '',
    author_name: ''
  });

  const queryClient = useQueryClient();

  const { data: audioFiles = [] } = useQuery({
    queryKey: ['audioFiles'],
    queryFn: () => base44.entities.AudioFile.list('-created_date'),
    initialData: [],
  });

  const uploadAudioMutation = useMutation({
    mutationFn: async (data) => {
      // Upload audio file
      const audioUpload = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      // Upload cover image
      let coverUrl = null;
      if (coverImage) {
        const imageUpload = await base44.integrations.Core.UploadFile({ file: coverImage });
        coverUrl = imageUpload.file_url;
      }

      // Create audio file record
      return base44.entities.AudioFile.create({
        ...audioInfo,
        audio_url: audioUpload.file_url,
        cover_image: coverUrl,
        format: audioFile.name.split('.').pop(),
        file_size: audioFile.size,
        is_published: false,
        video_conversion_status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      setAudioFile(null);
      setCoverImage(null);
      setAudioInfo({ title: '', description: '', category: '', author_name: '' });
      setUploadProgress(0);
    }
  });

  const convertToVideoMutation = useMutation({
    mutationFn: async ({ audioId, format }) => {
      setConverting(true);
      
      // Simulate video conversion (in production, this would call a video processing service)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update audio file with video URL
      await base44.entities.AudioFile.update(audioId, {
        video_conversion_status: 'completed',
        video_url: `https://example.com/videos/${audioId}.${format}`,
        video_formats: [
          { format: 'mp4', url: `https://example.com/videos/${audioId}.mp4`, size: 15000000 },
          { format: 'mov', url: `https://example.com/videos/${audioId}.mov`, size: 18000000 },
          { format: 'avi', url: `https://example.com/videos/${audioId}.avi`, size: 20000000 },
          { format: 'webm', url: `https://example.com/videos/${audioId}.webm`, size: 12000000 }
        ]
      });
      
      setConverting(false);
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    }
  });

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      // Get audio duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        setAudioInfo(prev => ({ ...prev, duration: Math.floor(audio.duration) }));
      });
    } else {
      alert('Please select a valid audio file');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCoverImage(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }
    if (!audioInfo.title.trim()) {
      alert('Please enter a title');
      return;
    }

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    await uploadAudioMutation.mutateAsync();
    setUploadProgress(100);
    clearInterval(progressInterval);
  };

  const downloadVideo = (url, format) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `podcast.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Audio Upload & Conversion</h2>
          <p className="text-slate-400 font-semibold">Upload audio podcasts and convert to video format</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Upload Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Audio Upload */}
              <div>
                <Label className="text-white font-bold mb-2 block">Audio File *</Label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    {audioFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileAudio className="w-8 h-8 text-cyan-400" />
                        <div className="text-left">
                          <p className="text-white font-bold">{audioFile.name}</p>
                          <p className="text-slate-400 text-sm">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-white font-semibold mb-1">Click to upload audio</p>
                        <p className="text-slate-400 text-sm">MP3, WAV, AAC, M4A supported</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label className="text-white font-bold mb-2 block">Cover Image</Label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {coverImage ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={URL.createObjectURL(coverImage)} alt="Cover" className="w-16 h-16 rounded object-cover" />
                        <div className="text-left">
                          <p className="text-white font-bold">{coverImage.name}</p>
                          <p className="text-slate-400 text-sm">{(coverImage.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-white font-semibold mb-1">Click to upload cover art</p>
                        <p className="text-slate-400 text-sm">JPG, PNG, WebP supported</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Title *</Label>
                  <Input
                    placeholder="Episode title..."
                    value={audioInfo.title}
                    onChange={(e) => setAudioInfo({...audioInfo, title: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g., Teaching"
                    value={audioInfo.category}
                    onChange={(e) => setAudioInfo({...audioInfo, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Description</Label>
                <Textarea
                  placeholder="Describe your podcast..."
                  value={audioInfo.description}
                  onChange={(e) => setAudioInfo({...audioInfo, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">Uploading...</span>
                    <span className="text-cyan-400 font-bold text-sm">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={uploadAudioMutation.isPending || !audioFile}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-bold text-lg py-6"
              >
                {uploadAudioMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Audio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Tools */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardHeader className="border-b border-purple-500/20">
              <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Audio → Video
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-slate-300 text-sm mb-4">
                Convert your audio to video format for social media platforms
              </p>
              <div className="space-y-2">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white justify-start">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube (MP4)
                </Button>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white justify-start">
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram (MP4)
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook (MP4)
                </Button>
                <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white justify-start">
                  <Video className="w-4 h-4 mr-2" />
                  TikTok (MOV)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold text-base">Export Formats</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>MP4 (Standard)</span>
                  <Badge className="bg-green-500">HD</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>MOV (Apple)</span>
                  <Badge className="bg-blue-500">HD</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AVI (Legacy)</span>
                  <Badge className="bg-amber-500">HD</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>WebM (Web)</span>
                  <Badge className="bg-purple-500">HD</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Uploaded Files */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            <FileAudio className="w-6 h-6 text-cyan-400" />
            Uploaded Audio Files
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioFiles.map((audio) => (
              <Card key={audio.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  {audio.cover_image && (
                    <img src={audio.cover_image} alt={audio.title} className="w-full aspect-square object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="text-white font-bold mb-1 line-clamp-2">{audio.title}</h4>
                  <p className="text-slate-400 text-xs mb-3">{audio.category}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={
                      audio.video_conversion_status === 'completed' ? "bg-green-500" :
                      audio.video_conversion_status === 'processing' ? "bg-amber-500" :
                      audio.video_conversion_status === 'failed' ? "bg-red-500" :
                      "bg-slate-600"
                    }>
                      {audio.video_conversion_status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {audio.video_conversion_status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {audio.video_conversion_status}
                    </Badge>
                    <span className="text-xs text-slate-400">{audio.format}</span>
                  </div>

                  {audio.video_conversion_status === 'completed' ? (
                    <div className="space-y-2">
                      <Button className="w-full bg-cyan-500 hover:bg-cyan-600" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Select onValueChange={(format) => {
                        const videoFormat = audio.video_formats?.find(f => f.format === format);
                        if (videoFormat) downloadVideo(videoFormat.url, format);
                      }}>
                        <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Download Video" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {audio.video_formats?.map((format) => (
                            <SelectItem key={format.format} value={format.format} className="text-white">
                              {format.format.toUpperCase()} ({(format.size / 1024 / 1024).toFixed(1)} MB)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Button
                      onClick={() => convertToVideoMutation.mutate({ audioId: audio.id, format: 'mp4' })}
                      disabled={converting}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                      size="sm"
                    >
                      {converting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Convert to Video
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}