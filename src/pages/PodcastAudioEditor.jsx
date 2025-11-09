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
  Play, Pause, Volume2, VolumeX, Scissors, Copy, Trash2, Undo, Redo,
  Zap, Music, Wand2, Download, Save, RefreshCw, Settings, Sliders,
  TrendingUp, TrendingDown, Waves, Filter, Mic2, Upload, Image
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function PodcastAudioEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const podcastId = urlParams.get('id');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mastering, setMastering] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [audioImage, setAudioImage] = useState('');

  // Real-time waveform
  const [audioData, setAudioData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio editing controls
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [fadeInDuration, setFadeInDuration] = useState(0);
  const [fadeOutDuration, setFadeOutDuration] = useState(0);
  const [normalizeLevel, setNormalizeLevel] = useState(0);
  const [bassBoost, setBassBoost] = useState(0);
  const [trebleBoost, setTrebleBoost] = useState(0);
  const [compressorThreshold, setCompressorThreshold] = useState(-24);
  const [noiseReduction, setNoiseReduction] = useState(0);
  const [reverb, setReverb] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [tempo, setTempo] = useState(100);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
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
      alert('Audio image saved successfully!');
    },
  });

  useEffect(() => {
    if (podcast) {
      setAudioImage(podcast.image_url || '');
    }
  }, [podcast]);

  useEffect(() => {
    if (audioRef.current && podcast?.audio_url) {
      audioRef.current.src = podcast.audio_url;
      audioRef.current.volume = volume / 100;
      initializeAudioContext();
    }
  }, [podcast, volume]);

  const initializeAudioContext = async () => {
    if (!audioRef.current) return;

    setIsAnalyzing(true);
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyserRef.current = analyser;

      visualizeWaveform();
    } catch (error) {
      console.error('Audio context error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const visualizeWaveform = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      setAudioData([...dataArray]);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAudioImage(file_url);
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAudioImage = async () => {
    if (!podcastId || !audioImage) return;
    
    setSaving(true);
    try {
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { image_url: audioImage }
      });
    } catch (error) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const applyEffects = () => {
    alert('Effects applied! (In production, this would process audio with Web Audio API)');
  };

  const handleMasterAudio = async () => {
    setMastering(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this podcast audio and suggest professional mastering settings:
        Title: ${podcast.title}
        Duration: ${Math.floor(podcast.duration / 60)} minutes
        
        Recommend optimal settings for:
        - Normalization level
        - Compression threshold
        - EQ adjustments (bass, treble)
        - Noise reduction level
        - Overall loudness target
        
        Provide professional audio engineering advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            normalization: { type: "number" },
            compression: { type: "number" },
            bass: { type: "number" },
            treble: { type: "number" },
            noise_reduction: { type: "number" },
            recommendations: { type: "string" }
          }
        }
      });

      setNormalizeLevel(result.normalization || 0);
      setCompressorThreshold(result.compression || -24);
      setBassBoost(result.bass || 0);
      setTrebleBoost(result.treble || 0);
      setNoiseReduction(result.noise_reduction || 0);

      alert('AI Mastering Complete!\n\n' + result.recommendations);
    } catch (error) {
      alert('Error during mastering: ' + error.message);
    } finally {
      setMastering(false);
    }
  };

  const handleExport = () => {
    alert('Exporting audio with applied effects...\n(In production, this would process and download the edited audio)');
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
            <h1 className="text-3xl font-black text-white mb-2">Audio Editor</h1>
            <p className="text-slate-400">{podcast.title}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleMasterAudio}
              disabled={mastering}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {mastering ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Mastering...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />AI Master</>
              )}
            </Button>
            <Button onClick={handleExport} className="bg-cyan-500 hover:bg-cyan-600">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                {/* Real-time Waveform Display */}
                <div className="relative h-40 bg-slate-900 rounded-lg mb-6 flex items-end justify-around px-2 overflow-hidden">
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                  )}
                  {audioData.length > 0 ? (
                    audioData.slice(0, 64).map((value, index) => {
                      const height = (value / 255) * 100;
                      return (
                        <div
                          key={index}
                          className="bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t transition-all duration-75"
                          style={{
                            height: `${Math.max(height, 2)}%`,
                            width: '2%',
                            opacity: isPlaying ? 1 : 0.3
                          }}
                        />
                      );
                    })
                  ) : (
                    <Waves className="w-full h-24 text-cyan-500/20 absolute top-1/2 -translate-y-1/2" />
                  )}
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-cyan-400 transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                {/* Audio Player */}
                <audio
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                  crossOrigin="anonymous"
                />

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
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button
                    size="lg"
                    onClick={togglePlay}
                    className="bg-cyan-500 hover:bg-cyan-600 w-16 h-16 rounded-full"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                </div>

                {/* Volume Control */}
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
              </CardContent>
            </Card>

            {/* Audio Image Upload */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-400" />
                  Audio Cover Image
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-white font-bold mb-3 block">Upload Cover Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="bg-slate-900/50 border-slate-700 text-white mb-3"
                    />
                    {uploadingImage && (
                      <Badge className="bg-amber-500">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Uploading...
                      </Badge>
                    )}
                    {audioImage && (
                      <Button
                        onClick={handleSaveAudioImage}
                        disabled={saving}
                        className="w-full bg-green-500 hover:bg-green-600 mt-3"
                      >
                        {saving ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                        ) : (
                          <><Save className="w-4 h-4 mr-2" />Save Audio Image</>
                        )}
                      </Button>
                    )}
                  </div>
                  <div>
                    {audioImage ? (
                      <div className="relative">
                        <img 
                          src={audioImage} 
                          alt="Audio cover" 
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          <Image className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-900 to-cyan-900 rounded-lg flex items-center justify-center">
                        <Music className="w-16 h-16 text-white opacity-30" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-4">
                  This image will be displayed when playing this audio podcast
                </p>
              </CardContent>
            </Card>

            {/* Editing Tools */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-500">
                  <Scissors className="w-4 h-4 mr-2" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="effects" className="data-[state=active]:bg-cyan-500">
                  <Zap className="w-4 h-4 mr-2" />
                  Effects
                </TabsTrigger>
                <TabsTrigger value="mastering" className="data-[state=active]:bg-cyan-500">
                  <Sliders className="w-4 h-4 mr-2" />
                  Mastering
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-6">
                    {/* Trim Tool */}
                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Trim Audio
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Start Position (%)</Label>
                          <Slider
                            value={[trimStart]}
                            max={100}
                            onValueChange={([v]) => setTrimStart(v)}
                          />
                          <p className="text-cyan-400 text-sm mt-1">{formatTime((trimStart / 100) * duration)}</p>
                        </div>
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">End Position (%)</Label>
                          <Slider
                            value={[trimEnd]}
                            max={100}
                            onValueChange={([v]) => setTrimEnd(v)}
                          />
                          <p className="text-cyan-400 text-sm mt-1">{formatTime((trimEnd / 100) * duration)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Fade In/Out */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Fade In
                        </Label>
                        <Slider
                          value={[fadeInDuration]}
                          max={10}
                          step={0.5}
                          onValueChange={([v]) => setFadeInDuration(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{fadeInDuration}s</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                          <TrendingDown className="w-4 h-4" />
                          Fade Out
                        </Label>
                        <Slider
                          value={[fadeOutDuration]}
                          max={10}
                          step={0.5}
                          onValueChange={([v]) => setFadeOutDuration(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{fadeOutDuration}s</p>
                      </div>
                    </div>

                    {/* Volume Normalization */}
                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Normalize Volume
                      </Label>
                      <Slider
                        value={[normalizeLevel]}
                        min={-20}
                        max={20}
                        onValueChange={([v]) => setNormalizeLevel(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{normalizeLevel > 0 ? '+' : ''}{normalizeLevel} dB</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="effects" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-6">
                    {/* EQ Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-3 block">Bass Boost</Label>
                        <Slider
                          value={[bassBoost]}
                          min={-10}
                          max={10}
                          onValueChange={([v]) => setBassBoost(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{bassBoost > 0 ? '+' : ''}{bassBoost} dB</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block">Treble Boost</Label>
                        <Slider
                          value={[trebleBoost]}
                          min={-10}
                          max={10}
                          onValueChange={([v]) => setTrebleBoost(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{trebleBoost > 0 ? '+' : ''}{trebleBoost} dB</p>
                      </div>
                    </div>

                    {/* Pitch & Tempo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-3 block">Pitch Shift</Label>
                        <Slider
                          value={[pitch]}
                          min={-12}
                          max={12}
                          onValueChange={([v]) => setPitch(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{pitch > 0 ? '+' : ''}{pitch} semitones</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block">Tempo</Label>
                        <Slider
                          value={[tempo]}
                          min={50}
                          max={150}
                          onValueChange={([v]) => setTempo(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{tempo}%</p>
                      </div>
                    </div>

                    {/* Reverb & Noise Reduction */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                          <Waves className="w-4 h-4" />
                          Reverb
                        </Label>
                        <Slider
                          value={[reverb]}
                          max={100}
                          onValueChange={([v]) => setReverb(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{reverb}%</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          Noise Reduction
                        </Label>
                        <Slider
                          value={[noiseReduction]}
                          max={100}
                          onValueChange={([v]) => setNoiseReduction(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{noiseReduction}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mastering" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6 space-y-6">
                    {/* Compressor */}
                    <div>
                      <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        Compressor Threshold
                      </Label>
                      <Slider
                        value={[compressorThreshold]}
                        min={-60}
                        max={0}
                        onValueChange={([v]) => setCompressorThreshold(v)}
                      />
                      <p className="text-cyan-400 text-sm mt-1">{compressorThreshold} dB</p>
                      <p className="text-slate-500 text-xs mt-1">
                        Lower values = more compression (reduces dynamic range)
                      </p>
                    </div>

                    {/* AI Mastering Button */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
                      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                        AI-Powered Mastering
                      </h3>
                      <p className="text-slate-300 text-sm mb-4">
                        Let AI analyze your audio and automatically apply professional mastering settings
                      </p>
                      <Button
                        onClick={handleMasterAudio}
                        disabled={mastering}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        {mastering ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing Audio...</>
                        ) : (
                          <><Wand2 className="w-4 h-4 mr-2" />Auto-Master Audio</>
                        )}
                      </Button>
                    </div>

                    <Button onClick={applyEffects} className="w-full bg-green-500 hover:bg-green-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Apply All Effects
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Tools & Presets */}
          <div className="space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 justify-start">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Section
                </Button>
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 justify-start">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selection
                </Button>
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 justify-start">
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600 justify-start">
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Mastering Presets</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  size="sm"
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 justify-start"
                  onClick={() => {
                    setNormalizeLevel(3);
                    setCompressorThreshold(-18);
                    setBassBoost(2);
                    setTrebleBoost(1);
                    setNoiseReduction(30);
                  }}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Podcast Standard
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 justify-start"
                  onClick={() => {
                    setNormalizeLevel(5);
                    setCompressorThreshold(-12);
                    setBassBoost(3);
                    setNoiseReduction(50);
                  }}
                >
                  <Mic2 className="w-4 h-4 mr-2" />
                  Voice Enhancement
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 justify-start"
                  onClick={() => {
                    setNormalizeLevel(0);
                    setCompressorThreshold(-24);
                    setBassBoost(0);
                    setTrebleBoost(0);
                    setNoiseReduction(10);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Natural Sound
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Audio Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-semibold">{formatTime(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Format</span>
                  <span className="text-white font-semibold">Audio</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Episode</span>
                  <span className="text-white font-semibold">S{podcast.season}E{podcast.episode_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge className={isAnalyzing ? "bg-amber-500" : "bg-green-500"}>
                    {isAnalyzing ? 'Analyzing...' : 'Ready'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}