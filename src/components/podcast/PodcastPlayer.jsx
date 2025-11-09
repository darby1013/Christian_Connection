import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Volume2, VolumeX, SkipForward, SkipBack,
  Radio, Download, Share2, Heart, MessageSquare, Eye
} from "lucide-react";
import { motion } from "framer-motion";

export default function PodcastPlayer({ podcast, type = "audio", onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRef = type === "video" ? videoRef : audioRef;

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [mediaRef]);

  const togglePlay = () => {
    if (isPlaying) {
      mediaRef.current?.pause();
    } else {
      mediaRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (value) => {
    const newTime = value[0];
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Visual audio bars animation
  const [audioBars, setAudioBars] = useState(Array(20).fill(20));

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAudioBars(Array(20).fill(0).map(() => Math.random() * 60 + 20));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="w-full">
      <Card className="bg-[#1a1f3a] border-slate-700 overflow-hidden">
        {/* Media Container */}
        {type === "video" ? (
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              src={podcast.video_url || podcast.audio_url}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        ) : (
          <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
            <audio
              ref={audioRef}
              src={podcast.audio_url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Cover Art */}
            {podcast.cover_image || podcast.thumbnail_url ? (
              <img
                src={podcast.cover_image || podcast.thumbnail_url}
                alt={podcast.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Radio className="w-32 h-32 text-white/20" />
              </div>
            )}

            {/* Audio Visualizer */}
            <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-1 px-8 pb-4">
              {audioBars.map((height, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: isPlaying ? `${height}%` : '20%' }}
                  transition={{ duration: 0.1 }}
                  className="w-2 bg-cyan-400 rounded-t-full"
                  style={{ minHeight: '20%' }}
                />
              ))}
            </div>

            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="w-24 h-24 rounded-full bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center shadow-2xl"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-1" />
                )}
              </motion.button>
            </div>

            {/* Live Badge */}
            {podcast.status === 'live' && (
              <Badge variant="destructive" className="absolute top-4 left-4 animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
        )}

        {/* Controls */}
        <CardContent className="p-6 space-y-4 bg-slate-900/50">
          {/* Info */}
          <div>
            <h3 className="text-white font-bold text-xl mb-1">{podcast.title}</h3>
            <p className="text-slate-400 text-sm">{podcast.host_name || podcast.author_name}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleTimeChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => skip(-10)}
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={togglePlay}
                className="bg-cyan-500 hover:bg-cyan-600 w-12 h-12"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>

              <Button
                onClick={() => skip(10)}
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <div 
                className="relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 p-2 rounded-lg">
                    <Slider
                      orientation="vertical"
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="h-24"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-green-400">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-400">
                <Download className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-slate-400 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {podcast.plays || podcast.listener_count || 0} plays
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {podcast.likes || 0} likes
            </div>
            {podcast.category && (
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {podcast.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}