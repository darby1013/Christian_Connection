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

  const { data: podcast } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => base44.entities.Podcast.filter({ id: podcastId }).then(res => res[0]),
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

  if (!podcast) {
    return <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>;
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
        {/* ... keep existing code (main video player and editing tools) ... */}
      </div>
    </div>
  );
}