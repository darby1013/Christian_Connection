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
  Sparkles, Film, MonitorPlay, Crop, RotateCw, Contrast
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function PodcastVideoEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const podcastId = urlParams.get('id');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const { data: podcast } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => base44.entities.Podcast.filter({ id: podcastId }).then(res => res[0]),
    enabled: !!podcastId,
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
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

  const handleExport = () => {
    alert('Exporting video with applied effects...\n(In production, this would process and download the edited video)');
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!podcast) {
    return <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Video Editor</h1>
            <p className="text-slate-400">{podcast.title}</p>
          </div>
          <Button onClick={handleExport} className="bg-cyan-500 hover:bg-cyan-600">
            <Download className="w-4 h-4 mr-2" />
            Export Video
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                {/* Video Display */}
                <div className="relative aspect-video bg-black rounded-lg mb-6 overflow-hidden">
                  <video
                    ref={videoRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain transition-all duration-300"
                  />
                  {overlayText && (
                    <div 
                      className={`absolute ${
                        textPosition === 'top' ? 'top-8' : 
                        textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 
                        'bottom-8'
                      } left-0 right-0 text-center`}
                    >
                      <p className="text-white text-2xl font-bold drop-shadow-lg px-4">
                        {overlayText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="mb-4">
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

                {/* Playback Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      size="lg"
                      onClick={togglePlay}
                      className="bg-cyan-500 hover:bg-cyan-600 w-12 h-12 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-xs">
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

            {/* Editing Tools */}
            <Tabs defaultValue="color" className="w-full">
              <TabsList className="bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="color" className="data-[state=active]:bg-cyan-500">
                  <Palette className="w-4 h-4 mr-2" />
                  Color
                </TabsTrigger>
                <TabsTrigger value="transform" className="data-[state=active]:bg-cyan-500">
                  <RotateCw className="w-4 h-4 mr-2" />
                  Transform
                </TabsTrigger>
                <TabsTrigger value="overlay" className="data-[state=active]:bg-cyan-500">
                  <Type className="w-4 h-4 mr-2" />
                  Overlay
                </TabsTrigger>
                <TabsTrigger value="filters" className="data-[state=active]:bg-cyan-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Filters
                </TabsTrigger>
              </TabsList>

              <TabsContent value="color" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="text-white font-bold mb-3 block">Brightness</Label>
                      <Slider
                        value={[brightness]}
                        min={0}
                        max={200}
                        onValueChange={([v]) => setBrightness(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{brightness}%</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <Contrast className="w-4 h-4" />
                        Contrast
                      </Label>
                      <Slider
                        value={[contrast]}
                        min={0}
                        max={200}
                        onValueChange={([v]) => setContrast(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{contrast}%</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block">Saturation</Label>
                      <Slider
                        value={[saturation]}
                        min={0}
                        max={200}
                        onValueChange={([v]) => setSaturation(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{saturation}%</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block">Blur</Label>
                      <Slider
                        value={[blur]}
                        min={0}
                        max={10}
                        step={0.5}
                        onValueChange={([v]) => setBlur(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{blur}px</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transform" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <RotateCw className="w-4 h-4" />
                        Rotation
                      </Label>
                      <Slider
                        value={[rotation]}
                        min={-180}
                        max={180}
                        onValueChange={([v]) => setRotation(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{rotation}°</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block">Zoom</Label>
                      <Slider
                        value={[zoom]}
                        min={50}
                        max={200}
                        onValueChange={([v]) => setZoom(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{zoom}%</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <Crop className="w-4 h-4" />
                        Crop Position X
                      </Label>
                      <Slider
                        value={[cropX]}
                        min={-50}
                        max={50}
                        onValueChange={([v]) => setCropX(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{cropX}%</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block">Crop Position Y</Label>
                      <Slider
                        value={[cropY]}
                        min={-50}
                        max={50}
                        onValueChange={([v]) => setCropY(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{cropY}%</p>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <MonitorPlay className="w-4 h-4" />
                        Playback Speed
                      </Label>
                      <Slider
                        value={[speed]}
                        min={50}
                        max={200}
                        onValueChange={([v]) => {
                          setSpeed(v);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = v / 100;
                          }
                        }}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{speed}%</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overlay" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Text Overlay
                      </Label>
                      <Input
                        placeholder="Enter overlay text..."
                        value={overlayText}
                        onChange={(e) => setOverlayText(e.target.value)}
                        className="bg-slate-900/50 border-slate-700 text-white mb-3"
                      />
                      <Label className="text-slate-400 text-sm mb-2 block">Text Position</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['top', 'center', 'bottom'].map(pos => (
                          <Button
                            key={pos}
                            size="sm"
                            onClick={() => setTextPosition(pos)}
                            className={textPosition === pos ? 'bg-cyan-500' : 'bg-slate-700'}
                          >
                            {pos}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={captureFrame} className="w-full bg-purple-500 hover:bg-purple-600">
                      <Image className="w-4 h-4 mr-2" />
                      Capture Current Frame
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="filters" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-white font-bold block">Preset Filters</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'none', label: 'None', color: 'bg-slate-700' },
                        { value: 'vintage', label: 'Vintage', color: 'bg-amber-600' },
                        { value: 'bw', label: 'Black & White', color: 'bg-slate-600' },
                        { value: 'vibrant', label: 'Vibrant', color: 'bg-pink-600' },
                      ].map(filter => (
                        <Button
                          key={filter.value}
                          onClick={() => setFilterPreset(filter.value)}
                          className={`${filterPreset === filter.value ? filter.color : 'bg-slate-800'} hover:opacity-80`}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Tools */}
          <div className="space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Quick Tools</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 justify-start">
                  <Scissors className="w-4 h-4 mr-2" />
                  Cut Section
                </Button>
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 justify-start">
                  <Layers className="w-4 h-4 mr-2" />
                  Add Layer
                </Button>
                <Button size="sm" onClick={captureFrame} className="w-full bg-purple-500 hover:bg-purple-600 justify-start">
                  <Image className="w-4 h-4 mr-2" />
                  Capture Frame
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Filter Presets</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  size="sm"
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 justify-start"
                  onClick={() => {
                    setBrightness(110);
                    setContrast(120);
                    setSaturation(130);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Professional
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 justify-start"
                  onClick={() => {
                    setBrightness(105);
                    setContrast(110);
                    setSaturation(120);
                  }}
                >
                  <Film className="w-4 h-4 mr-2" />
                  Cinematic
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 justify-start"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                    setBlur(0);
                    setRotation(0);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Video Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-semibold">{formatTime(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Format</span>
                  <span className="text-white font-semibold">Video</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Episode</span>
                  <span className="text-white font-semibold">S{podcast.season}E{podcast.episode_number}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}