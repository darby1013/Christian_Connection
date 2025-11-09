
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play, Pause, Volume2, VolumeX, Download, ArrowLeft, Info,
  Settings, AlertTriangle, ExternalLink, Music, CheckCircle, Copy,
  Wand2, RefreshCw, FileText, Edit, Save, Film
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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
  const [showConversionGuide, setShowConversionGuide] = useState(false);

  // Transcript state
  const [generatingTranscript, setGeneratingTranscript] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [transcriptEdited, setTranscriptEdited] = useState(false);
  const [savingTranscript, setSavingTranscript] = useState(false);

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

  // Trailer generation state
  const [generatingTrailer, setGeneratingTrailer] = useState(false);
  const [generatedTrailer, setGeneratedTrailer] = useState(null);
  const [showTrailerDialog, setShowTrailerDialog] = useState(false);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: podcast, isLoading, error } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: async () => {
      if (!podcastId) return null;
      const results = await base44.entities.Podcast.filter({ id: podcastId });
      return results[0] || null;
    },
    enabled: !!podcastId,
  });

  const { data: existingTranscript } = useQuery({
    queryKey: ['podcastTranscript', podcastId],
    queryFn: async () => {
      if (!podcastId) return null;
      const results = await base44.entities.PodcastTranscript.filter({ podcast_id: podcastId });
      return results[0] || null;
    },
    enabled: !!podcastId,
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
    },
  });

  const createTranscriptMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastTranscript.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastTranscript', podcastId] });
    },
  });

  const updateTranscriptMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PodcastTranscript.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastTranscript', podcastId] });
    },
  });

  useEffect(() => {
    if (podcast) {
      setAudioImage(podcast.image_url || '');
    }
  }, [podcast]);

  useEffect(() => {
    if (existingTranscript) {
      setTranscript(existingTranscript.transcript_text || '');
    }
  }, [existingTranscript]);

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

  const generateShowNotes = async () => {
    if (!podcast) return;

    setGeneratingTranscript(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive show notes for this podcast:

Title: ${podcast.title}
Description: ${podcast.description}
Host: ${podcast.host_name}
Duration: ${Math.floor((podcast.duration || 0) / 60)} minutes
${existingTranscript?.transcript_text ? `\n\nTranscript:\n${existingTranscript.transcript_text.slice(0, 3000)}...` : ''}

Create:
1. Executive Summary (2-3 engaging sentences)
2. 5-7 Key Topics Discussed (as bullet points)
3. Main Takeaways (3-5 actionable insights)
4. Timestamps for major topics
5. Guest information (if applicable)
6. Resources mentioned
7. SEO-optimized description (150-200 words)

Make it professional and comprehensive!`,
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string" }, // LLM might return a cleaned transcript as well
            summary: { type: "string" },
            key_topics: { type: "array", items: { type: "string" } },
            show_notes: { type: "string" },
            takeaways: { type: "array", items: { type: "string" } },
            timestamps: { type: "array", items: { type: "string" } },
            seo_description: { type: "string" }
          }
        }
      });

      setTranscript(result.transcript || result.show_notes || '');

      if (existingTranscript) {
        await updateTranscriptMutation.mutateAsync({
          id: existingTranscript.id,
          data: {
            transcript_text: result.transcript || result.show_notes,
            summary: result.summary,
            key_topics: result.key_topics,
            show_notes: result.show_notes,
            is_ai_generated: true,
            is_verified: false,
            // New fields
            takeaways: result.takeaways,
            timestamps: result.timestamps,
            seo_description: result.seo_description,
          }
        });
      } else {
        await createTranscriptMutation.mutateAsync({
          podcast_id: podcast.id,
          podcast_title: podcast.title,
          transcript_text: result.transcript || result.show_notes,
          summary: result.summary,
          key_topics: result.key_topics,
          show_notes: result.show_notes,
          is_ai_generated: true,
          is_verified: false,
          language: 'en',
          searchable: true,
          // New fields
          takeaways: result.takeaways,
          timestamps: result.timestamps,
          seo_description: result.seo_description,
        });
      }

      alert('✅ Show notes and key topics generated!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingTranscript(false);
    }
  };

  const generatePromotionalTrailer = async () => {
    if (!podcast) return;

    setGeneratingTrailer(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a compelling promotional trailer script for this podcast episode:

Title: ${podcast.title}
Description: ${podcast.description}
Host: ${podcast.host_name}
Duration: ${Math.floor((podcast.duration || 0) / 60)} minutes

Create a 30-60 second promotional trailer that includes:
1. Attention-grabbing hook (first 5 seconds)
2. Teaser of most interesting moment
3. 2-3 key points covered
4. Emotional appeal or curiosity gap
5. Strong call-to-action

Also generate:
- Social media promo text (140 chars)
- YouTube video description
- Email subject line
- 5 promotional hashtags`,
        response_json_schema: {
          type: "object",
          properties: {
            trailer_script: { type: "string" },
            duration_seconds: { type: "number" },
            social_promo: { type: "string" },
            youtube_description: { type: "string" },
            email_subject: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            visual_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedTrailer(result);
      setShowTrailerDialog(true);
      alert('✅ Promotional trailer generated!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingTrailer(false);
    }
  };

  const saveTranscript = async () => {
    if (!transcript.trim()) {
      alert('Transcript is empty');
      return;
    }

    setSavingTranscript(true);
    try {
      if (existingTranscript) {
        await updateTranscriptMutation.mutateAsync({
          id: existingTranscript.id,
          data: {
            transcript_text: transcript,
            is_verified: true,
            // Keep existing summary, key_topics, show_notes if not explicitly edited here
            summary: existingTranscript.summary,
            key_topics: existingTranscript.key_topics,
            show_notes: existingTranscript.show_notes,
            is_ai_generated: existingTranscript.is_ai_generated, // Preserve original AI generation status
            takeaways: existingTranscript.takeaways,
            timestamps: existingTranscript.timestamps,
            seo_description: existingTranscript.seo_description,
          }
        });
      } else {
        await createTranscriptMutation.mutateAsync({
          podcast_id: podcast.id,
          podcast_title: podcast.title,
          transcript_text: transcript,
          is_ai_generated: false, // User manually edited/created
          is_verified: true,
          language: 'en',
          searchable: true
        });
      }

      setTranscriptEdited(false);
      setEditingTranscript(false);
      alert('✅ Transcript saved!');
    } catch (error) {
      alert('Error saving transcript: ' + error.message);
    } finally {
      setSavingTranscript(false);
    }
  };

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

  const handleDownloadAudioWithArt = async () => {
    if (!podcast?.audio_url) return;

    try {
      const isAudioOnly = podcast.content_type === 'audio' && !podcast.video_url;

      // Download the audio file
      const fileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_S${podcast.season}E${podcast.episode_number}${isAudioOnly ? '_AUDIO' : ''}.webm`;

      const link = document.createElement('a');
      link.href = podcast.audio_url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also download the cover art separately
      if (podcast.image_url) {
        setTimeout(() => {
          const imgLink = document.createElement('a');
          imgLink.href = podcast.image_url;
          imgLink.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_Cover.jpg`;
          imgLink.target = '_blank';
          document.body.appendChild(imgLink);
          imgLink.click();
          document.body.removeChild(imgLink);

          setShowConversionGuide(true);
        }, 1000); // Small delay to prevent blocking the first download
      } else {
        setShowConversionGuide(true);
      }
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

  // Handle errors and loading
  if (!podcastId) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-6">
        <Card className="bg-[#1a1f3a] border-red-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">No Podcast Selected</h2>
            <p className="text-slate-400 mb-6">Please select a podcast from the list to edit.</p>
            <Link to={createPageUrl("AdminPodcasts")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Podcasts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading podcast...</p>
        </div>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-6">
        <Card className="bg-[#1a1f3a] border-red-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Podcast Not Found</h2>
            <p className="text-slate-400 mb-6">
              {error ? error.message : 'Could not load podcast with this ID.'}
            </p>
            <Link to={createPageUrl("AdminPodcasts")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Podcasts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
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
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={handleDownloadAudioWithArt}
                        disabled={!podcast?.audio_url}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Audio + Cover Art
                      </Button>
                      <p className="text-xs text-slate-400 text-center">
                        Downloads audio file and cover image separately
                      </p>
                    </div>
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

            {/* AI Show Notes & Transcript Generator */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    AI Show Notes & Transcript
                  </CardTitle>
                  <div className="flex gap-2">
                    {!existingTranscript?.transcript_text && (
                      <Button
                        size="sm"
                        onClick={generateShowNotes}
                        disabled={generatingTranscript}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {generatingTranscript ? (
                          <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Generating...</>
                        ) : (
                          <><Wand2 className="w-3 h-3 mr-1" />Generate All</>
                        )}
                      </Button>
                    )}
                    {existingTranscript && (
                      <Badge className={existingTranscript.is_verified ? "bg-green-500" : "bg-amber-500"}>
                        {existingTranscript.is_verified ? 'Verified' : 'AI Generated'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!existingTranscript?.transcript_text && !generatingTranscript ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">Generate Show Notes</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      AI will create comprehensive show notes, transcript, and key topics
                    </p>
                    <Button
                      onClick={generateShowNotes}
                      disabled={generatingTranscript}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate All with AI
                    </Button>
                  </div>
                ) : generatingTranscript ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-white font-bold mb-2">Generating...</h3>
                    <p className="text-slate-400 text-sm">
                      Creating transcript, show notes, and key topics
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Key Topics & Summary */}
                    {existingTranscript && (
                      <div className="space-y-3">
                        {existingTranscript.summary && (
                          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                            <Label className="text-green-300 text-xs mb-1 block font-bold">SUMMARY</Label>
                            <p className="text-green-100 text-sm">{existingTranscript.summary}</p>
                          </div>
                        )}
                        
                        {existingTranscript.key_topics && existingTranscript.key_topics.length > 0 && (
                          <div>
                            <Label className="text-white font-bold text-sm mb-2 block">Key Topics</Label>
                            <div className="flex flex-wrap gap-2">
                              {existingTranscript.key_topics.map((topic, idx) => (
                                <Badge key={idx} className="bg-purple-500">{topic}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {existingTranscript.show_notes && (
                          <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                            <Label className="text-cyan-300 text-xs mb-2 block font-bold">SHOW NOTES</Label>
                            <pre className="text-cyan-100 text-sm whitespace-pre-wrap">
                              {existingTranscript.show_notes}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transcript Editor */}
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-bold">Full Transcript</Label>
                      <div className="flex gap-2">
                        {!editingTranscript ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setEditingTranscript(true)}
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(transcript);
                                alert('Transcript copied!');
                              }}
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              onClick={generateShowNotes}
                              disabled={generatingTranscript}
                              variant="outline"
                              className="border-slate-700"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Regenerate All
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={saveTranscript}
                              disabled={savingTranscript || !transcriptEdited}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {savingTranscript ? (
                                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Saving...</>
                              ) : (
                                <><Save className="w-3 h-3 mr-1" />Save</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingTranscript(false);
                                setTranscript(existingTranscript?.transcript_text || transcript);
                                setTranscriptEdited(false);
                              }}
                              variant="outline"
                              className="border-slate-700"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingTranscript ? (
                      <Textarea
                        value={transcript}
                        onChange={(e) => {
                          setTranscript(e.target.value);
                          setTranscriptEdited(true);
                        }}
                        className="bg-slate-900 border-slate-700 text-white h-96 font-mono text-sm"
                        placeholder="Edit transcript here..."
                      />
                    ) : (
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-96 overflow-y-auto">
                        <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                          {transcript}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
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
                <CardTitle className="text-white font-bold text-base">AI Marketing Tools</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={generateShowNotes}
                  disabled={generatingTranscript}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 justify-start font-semibold"
                >
                  {generatingTranscript ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Generate Show Notes</>
                  )}
                </Button>

                <Button
                  onClick={generatePromotionalTrailer}
                  disabled={generatingTrailer}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 justify-start font-semibold"
                >
                  {generatingTrailer ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                  ) : (
                    <><Film className="w-4 h-4 mr-2" />Create Promo Trailer</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={handleDownloadAudioWithArt}
                  disabled={!podcast?.audio_url}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 justify-start font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download + Show Guide
                </Button>

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
                  className="w-full bg-cyan-500 hover:bg-cyan-600 justify-start font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Audio Only
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
                  <h4 className="text-white font-semibold mb-2 text-sm">Step 2: Download Audio & Art</h4>
                  <p className="text-slate-300 text-xs">Download the original audio file and its cover image</p>
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

        {/* Promotional Trailer Dialog */}
        <Dialog open={showTrailerDialog} onOpenChange={setShowTrailerDialog}>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
                <Film className="w-6 h-6 text-orange-400" />
                Promotional Trailer Package
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {podcast?.title}
              </DialogDescription>
            </DialogHeader>
            {generatedTrailer && (
              <div className="space-y-4 py-4">
                {/* Trailer Script */}
                <Card className="bg-slate-900/30 border-orange-500/30">
                  <CardHeader className="py-3 px-4 border-b border-slate-700">
                    <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      Trailer Script ({generatedTrailer.duration_seconds}s)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={generatedTrailer.trailer_script}
                      readOnly
                      className="bg-slate-900 border-slate-700 text-white h-64 mb-3 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedTrailer.trailer_script);
                        alert('Trailer script copied!');
                      }}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Script
                    </Button>
                  </CardContent>
                </Card>

                {/* Visual Suggestions */}
                {generatedTrailer.visual_suggestions && (
                  <Card className="bg-slate-900/30 border-purple-500/30">
                    <CardHeader className="py-3 px-4 border-b border-slate-700">
                      <CardTitle className="text-white font-bold text-sm">Visual Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ul className="space-y-2">
                        {generatedTrailer.visual_suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-purple-200 text-sm flex items-start gap-2">
                            <Film className="w-3 h-3 mt-1 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Promotional Copy */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-slate-900/30 border-blue-500/30">
                    <CardHeader className="py-3 px-4 border-b border-slate-700">
                      <CardTitle className="text-white font-bold text-sm">Social Media Promo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-blue-200 text-sm mb-3">{generatedTrailer.social_promo}</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTrailer.social_promo);
                          alert('Copied!');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 w-full"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/30 border-red-500/30">
                    <CardHeader className="py-3 px-4 border-b border-slate-700">
                      <CardTitle className="text-white font-bold text-sm">Email Subject</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-red-200 text-sm mb-3">{generatedTrailer.email_subject}</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTrailer.email_subject);
                          alert('Copied!');
                        }}
                        className="bg-red-500 hover:bg-red-600 w-full"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* YouTube Description */}
                <Card className="bg-slate-900/30 border-red-600/30">
                  <CardHeader className="py-3 px-4 border-b border-slate-700">
                    <CardTitle className="text-white font-bold text-sm">YouTube Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={generatedTrailer.youtube_description}
                      readOnly
                      className="bg-slate-900 border-slate-700 text-white h-32 mb-3 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedTrailer.youtube_description);
                        alert('Copied!');
                      }}
                      className="bg-red-600 hover:bg-red-700 w-full"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Description
                    </Button>
                  </CardContent>
                </Card>

                {/* Hashtags */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Promotional Hashtags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedTrailer.hashtags?.map((tag, idx) => (
                      <Badge key={idx} className="bg-cyan-500 cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText(`#${tag}`);
                      }}>
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowTrailerDialog(false)} className="bg-cyan-500 hover:bg-cyan-600">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* WebM to MP3 Conversion Guide Dialog */}
        <Dialog open={showConversionGuide} onOpenChange={setShowConversionGuide}>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">
                📥 Files Downloaded! Next Steps:
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="bg-green-900/20 border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <AlertDescription className="text-green-200">
                  <strong>Downloaded:</strong> Audio WebM file + Cover image JPG
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-300 font-bold mb-2">Option 1: Online Converter (Easiest)</h3>
                <div className="space-y-2 text-sm text-blue-100">
                  <p><strong>CloudConvert</strong> - Free, no signup:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-3">
                    <li>Visit <a href="https://cloudconvert.com/webm-to-mp3" target="_blank" className="text-cyan-400 underline">cloudconvert.com/webm-to-mp3</a></li>
                    <li>Upload your WebM file</li>
                    <li>Click "Convert to MP3"</li>
                    <li>Download the MP3</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <h3 className="text-purple-300 font-bold mb-2">Option 2: Audacity (Free App)</h3>
                <div className="space-y-2 text-sm text-purple-100">
                  <ol className="list-decimal list-inside space-y-1 ml-3">
                    <li>Download from <a href="https://www.audacityteam.org/" target="_blank" className="text-cyan-400 underline">audacityteam.org</a></li>
                    <li>File → Open → Your WebM file</li>
                    <li>File → Export → Export as MP3</li>
                    <li>Save</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <h3 className="text-amber-300 font-bold mb-2">Add Cover Art to MP3:</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-amber-100">
                  <div>
                    <p className="font-bold mb-1">iTunes/Music:</p>
                    <p className="text-xs">Right-click MP3 → Get Info → Artwork tab → Add your cover JPG</p>
                  </div>
                  <div>
                    <p className="font-bold mb-1">Windows Media Player:</p>
                    <p className="text-xs">Right-click MP3 → Properties → Pictures → Add cover JPG</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h3 className="text-green-300 font-bold mb-2">✨ Final Result:</h3>
                <div className="space-y-1 text-sm text-green-100">
                  <p>✅ MP3 audio file (universally compatible)</p>
                  <p>✅ Cover art displays when playing</p>
                  <p>✅ Works in ALL music players</p>
                  <p>✅ Ready for Spotify, Apple Podcasts, etc.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowConversionGuide(false)} className="bg-cyan-500 hover:bg-cyan-600 w-full">
                Got It!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
