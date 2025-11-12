
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client"; // Import base44 client
import {
  Scissors, Layers, Type, Palette, Zap, Download, Save,
  Play, Pause, SkipBack, SkipForward, Plus, Trash2, Eye,
  Sparkles, Split, Merge, Image, Film, RefreshCw, Copy,
  Wand2, Brain, FileText, TrendingUp, MessageSquare, CheckCircle // New Lucide icons
} from "lucide-react";

export default function AdvancedVideoEditor({ videoUrl, podcastId, script, onSave }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  
  // Editing controls
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [textOverlays, setTextOverlays] = useState([]);
  const [transitions, setTransitions] = useState([]);
  
  // Color correction
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [temperature, setTemperature] = useState(0);
  
  // Text overlay state
  const [overlayText, setOverlayText] = useState('');
  const [overlayPosition, setOverlayPosition] = useState('bottom');
  const [overlayFontSize, setOverlayFontSize] = useState(24);
  const [overlayColor, setOverlayColor] = useState('#ffffff');
  const [overlayStartTime, setOverlayStartTime] = useState(0);
  const [overlayDuration, setOverlayDuration] = useState(5);

  // AI Features
  const [generatingRoughCut, setGeneratingRoughCut] = useState(false);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);
  const [generatingTransitions, setGeneratingTransitions] = useState(false);
  const [subtitles, setSubtitles] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null); // This is not used in the current code, but kept as it was in the original

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      // When video is loaded, get its actual duration
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current.duration);
      };
      applyFilters();
    }
  }, [videoUrl]);

  useEffect(() => {
    applyFilters();
  }, [brightness, contrast, saturation, hue, temperature]);

  const applyFilters = () => {
    if (videoRef.current) {
      const filters = [
        `brightness(${brightness}%)`,
        `contrast(${contrast}%)`,
        `saturate(${saturation}%)`,
        `hue-rotate(${hue}deg)`,
      ];
      
      // Temperature effect (warm/cool)
      // This is a simplified approximation and might not perfectly mimic professional software temperature controls
      if (temperature > 0) { // Warmer
        filters.push(`sepia(${temperature * 0.5}%)`); // Sepia for warmness
        filters.push(`brightness(${100 + temperature * 0.1}%)`); // Slightly brighter
      } else if (temperature < 0) { // Cooler
        filters.push(`saturate(${100 + temperature * 0.5}%)`); // Less saturation for coolness
        filters.push(`hue-rotate(${hue + temperature * 0.5}deg)`); // Slight hue shift
      }

      videoRef.current.style.filter = filters.join(' ');
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
      setDuration(videoRef.current.duration || 0); // Ensure duration is set if not already
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const createSegment = () => {
    if (duration === 0) {
      alert("Video not loaded yet. Cannot create segments.");
      return;
    }
    const newSegment = {
      id: Date.now(),
      start: trimStart, // Percentage
      end: trimEnd,     // Percentage
      name: `Segment ${segments.length + 1}`,
      filters: { brightness, contrast, saturation, hue, temperature },
      aiGenerated: false
    };
    setSegments([...segments, newSegment]);
    alert('Segment created!');
  };

  const deleteSegment = (id) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const addTextOverlay = () => {
    if (!overlayText.trim()) {
      alert('Please enter overlay text');
      return;
    }

    const newOverlay = {
      id: Date.now(),
      text: overlayText,
      position: overlayPosition,
      fontSize: overlayFontSize,
      color: overlayColor,
      startTime: overlayStartTime,
      duration: overlayDuration,
      speaker: '' // Manual overlays don't have speaker by default
    };

    setTextOverlays([...textOverlays, newOverlay]);
    setOverlayText('');
    alert('Text overlay added!');
  };

  const removeOverlay = (id) => {
    setTextOverlays(textOverlays.filter(o => o.id !== id));
  };

  const addTransition = (type) => {
    if (segments.length < 2) {
      alert('Need at least 2 segments to add transitions');
      return;
    }

    const newTransition = {
      id: Date.now(),
      type, // 'fade', 'dissolve', 'wipe', 'slide'
      duration: 1, // Default duration
      position: segments.length - 1, // Default position between last two segments
      aiGenerated: false // Manually added transition
    };

    setTransitions([...transitions, newTransition]);
    alert(`${type} transition added!`);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportSettings = () => {
    const settings = {
      segments,
      textOverlays,
      transitions,
      colorCorrection: { brightness, contrast, saturation, hue, temperature },
      trimRange: { start: trimStart, end: trimEnd }
    };

    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    alert('Export settings copied to clipboard!\n\nUse these in professional video editing software.');
  };

  // AI Feature Implementations
  const generateRoughCut = async () => {
    if (duration === 0) {
      alert("Video not loaded yet. Cannot generate rough cut.");
      return;
    }
    setGeneratingRoughCut(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this video content and generate a rough cut plan:

${script && script.content ? `Script/Content: ${script.content}` : 'No script available. Analyze the implied narrative and key topics.'}

Video Duration: ${Math.floor(duration)} seconds (${formatTime(duration)})

Create an AI-powered rough cut strategy:

1. **KEY MOMENTS IDENTIFICATION** (8-12 segments):
   - Identify the most engaging/important moments
   - Timestamp each segment (in seconds)
   - Rate importance (1-10)
   - Suggest segment names

2. **PACING ANALYSIS**:
   - Identify slow/redundant sections to cut
   - Suggest where to speed up or slow down
   - Recommend total cut duration

3. **ENGAGEMENT PEAKS**:
   - Identify high-energy moments (based on keywords: excitement, revelation, call-to-action)
   - Mark emotional peaks (inspiration, conviction, worship)
   - Highlight quotable moments

4. **CUT RECOMMENDATIONS**:
   - Sections to remove (dead air, tangents, repetition)
   - Optimal segment order
   - Suggested final duration

Provide specific timestamps and actionable editing decisions.`,
        response_json_schema: {
          type: "object",
          properties: {
            key_moments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  start_time: { type: "number", description: "Start time in seconds" },
                  end_time: { type: "number", description: "End time in seconds" },
                  name: { type: "string" },
                  importance: { type: "number", minimum: 1, maximum: 10 },
                  reason: { type: "string" }
                },
                required: ["start_time", "end_time", "name", "importance", "reason"]
              }
            },
            sections_to_cut: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  start_time: { type: "number" },
                  end_time: { type: "number" },
                  reason: { type: "string" }
                },
                required: ["start_time", "end_time", "reason"]
              }
            },
            pacing_suggestions: { type: "string" },
            suggested_duration: { type: "number" },
            engagement_peaks: {
              type: "array",
              items: { type: "number", description: "Timestamp in seconds of an engagement peak" }
            }
          },
          required: ["key_moments", "pacing_suggestions", "suggested_duration"]
        }
      });

      // Auto-create segments from key moments
      const autoSegments = result.key_moments.map((moment, idx) => ({
        id: Date.now() + idx + Math.random(), // Add random to ensure unique IDs if called rapidly
        start: (moment.start_time / duration) * 100, // Convert to percentage
        end: (moment.end_time / duration) * 100,     // Convert to percentage
        name: moment.name,
        importance: moment.importance,
        filters: { brightness, contrast, saturation, hue, temperature }, // Apply current filters
        aiGenerated: true
      }));

      setSegments(currentSegments => [...currentSegments, ...autoSegments]);
      alert(`✅ AI Rough Cut Generated!\n\n${autoSegments.length} key segments identified\nSuggested final duration: ${formatTime(result.suggested_duration)}`);

    } catch (error) {
      console.error('Error generating rough cut:', error);
      alert('Error generating rough cut: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingRoughCut(false);
    }
  };

  const generateSubtitles = async () => {
    if (duration === 0) {
      alert("Video not loaded yet. Cannot generate subtitles.");
      return;
    }
    setGeneratingSubtitles(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate accurate, synchronized subtitles for this video podcast:

${script && script.content ? `Script/Transcript: ${script.content}` : 'Analyze the video content to transcribe speech and generate subtitles.'}

Video Duration: ${formatTime(duration)}

Create professional subtitles with:
1. Timestamps for each entry.
2. Short, readable text (ideally max 2 lines, ~50-70 chars per line).
3. Natural sentence breaks.
4. Speaker identification if multiple speakers are detected.
5. Audio cues like [Music], [Applause], [Laughter] for non-speech sounds.

Format each subtitle entry with:
- start_time (seconds)
- end_time (seconds)  
- text (subtitle text)
- speaker (optional, if applicable)

Generate subtitles covering a significant portion of the video.`,
        response_json_schema: {
          type: "object",
          properties: {
            subtitles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  start_time: { type: "number", description: "Start time in seconds" },
                  end_time: { type: "number", description: "End time in seconds" },
                  text: { type: "string" },
                  speaker: { type: "string", description: "Optional speaker identification" }
                },
                required: ["start_time", "end_time", "text"]
              }
            },
            language: { type: "string" },
            total_words: { type: "number" }
          },
          required: ["subtitles", "language"]
        }
      });

      setSubtitles(result.subtitles || []);
      
      // Convert to text overlays for preview, replacing existing ones
      const subtitleOverlays = result.subtitles.map((sub, idx) => ({
        id: `ai-sub-${Date.now() + idx + Math.random()}`,
        text: sub.text,
        position: 'bottom',
        fontSize: 20,
        color: '#ffffff',
        startTime: sub.start_time,
        duration: Math.max(0.5, sub.end_time - sub.start_time), // Ensure minimum duration
        speaker: sub.speaker || ''
      }));

      setTextOverlays(currentOverlays => {
        // Filter out existing AI-generated subtitles before adding new ones
        const manualOverlays = currentOverlays.filter(o => !o.id.startsWith('ai-sub-'));
        return [...manualOverlays, ...subtitleOverlays];
      });

      alert(`✅ AI Subtitles Generated!\n\n${result.subtitles.length} subtitle entries created`);

    } catch (error) {
      console.error('Error generating subtitles:', error);
      alert('Error generating subtitles: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingSubtitles(false);
    }
  };

  const generateOptimalTransitions = async () => {
    if (segments.length < 2) {
      alert('Need at least 2 segments to generate transitions');
      return;
    }
    if (duration === 0) {
      alert("Video not loaded yet. Cannot generate transitions.");
      return;
    }

    setGeneratingTransitions(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these video segments and suggest optimal transitions:

Segments:
${segments.map((seg, idx) => `${idx + 1}. ${seg.name} (from ${formatTime((seg.start / 100) * duration)} to ${formatTime((seg.end / 100) * duration)})`).join('\n')}

For each transition point between consecutive segments, recommend:
1. Best transition type (e.g., 'fade', 'dissolve', 'wipe', 'slide', 'cut').
2. Duration (0.5s - 2s).
3. A concise reason for the choice (e.g., 'smooth flow', 'dramatic emphasis', 'quick scene change').

Consider:
- Content mood and energy level
- Pacing and rhythm
- Professional broadcast standards
- Viewer engagement

Provide exactly ${segments.length - 1} transition recommendations, one for each point between segments.`,
        response_json_schema: {
          type: "object",
          properties: {
            transitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  position: { type: "number", description: "The index of the segment AFTER which this transition should occur (0-indexed). So transition at position 0 is between segment 0 and 1." },
                  type: { type: "string", enum: ["fade", "dissolve", "wipe", "slide", "cut"] },
                  duration: { type: "number", minimum: 0.5, maximum: 2 },
                  reason: { type: "string" }
                },
                required: ["position", "type", "duration", "reason"]
              }
            }
          },
          required: ["transitions"]
        }
      });

      const aiTransitions = result.transitions.map((trans, idx) => ({
        id: `ai-trans-${Date.now() + idx + Math.random()}`,
        type: trans.type,
        duration: trans.duration,
        position: trans.position, // This refers to the index of the segment before the transition
        reason: trans.reason,
        aiGenerated: true
      }));

      // Merge with existing manual transitions, removing old AI ones
      setTransitions(currentTransitions => {
        const manualTransitions = currentTransitions.filter(t => !t.aiGenerated);
        return [...manualTransitions, ...aiTransitions];
      });

      alert(`✅ AI Transition Suggestions Generated!\n\n${aiTransitions.length} optimal transitions recommended`);

    } catch (error) {
      console.error('Error generating transitions:', error);
      alert('Error generating transitions: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingTransitions(false);
    }
  };

  const downloadSubtitles = () => {
    if (subtitles.length === 0) {
      alert("No subtitles to download.");
      return;
    }
    const srtContent = subtitles.map((sub, idx) => {
      const startTime = formatSRT(sub.start_time);
      const endTime = formatSRT(sub.end_time);
      return `${idx + 1}\n${startTime} --> ${endTime}\n${sub.speaker ? `[${sub.speaker}] ` : ''}${sub.text}\n`;
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subtitles.srt';
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(url);
  };

  const formatSRT = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* AI Tools Section */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-black flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Video Assistant
            <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500">Powered by AI</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid md:grid-cols-3 gap-3">
            <Button
              onClick={generateRoughCut}
              disabled={generatingRoughCut || duration === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold h-auto py-4 flex-col"
            >
              {generatingRoughCut ? (
                <><RefreshCw className="w-5 h-5 mb-1 animate-spin" /><span className="text-xs">Analyzing...</span></>
              ) : (
                <><Scissors className="w-5 h-5 mb-1" /><span className="text-xs">AI Rough Cut</span></>
              )}
            </Button>

            <Button
              onClick={generateSubtitles}
              disabled={generatingSubtitles || duration === 0}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-bold h-auto py-4 flex-col"
            >
              {generatingSubtitles ? (
                <><RefreshCw className="w-5 h-5 mb-1 animate-spin" /><span className="text-xs">Generating...</span></>
              ) : (
                <><FileText className="w-5 h-5 mb-1" /><span className="text-xs">AI Subtitles</span></>
              )}
            </Button>

            <Button
              onClick={generateOptimalTransitions}
              disabled={generatingTransitions || segments.length < 2 || duration === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold h-auto py-4 flex-col"
            >
              {generatingTransitions ? (
                <><RefreshCw className="w-5 h-5 mb-1 animate-spin" /><span className="text-xs">Analyzing...</span></>
              ) : (
                <><Sparkles className="w-5 h-5 mb-1" /><span className="text-xs">AI Transitions</span></>
              )}
            </Button>
          </div>

          {subtitles.length > 0 && (
            <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-cyan-300 text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-cyan-400" />
                  {subtitles.length} subtitles generated
                </p>
                <Button size="sm" onClick={downloadSubtitles} className="bg-cyan-500 hover:bg-cyan-600">
                  <Download className="w-3 h-3 mr-1" />
                  Download SRT
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Player */}
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
            
            {/* Active text overlays preview */}
            {textOverlays.map(overlay => {
              const showOverlay = currentTime >= overlay.startTime && 
                                 currentTime < (overlay.startTime + overlay.duration);
              if (!showOverlay) return null;

              return (
                <div
                  key={overlay.id}
                  className={`absolute left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 backdrop-blur-sm rounded-lg ${
                    overlay.position === 'top' ? 'top-8' : 
                    overlay.position === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'
                  }`}
                  style={{
                    fontSize: `${overlay.fontSize}px`,
                    color: overlay.color,
                    fontWeight: 'bold'
                  }}
                >
                  {overlay.speaker && <span className="text-cyan-400 mr-2">[{overlay.speaker}]</span>}
                  {overlay.text}
                </div>
              );
            })}

            {/* AI-generated engagement peaks indicator */}
            {segments.length > 0 && segments.some(s => s.aiGenerated && s.importance >= 8) && (
              segments.map(seg => {
                const isInSegment = seg.aiGenerated && seg.importance >= 8 &&
                                   currentTime >= (seg.start / 100) * duration && 
                                   currentTime <= (seg.end / 100) * duration;
                if (!isInSegment) return null;

                return (
                  <Badge key={`engagement-${seg.id}`} className="absolute top-4 right-4 bg-amber-500 animate-pulse flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    High Engagement
                  </Badge>
                );
              })
            )}
          </div>

          {/* Timeline & Controls */}
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
              
              {/* Segment markers on timeline */}
              {segments.length > 0 && (
                <div className="relative h-3 bg-slate-800 rounded-full mt-2">
                  {segments.map(seg => (
                    <div
                      key={seg.id}
                      className={`absolute h-full rounded-full cursor-pointer ${
                        seg.aiGenerated ? 'bg-purple-500/70' : 'bg-cyan-500/50'
                      }`}
                      style={{
                        left: `${seg.start}%`,
                        width: `${seg.end - seg.start}%`
                      }}
                      title={`${seg.name} (${formatTime((seg.start / 100) * duration)} - ${formatTime((seg.end / 100) * duration)}) ${seg.aiGenerated ? '(AI)' : ''}`}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = (seg.start / 100) * duration;
                          setSelectedSegment(seg);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10))}
                className="bg-slate-700 hover:bg-slate-600"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                onClick={togglePlay}
                className="bg-cyan-500 hover:bg-cyan-600 w-14 h-14 rounded-full"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                size="sm"
                onClick={() => videoRef.current && (videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10))}
                className="bg-slate-700 hover:bg-slate-600"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editing Tools */}
      <Tabs defaultValue="trim" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700 grid grid-cols-5">
          <TabsTrigger value="trim" className="data-[state=active]:bg-cyan-500">
            <Scissors className="w-4 h-4 mr-1" />
            Trim
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-cyan-500">
            <Split className="w-4 h-4 mr-1" />
            Segments
            {segments.length > 0 && (
              <Badge className="ml-1 bg-purple-500 text-xs">{segments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:bg-cyan-500">
            <Type className="w-4 h-4 mr-1" />
            Text
            {textOverlays.length > 0 && (
              <Badge className="ml-1 bg-green-500 text-xs">{textOverlays.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="color" className="data-[state=active]:bg-cyan-500">
            <Palette className="w-4 h-4 mr-1" />
            Color
          </TabsTrigger>
          <TabsTrigger value="transitions" className="data-[state=active]:bg-cyan-500">
            <Sparkles className="w-4 h-4 mr-1" />
            Effects
            {transitions.length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-xs">{transitions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Trim Tab */}
        <TabsContent value="trim" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Trim Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Start Position: {formatTime((trimStart / 100) * duration)}</Label>
                <Slider
                  value={[trimStart]}
                  max={100}
                  step={0.1}
                  onValueChange={([v]) => setTrimStart(Math.min(v, trimEnd - 0.1))} // Ensure start is always less than end
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">End Position: {formatTime((trimEnd / 100) * duration)}</Label>
                <Slider
                  value={[trimEnd]}
                  max={100}
                  step={0.1}
                  onValueChange={([v]) => setTrimEnd(Math.max(v, trimStart + 0.1))} // Ensure end is always greater than start
                />
              </div>
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-300 text-sm">
                  Selected: {formatTime(((trimEnd - trimStart) / 100) * duration)} 
                  ({trimStart.toFixed(1)}% - {trimEnd.toFixed(1)}%)
                </p>
              </div>
              <Button onClick={createSegment} className="w-full bg-cyan-500 hover:bg-cyan-600" disabled={duration === 0}>
                <Scissors className="w-4 h-4 mr-2" />
                Create Segment from Selection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold">Video Segments ({segments.length})</CardTitle>
                <div className="flex gap-2">
                  {segments.some(s => s.aiGenerated) && (
                    <Badge className="bg-purple-500">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                  <Badge className="bg-purple-500">
                    {segments.length > 0 ? 'Ready to Merge' : 'No Segments'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {segments.length === 0 ? (
                <div className="text-center py-12">
                  <Split className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold mb-2">No Segments Created</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Use AI Rough Cut or manually create segments
                  </p>
                  <Button
                    onClick={generateRoughCut}
                    disabled={generatingRoughCut || duration === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {generatingRoughCut ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />AI Generate Segments</>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {segments.map((segment, idx) => (
                    <Card key={segment.id} className={`border-slate-700 ${segment.aiGenerated ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/30'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-white ${
                              segment.aiGenerated ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm">{segment.name}</p>
                              <p className="text-slate-400 text-xs">
                                {formatTime((segment.start / 100) * duration)} - {formatTime((segment.end / 100) * duration)}
                              </p>
                              {segment.importance && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge className="bg-amber-500 text-xs">
                                    Importance: {segment.importance}/10
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSegment(segment.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    onClick={generateOptimalTransitions}
                    disabled={generatingTransitions || segments.length < 2 || duration === 0}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {generatingTransitions ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating Transitions...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />AI Suggest Transitions</>
                    )}
                  </Button>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Merge className="w-4 h-4 mr-2" />
                    Merge Segments (Export Settings)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Overlays Tab */}
        <TabsContent value="text" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold">Add Text Overlay</CardTitle>
                  {subtitles.length > 0 && (
                    <Badge className="bg-cyan-500">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Subs Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Text</Label>
                  <Input
                    placeholder="Enter overlay text..."
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white mb-2 block">Position</Label>
                    <Select value={overlayPosition} onValueChange={setOverlayPosition}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="top" className="text-white">Top</SelectItem>
                        <SelectItem value="center" className="text-white">Center</SelectItem>
                        <SelectItem value="bottom" className="text-white">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Font Size: {overlayFontSize}px</Label>
                    <Slider
                      value={[overlayFontSize]}
                      min={12}
                      max={72}
                      step={1}
                      onValueChange={([v]) => setOverlayFontSize(v)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white mb-2 block">Start Time (s)</Label>
                    <Input
                      type="number"
                      value={overlayStartTime}
                      onChange={(e) => setOverlayStartTime(parseFloat(e.target.value))}
                      className="bg-slate-900 border-slate-700 text-white"
                      min="0"
                      max={duration}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Duration (s)</Label>
                    <Input
                      type="number"
                      value={overlayDuration}
                      onChange={(e) => setOverlayDuration(parseFloat(e.target.value))}
                      className="bg-slate-900 border-slate-700 text-white"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={overlayColor}
                      onChange={(e) => setOverlayColor(e.target.value)}
                      className="w-16 h-10 p-1 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={overlayColor}
                      onChange={(e) => setOverlayColor(e.target.value)}
                      className="flex-1 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <Button onClick={addTextOverlay} className="w-full bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Overlay
                </Button>

                {textOverlays.filter(o => !o.id.startsWith('ai-sub-')).length === 0 && (
                  <Button
                    onClick={generateSubtitles}
                    disabled={generatingSubtitles || duration === 0}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  >
                    {generatingSubtitles ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />AI Generate Subtitles</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Overlays List */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-bold">Active Overlays ({textOverlays.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {textOverlays.length === 0 ? (
                  <div className="text-center py-8">
                    <Type className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No overlays added</p>
                  </div>
                ) : (
                  textOverlays.map((overlay) => (
                    <Card key={overlay.id} className={`border-slate-700 ${overlay.id.startsWith('ai-sub-') ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-slate-900/30'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm mb-1">{overlay.text}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge className="bg-purple-500 text-xs">{overlay.position}</Badge>
                              <Badge className="bg-cyan-500 text-xs">{formatTime(overlay.startTime)}</Badge>
                              <Badge className="bg-green-500 text-xs">{overlay.duration}s</Badge>
                              {overlay.speaker && (
                                <Badge className="bg-blue-500 text-xs">{overlay.speaker}</Badge>
                              )}
                              {overlay.id.startsWith('ai-sub-') && (
                                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-xs">AI</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOverlay(overlay.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Color Correction Tab */}
        <TabsContent value="color" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Color Correction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">Brightness: {brightness}%</Label>
                <Slider
                  value={[brightness]}
                  min={50}
                  max={150}
                  step={1}
                  onValueChange={([v]) => setBrightness(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Contrast: {contrast}%</Label>
                <Slider
                  value={[contrast]}
                  min={50}
                  max={150}
                  step={1}
                  onValueChange={([v]) => setContrast(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Saturation: {saturation}%</Label>
                <Slider
                  value={[saturation]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([v]) => setSaturation(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Hue: {hue}°</Label>
                <Slider
                  value={[hue]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={([v]) => setHue(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">
                  Temperature: {temperature > 0 ? 'Warm' : temperature < 0 ? 'Cool' : 'Neutral'} ({temperature})
                </Label>
                <Slider
                  value={[temperature]}
                  min={-50}
                  max={50}
                  step={1}
                  onValueChange={([v]) => setTemperature(v)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                    setHue(0);
                    setTemperature(0);
                  }}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setBrightness(110);
                    setContrast(120);
                    setSaturation(130);
                    setHue(5);
                    setTemperature(20);
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Vibrant
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSaturation(0);
                    setContrast(110);
                    setBrightness(100);
                    setHue(0);
                    setTemperature(0);
                  }}
                  className="bg-slate-500 hover:bg-slate-600"
                >
                  B&W
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold">Transitions Between Segments</CardTitle>
                {transitions.some(t => t.aiGenerated) && (
                  <Badge className="bg-purple-500">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Optimized
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => addTransition('fade')}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                  disabled={segments.length < 2}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fade
                </Button>
                <Button
                  onClick={() => addTransition('dissolve')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  disabled={segments.length < 2}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Dissolve
                </Button>
                <Button
                  onClick={() => addTransition('wipe')}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800"
                  disabled={segments.length < 2}
                >
                  <Film className="w-4 h-4 mr-2" />
                  Wipe
                </Button>
                <Button
                  onClick={() => addTransition('slide')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  disabled={segments.length < 2}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Slide
                </Button>
              </div>

              {transitions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white font-bold">Active Transitions</Label>
                    {segments.length >= 2 && (
                      <Button
                        size="sm"
                        onClick={generateOptimalTransitions}
                        disabled={generatingTransitions || duration === 0}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {generatingTransitions ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-1" />
                        )}
                        AI Optimize
                      </Button>
                    )}
                  </div>
                  {transitions.map((trans, index) => (
                    <Card key={trans.id} className={`border-slate-700 ${trans.aiGenerated ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/30'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-purple-500">{trans.type}</Badge>
                              <Badge className="bg-cyan-500">{trans.duration}s</Badge>
                              {trans.aiGenerated && (
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">AI</Badge>
                              )}
                              <span className="text-slate-400 text-xs ml-2">
                                Between Segment {trans.position + 1} and {trans.position + 2}
                              </span>
                            </div>
                            {trans.reason && (
                              <p className="text-slate-400 text-xs mt-1">{trans.reason}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTransitions(transitions.filter(t => t.id !== trans.id))}
                            className="text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Export Settings</h3>
              <p className="text-slate-300 text-sm mb-4">
                Copy settings to use in professional video editing software
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>✓ {segments.length} segments defined {segments.some(s => s.aiGenerated) ? '(AI optimized)' : ''}</p>
                <p>✓ {textOverlays.length} text overlays {subtitles.length > 0 ? '(includes AI subtitles)' : ''}</p>
                <p>✓ {transitions.length} transitions {transitions.some(t => t.aiGenerated) ? '(AI suggested)' : ''}</p>
                <p>✓ Color correction applied</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={exportSettings} className="w-full bg-cyan-500 hover:bg-cyan-600">
                <Copy className="w-4 h-4 mr-2" />
                Copy All Settings (JSON)
              </Button>
              {subtitles.length > 0 && (
                <Button onClick={downloadSubtitles} className="w-full bg-blue-500 hover:bg-blue-600">
                  <Download className="w-4 h-4 mr-2" />
                  Download Subtitles (SRT)
                </Button>
              )}
              <Button onClick={() => alert('Download original video to apply these settings in Adobe Premiere, Final Cut Pro, or DaVinci Resolve')} className="w-full bg-purple-500 hover:bg-purple-600">
                <Download className="w-4 h-4 mr-2" />
                Download Instructions
              </Button>
              <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg text-center">
                <p className="text-amber-200 text-xs">
                  Browser can't export edited videos. Use settings in desktop software.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
