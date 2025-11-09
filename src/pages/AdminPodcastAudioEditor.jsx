import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play, Pause, Volume2, VolumeX, Download, ArrowLeft, Info,
  Settings, AlertTriangle, ExternalLink, Music, CheckCircle, Copy
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPodcastAudioEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const podcastId = urlParams.get('id');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [audioImage, setAudioImage] = useState('');
  const [copiedSettings, setCopiedSettings] = useState(false);
  
  // Real-time waveform
  const [audioData, setAudioData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio editing controls (FOR REFERENCE ONLY)
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
      
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: { image_url: file_url }
      });
      
      alert('✅ Cover image updated!');
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
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

  const handleQuickDownload = async () => {
    if (!podcast?.audio_url) return;

    try {
      const fileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_S${podcast.season}E${podcast.episode_number}_ORIGINAL.webm`;
      
      const link = document.createElement('a');
      link.href = podcast.audio_url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Download error: ' + error.message);
    }
  };

  const copySettingsToClipboard = () => {
    const settings = `
AUDIO EDITING SETTINGS FOR: ${podcast.title}
Episode: S${podcast.season}E${podcast.episode_number}
Host: ${podcast.host_name}
Duration: ${formatTime(podcast.duration)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPLY THESE SETTINGS IN YOUR AUDIO EDITOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✂️ TRIM:
   Start: ${trimStart}%
   End: ${trimEnd}%
   (Cut from ${trimStart}% to ${trimEnd}% of total length)

🔊 FADE:
   Fade In: ${fadeInDuration} seconds
   Fade Out: ${fadeOutDuration} seconds

📊 NORMALIZE:
   Level: ${normalizeLevel > 0 ? '+' : ''}${normalizeLevel} dB

🎚️ EQ (EQUALIZATION):
   Bass Boost: ${bassBoost > 0 ? '+' : ''}${bassBoost} dB at 100Hz
   Treble Boost: ${trebleBoost > 0 ? '+' : ''}${trebleBoost} dB at 10kHz

🗜️ COMPRESSION:
   Threshold: ${compressorThreshold} dB
   Ratio: 4:1
   Attack: 5ms
   Release: 50ms

🔇 NOISE REDUCTION:
   Amount: ${noiseReduction}%
   (Use noise profile from first 1-2 seconds)

🎵 EFFECTS:
   Reverb: ${reverb}%
   Pitch Shift: ${pitch > 0 ? '+' : ''}${pitch} semitones
   Tempo: ${tempo}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED SOFTWARE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FREE:
• Audacity (Windows/Mac/Linux)
• Ocenaudio (Windows/Mac)
• WavePad (Windows/Mac)

PAID:
• Adobe Audition
• Reaper
• Logic Pro (Mac)
• Pro Tools
    `.trim();

    navigator.clipboard.writeText(settings);
    setCopiedSettings(true);
    setTimeout(() => setCopiedSettings(false), 3000);
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
              <h1 className="text-3xl font-black text-white mb-2">Audio Preview & Settings</h1>
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
        </div>

        {/* IMPORTANT NOTICE */}
        <Alert className="mb-6 bg-amber-900/20 border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <AlertDescription className="text-amber-200">
            <strong>Browser Limitation:</strong> This editor cannot export edited audio files. 
            You can preview effects in real-time and copy your settings to use in professional audio software like Audacity (free) or Adobe Audition.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                {/* Real-time Waveform Display */}
                <div className="relative h-40 bg-slate-900 rounded-lg mb-6 flex items-end justify-around px-2 overflow-hidden">
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music className="w-8 h-8 text-cyan-400 animate-pulse" />
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
                    <Music className="w-full h-24 text-cyan-500/20 absolute top-1/2 -translate-y-1/2" />
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
                  <Music className="w-5 h-5 text-purple-400" />
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
                      <Badge className="bg-amber-500">Uploading...</Badge>
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
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Saved
                        </Badge>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-900 to-cyan-900 rounded-lg flex items-center justify-center">
                        <Music className="w-16 h-16 text-white opacity-30" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings Reference (Preview Only) */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-500">
                  <Settings className="w-4 h-4 mr-2" />
                  Basic Settings
                </TabsTrigger>
                <TabsTrigger value="effects" className="data-[state=active]:bg-cyan-500">
                  <Music className="w-4 h-4 mr-2" />
                  Effects
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-4">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      <p className="text-blue-300 text-sm">Preview settings - use "Copy Settings" to apply in audio software</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Trim Tool */}
                    <div>
                      <Label className="text-white font-bold mb-3 block">Trim Audio</Label>
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
                        <Label className="text-white font-bold mb-3 block">Fade In (seconds)</Label>
                        <Slider
                          value={[fadeInDuration]}
                          max={10}
                          step={0.5}
                          onValueChange={([v]) => setFadeInDuration(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{fadeInDuration}s</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block">Fade Out (seconds)</Label>
                        <Slider
                          value={[fadeOutDuration]}
                          max={10}
                          step={0.5}
                          onValueChange={([v]) => setFadeOutDuration(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{fadeOutDuration}s</p>
                      </div>
                    </div>

                    {/* Normalize */}
                    <div>
                      <Label className="text-white font-bold mb-3 block">Normalize Volume (dB)</Label>
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
                    {/* EQ */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-3 block">Bass Boost (dB)</Label>
                        <Slider
                          value={[bassBoost]}
                          min={-10}
                          max={10}
                          onValueChange={([v]) => setBassBoost(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{bassBoost > 0 ? '+' : ''}{bassBoost} dB</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block">Treble Boost (dB)</Label>
                        <Slider
                          value={[trebleBoost]}
                          min={-10}
                          max={10}
                          onValueChange={([v]) => setTrebleBoost(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{trebleBoost > 0 ? '+' : ''}{trebleBoost} dB</p>
                      </div>
                    </div>

                    {/* Compression & Noise */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-3 block">Compressor Threshold (dB)</Label>
                        <Slider
                          value={[compressorThreshold]}
                          min={-60}
                          max={0}
                          onValueChange={([v]) => setCompressorThreshold(v)}
                        />
                        <p className="text-cyan-400 text-sm mt-1">{compressorThreshold} dB</p>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-3 block">Noise Reduction (%)</Label>
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
            </Tabs>
          </div>

          {/* Sidebar - Actions & Guide */}
          <div className="space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={copySettingsToClipboard}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 justify-start font-semibold"
                >
                  {copiedSettings ? (
                    <><CheckCircle className="w-4 h-4 mr-2" />Copied to Clipboard!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" />Copy All Settings</>
                  )}
                </Button>
                
                <Button 
                  onClick={handleQuickDownload}
                  className="w-full bg-green-500 hover:bg-green-600 justify-start font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original Audio
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  How to Actually Edit Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2 text-sm">Step 1: Copy Settings</h4>
                  <p className="text-slate-300 text-xs">Click "Copy All Settings" above to get your editing instructions</p>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-2 text-sm">Step 2: Download Audio</h4>
                  <p className="text-slate-300 text-xs">Download the original audio file</p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 text-sm">Step 3: Use Audio Software</h4>
                  <div className="space-y-2 text-xs">
                    <a 
                      href="https://www.audacityteam.org/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Audacity (FREE)
                    </a>
                    <a 
                      href="https://www.ocenaudio.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ocenaudio (FREE)
                    </a>
                    <a 
                      href="https://www.adobe.com/products/audition.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Adobe Audition (Paid)
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-200 text-xs">
                    <strong>Why?</strong> Browsers can't export edited audio files. Professional audio software is required for actual file processing.
                  </p>
                </div>
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
                  <span className="text-white font-semibold">WebM Audio</span>
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