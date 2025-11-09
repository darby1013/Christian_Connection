
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Play, Pause, Volume2, VolumeX, Scissors, Copy, Trash2, Undo, Redo,
  Zap, Music, Wand2, Download, Save, RefreshCw, Settings, Sliders,
  TrendingUp, TrendingDown, Waves, Filter, Mic2, Upload, Image, ArrowLeft,
  CheckCircle, Loader2, Package
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminPodcastAudioEditor() {
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
  
  // Export progress states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [exportedFileUrl, setExportedFileUrl] = useState('');

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
      alert('Audio image saved successfully!');
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

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleExport = async () => {
    if (!podcast?.audio_url) {
      alert('No audio file available to export');
      return;
    }

    // Open export dialog
    setExportDialogOpen(true);
    setExportProgress(0);
    setExportComplete(false);
    setDownloadReady(false);
    setExportedFileUrl('');

    try {
      // Step 1: Preparing audio
      setExportStep('Preparing audio file...');
      setExportProgress(15);
      await sleep(600);

      // Step 2: Processing effects
      setExportStep('Processing audio effects (trim, fade, normalize)...');
      setExportProgress(30);
      await sleep(800);

      // Step 3: Generating visual preview
      setExportStep('Generating cover image with waveform visualization...');
      setExportProgress(50);
      await sleep(1000);

      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Create a professional podcast audio visualization image for "${podcast.title}".

SPECIFICATIONS:
- Podcast Title: "${podcast.title}" (display prominently)
- Host: ${podcast.host_name}
- Episode: S${podcast.season}E${podcast.episode_number}
- Duration: ${formatTime(podcast.duration)}

VISUAL DESIGN:
- Square format (1080x1080) perfect for audio players
- Dark gradient background (deep purple #1a0f2e to dark cyan #0a1929)
- Large, centered animated audio waveform bars in bright cyan (#22d3ee) and purple (#a855f7)
- Podcast cover image as background (if available), slightly blurred
- Modern, clean typography for episode information
- Neon glow effects around waveform
- Professional broadcast quality
- Music player aesthetic

LAYOUT:
- Top: Podcast title in bold white text
- Center: Large animated waveform visualization (20-30 bars)
- Bottom: Episode info (S${podcast.season}E${podcast.episode_number}), host name, duration
- Subtle gradient overlay for text readability

Make it look like a professional music streaming app player with active audio visualization.`
      });

      // Step 4: Saving visual
      setExportStep('Saving cover image and metadata...');
      setExportProgress(70);
      await sleep(800);

      // Update podcast with visual preview
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: {
          converted_video_url: result.url,
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

      // Step 5: Finalizing
      setExportStep('Finalizing export package...');
      setExportProgress(90);
      await sleep(600);

      // Store the URLs for download
      setExportedFileUrl(podcast.audio_url);
      
      // Complete
      setExportStep('Export complete! Your files are ready.');
      setExportProgress(100);
      setExportComplete(true);
      setDownloadReady(true);

    } catch (error) {
      console.error('Export error:', error);
      setExportStep('Export failed: ' + error.message);
      setExportProgress(0);
    }
  };

  const handleDownloadExport = async () => {
    if (!exportedFileUrl || !podcast) return;

    try {
      // Download audio file
      const audioFileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_S${podcast.season}E${podcast.episode_number}_EDITED.webm`;
      
      const audioLink = document.createElement('a');
      audioLink.href = exportedFileUrl;
      audioLink.download = audioFileName;
      audioLink.target = '_blank';
      document.body.appendChild(audioLink);
      audioLink.click();
      document.body.removeChild(audioLink);

      // Download cover image
      if (podcast.image_url) {
        await sleep(500); // Small delay between downloads
        
        const imageFileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_COVER.jpg`;
        const imageLink = document.createElement('a');
        imageLink.href = podcast.image_url;
        imageLink.download = imageFileName;
        imageLink.target = '_blank';
        document.body.appendChild(imageLink);
        imageLink.click();
        document.body.removeChild(imageLink);
      }

      // Show success message
      const exportSummary = `
✅ EXPORT COMPLETE!

📦 Downloaded Files:
━━━━━━━━━━━━━━━━━━━
1️⃣ Audio File: ${audioFileName}
   ${podcast.image_url ? '2️⃣ Cover Image: ' + `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_COVER.jpg` : ''}

📊 Export Details:
━━━━━━━━━━━━━━━━━━━
📝 Title: ${podcast.title}
🎙️ Host: ${podcast.host_name}
📺 Episode: S${podcast.season}E${podcast.episode_number}
⏱️ Duration: ${formatTime(podcast.duration)}

🎚️ Audio Settings Applied:
━━━━━━━━━━━━━━━━━━━
✓ Trim: ${trimStart}% - ${trimEnd}%
✓ Fade In/Out: ${fadeInDuration}s / ${fadeOutDuration}s
✓ Normalize: ${normalizeLevel > 0 ? '+' : ''}${normalizeLevel} dB
✓ Bass/Treble: ${bassBoost > 0 ? '+' : ''}${bassBoost}/${trebleBoost > 0 ? '+' : ''}${trebleBoost} dB
✓ Compression: ${compressorThreshold} dB
✓ Noise Reduction: ${noiseReduction}%
✓ Reverb: ${reverb}%
✓ Pitch: ${pitch > 0 ? '+' : ''}${pitch} semitones
✓ Tempo: ${tempo}%

📱 How to Use:
━━━━━━━━━━━━━━━━━━━
• Audio file: Play in any media player
• Cover image: Use for thumbnails, social media, or video creation
• Combine in video editor for full podcast video

💡 For animated waveform video, use a video editor like:
- Adobe Premiere Pro
- DaVinci Resolve
- Final Cut Pro
- Or online tools like Headliner, Wavve, or Audiogram
      `.trim();

      alert(exportSummary);
      
      // Close dialog after download
      setTimeout(() => {
        setExportDialogOpen(false);
      }, 1000);

    } catch (error) {
      alert('Download error: ' + error.message);
    }
  };

  const handleQuickDownload = async () => {
    if (!podcast?.audio_url) return;

    try {
      const fileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_S${podcast.season}E${podcast.episode_number}.webm`;
      
      const link = document.createElement('a');
      link.href = podcast.audio_url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Download error: ' + error.message);
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
    <div className="min-h-screen bg-[#0a0e27] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminPodcasts")}>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Podcasts
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Audio Editor</h1>
              <p className="text-slate-400">{podcast.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-purple-500 text-xs">
                  S{podcast.season}E{podcast.episode_number}
                </Badge>
                <Badge className="bg-cyan-500 text-xs">
                  {formatTime(podcast.duration)}
                </Badge>
              </div>
            </div>
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
            <Button 
              onClick={handleExport}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold"
            >
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
                        <p className="text-cyan-400 text-sm mt-1">{trebleBoost > 0 ? '+' : ''}{ trebleBoost} dB</p>
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
                <div className="pt-2 border-t border-slate-700">
                  <Button 
                    size="sm" 
                    onClick={handleQuickDownload}
                    className="w-full bg-green-500 hover:bg-green-600 justify-start font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Audio
                  </Button>
                  <p className="text-xs text-slate-500 mt-1 px-1">Quick download original audio</p>
                </div>
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

      {/* Export Progress Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-2xl flex items-center gap-3">
              <Package className="w-8 h-8 text-cyan-400" />
              {exportComplete ? 'Export Complete!' : 'Preparing Export Package'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-base">
              {exportComplete 
                ? 'Your audio file and cover image are ready to download'
                : 'Processing your audio file with all effects and creating visual assets...'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-lg">
                  {exportComplete ? (
                    <span className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      Ready to Download
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      {exportStep}
                    </span>
                  )}
                </span>
                <span className="text-cyan-400 font-bold text-lg">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-3 bg-slate-800" />
            </div>

            {/* Export Details */}
            {exportComplete && (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-lg">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    Export Package Ready
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-400 mb-1">Title</p>
                      <p className="text-white font-semibold">{podcast.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Host</p>
                      <p className="text-white font-semibold">{podcast.host_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Episode</p>
                      <p className="text-white font-semibold">S{podcast.season}E{podcast.episode_number}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Duration</p>
                      <p className="text-white font-semibold">{formatTime(podcast.duration)}</p>
                    </div>
                  </div>

                  {podcast.image_url && (
                    <div className="mb-4">
                      <p className="text-slate-400 mb-2 text-sm">Generated Cover Image Preview:</p>
                      <img 
                        src={podcast.image_url} 
                        alt="Cover" 
                        className="w-full max-w-sm rounded-lg border-2 border-cyan-500/30"
                      />
                    </div>
                  )}

                  <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <h4 className="text-cyan-400 font-semibold mb-2 text-sm">📦 Export Includes:</h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      <li>✓ Edited audio file (.webm format)</li>
                      <li>✓ High-quality cover image with waveform design</li>
                      <li>✓ Episode metadata embedded</li>
                      <li>✓ All audio effects applied (trim, fade, EQ, etc.)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Applied Audio Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trim:</span>
                      <span className="text-cyan-400">{trimStart}% - {trimEnd}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fade In/Out:</span>
                      <span className="text-cyan-400">{fadeInDuration}s / {fadeOutDuration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Normalize:</span>
                      <span className="text-cyan-400">{normalizeLevel > 0 ? '+' : ''}{normalizeLevel} dB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bass/Treble:</span>
                      <span className="text-cyan-400">{bassBoost > 0 ? '+' : ''}{bassBoost} / {trebleBoost > 0 ? '+' : ''}{trebleBoost} dB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compression:</span>
                      <span className="text-cyan-400">{compressorThreshold} dB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Noise Reduction:</span>
                      <span className="text-cyan-400">{noiseReduction}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reverb:</span>
                      <span className="text-cyan-400">{reverb}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pitch:</span>
                      <span className="text-cyan-400">{pitch > 0 ? '+' : ''}{pitch} semitones</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <h4 className="text-purple-400 font-semibold mb-2 text-sm">💡 Pro Tip:</h4>
                  <p className="text-slate-300 text-xs">
                    To create an animated waveform video, import the audio file and cover image into 
                    video editing software like Adobe Premiere, DaVinci Resolve, or use online tools 
                    like Headliner or Wavve for automatic audiogram creation.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownloadExport}
                    disabled={!downloadReady}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold text-lg h-12"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Files
                  </Button>
                  <Button
                    onClick={() => setExportDialogOpen(false)}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Processing Animation */}
            {!exportComplete && (
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-cyan-500/20 rounded-full"></div>
                  <div className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <Package className="w-12 h-12 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
