import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Play, Pause, Volume2, VolumeX, Scissors, Layers, Palette,
  Zap, Download, Save, RefreshCw, Settings, Type, Image,
  Sparkles, Film, MonitorPlay, Crop, RotateCw, Contrast, ArrowLeft
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPodcastVideoEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const podcastId = urlParams.get('id');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Video editing controls
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, setTextPosition] = useState('bottom');
  const [filterPreset, setFilterPreset] = useState('none');
  const [speed, setSpeed] = useState(100);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: podcast, isLoading } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: async () => {
      if (!podcastId) return null;
      const results = await base44.entities.Podcast.filter({ id: podcastId });
      return results[0] || null;
    },
    enabled: !!podcastId,
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    },
  });

  useEffect(() => {
    if (videoRef.current && podcast?.video_url) {
      videoRef.current.src = podcast.video_url;
      videoRef.current.volume = volume / 100;
      applyVideoFilters();
    }
  }, [podcast, volume]);

  useEffect(() => {
    applyVideoFilters();
  }, [brightness, contrast, saturation, blur, rotation, zoom, filterPreset]);

  const applyVideoFilters = () => {
    if (videoRef.current) {
      const filters = [
        `brightness(${brightness}%)`,
        `contrast(${contrast}%)`,
        `saturate(${saturation}%)`,
        `blur(${blur}px)`,
      ];

      if (filterPreset === 'vintage') {
        filters.push('sepia(50%)', 'contrast(110%)');
      } else if (filterPreset === 'bw') {
        filters.push('grayscale(100%)');
      } else if (filterPreset === 'vibrant') {
        filters.push('saturate(150%)', 'contrast(120%)');
      }

      videoRef.current.style.filter = filters.join(' ');
      videoRef.current.style.transform = `rotate(${rotation}deg) scale(${zoom / 100})`;
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `frame_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      alert('Frame captured! URL: ' + file_url);
    });
  };

  const handleExport = async () => {
    if (!podcast?.video_url) {
      alert('No video file to export');
      return;
    }

    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = podcast.video_url;
      link.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_edited.webm`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Download started! Check your downloads folder.');
    } catch (error) {
      alert('Download error: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading video editor...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Film className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">No Video Found</h2>
            <p className="text-slate-400 mb-6">Could not load podcast video</p>
            <Link to={createPageUrl("AdminPodcasts")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Podcasts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AdminPodcasts")}>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Podcasts
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white mb-1">Video Editor</h2>
            <p className="text-slate-400">{podcast.title}</p>
          </div>
        </div>
        <Button 
          onClick={handleExport}
          disabled={downloading}
          className="bg-cyan-500 hover:bg-cyan-600"
        >
          {downloading ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Downloading...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" />Export Video</>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full"
                  style={{ objectFit: 'contain' }}
                />
                {overlayText && (
                  <div 
                    className={`absolute left-1/2 -translate-x-1/2 text-white font-bold text-2xl px-4 py-2 bg-black/50 rounded ${
                      textPosition === 'top' ? 'top-4' : 'bottom-4'
                    }`}
                  >
                    {overlayText}
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Timeline */}
                <div>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={togglePlay}
                    className="bg-cyan-500 hover:bg-cyan-600 w-16 h-16 rounded-full"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={100}
                    onValueChange={([v]) => setVolume(v)}
                    className="flex-1"
                  />
                  <span className="text-white text-sm w-12">{volume}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editing Tools */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="bg-slate-800 w-full">
              <TabsTrigger value="filters" className="flex-1">
                <Palette className="w-4 h-4 mr-1" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1">
                <Type className="w-4 h-4 mr-1" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4 mt-4">
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Color Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Brightness: {brightness}%</Label>
                    <Slider
                      value={[brightness]}
                      min={50}
                      max={150}
                      onValueChange={([v]) => setBrightness(v)}
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm mb-2 block">Contrast: {contrast}%</Label>
                    <Slider
                      value={[contrast]}
                      min={50}
                      max={150}
                      onValueChange={([v]) => setContrast(v)}
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm mb-2 block">Saturation: {saturation}%</Label>
                    <Slider
                      value={[saturation]}
                      min={0}
                      max={200}
                      onValueChange={([v]) => setSaturation(v)}
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm mb-2 block">Filter Preset</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['none', 'vintage', 'bw', 'vibrant'].map(preset => (
                        <Button
                          key={preset}
                          size="sm"
                          variant={filterPreset === preset ? 'default' : 'outline'}
                          onClick={() => setFilterPreset(preset)}
                          className={filterPreset === preset ? 'bg-cyan-500' : 'border-slate-700'}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Transform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Rotation: {rotation}°</Label>
                    <Slider
                      value={[rotation]}
                      min={-180}
                      max={180}
                      onValueChange={([v]) => setRotation(v)}
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm mb-2 block">Zoom: {zoom}%</Label>
                    <Slider
                      value={[zoom]}
                      min={50}
                      max={200}
                      onValueChange={([v]) => setZoom(v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="space-y-4 mt-4">
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Text Overlay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Text</Label>
                    <Input
                      placeholder="Enter text..."
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm mb-2 block">Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={textPosition === 'top' ? 'default' : 'outline'}
                        onClick={() => setTextPosition('top')}
                        className={textPosition === 'top' ? 'bg-cyan-500' : 'border-slate-700'}
                      >
                        Top
                      </Button>
                      <Button
                        size="sm"
                        variant={textPosition === 'bottom' ? 'default' : 'outline'}
                        onClick={() => setTextPosition('bottom')}
                        className={textPosition === 'bottom' ? 'bg-cyan-500' : 'border-slate-700'}
                      >
                        Bottom
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-4 space-y-2">
              <Button
                onClick={captureFrame}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                <Image className="w-4 h-4 mr-2" />
                Capture Frame
              </Button>
              <Button
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturation(100);
                  setBlur(0);
                  setRotation(0);
                  setZoom(100);
                  setFilterPreset('none');
                  setOverlayText('');
                }}
                className="w-full bg-slate-700 hover:bg-slate-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}