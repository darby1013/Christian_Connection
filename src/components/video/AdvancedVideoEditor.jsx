import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scissors, Layers, Type, Palette, Zap, Download, Save,
  Play, Pause, SkipBack, SkipForward, Plus, Trash2, Eye,
  Sparkles, Split, Merge, Image, Film, RefreshCw, Copy
} from "lucide-react";

export default function AdvancedVideoEditor({ videoUrl, onSave }) {
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
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
      if (temperature > 0) {
        filters.push(`sepia(${temperature}%)`);
      } else if (temperature < 0) {
        filters.push(`saturate(${100 + temperature}%)`);
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
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const createSegment = () => {
    const newSegment = {
      id: Date.now(),
      start: trimStart,
      end: trimEnd,
      name: `Segment ${segments.length + 1}`,
      filters: { brightness, contrast, saturation, hue, temperature }
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
      duration: overlayDuration
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
      duration: 1,
      position: segments.length - 1
    };

    setTransitions([...transitions, newTransition]);
    alert(`${type} transition added!`);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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

  return (
    <div className="space-y-6">
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
                  {overlay.text}
                </div>
              );
            })}
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
                <div className="relative h-2 bg-slate-800 rounded-full mt-2">
                  {segments.map(seg => (
                    <div
                      key={seg.id}
                      className="absolute h-full bg-cyan-500/50 rounded-full"
                      style={{
                        left: `${seg.start}%`,
                        width: `${seg.end - seg.start}%`
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
                onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)}
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
                onClick={() => videoRef.current && (videoRef.current.currentTime += 10)}
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
          </TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:bg-cyan-500">
            <Type className="w-4 h-4 mr-1" />
            Text
          </TabsTrigger>
          <TabsTrigger value="color" className="data-[state=active]:bg-cyan-500">
            <Palette className="w-4 h-4 mr-1" />
            Color
          </TabsTrigger>
          <TabsTrigger value="transitions" className="data-[state=active]:bg-cyan-500">
            <Sparkles className="w-4 h-4 mr-1" />
            Effects
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
                  onValueChange={([v]) => setTrimStart(Math.min(v, trimEnd - 1))}
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">End Position: {formatTime((trimEnd / 100) * duration)}</Label>
                <Slider
                  value={[trimEnd]}
                  max={100}
                  onValueChange={([v]) => setTrimEnd(Math.max(v, trimStart + 1))}
                />
              </div>
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-300 text-sm">
                  Selected: {formatTime(((trimEnd - trimStart) / 100) * duration)} 
                  ({trimStart}% - {trimEnd}%)
                </p>
              </div>
              <Button onClick={createSegment} className="w-full bg-cyan-500 hover:bg-cyan-600">
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
                <Badge className="bg-purple-500">
                  {segments.length > 0 ? 'Ready to Merge' : 'No Segments'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {segments.length === 0 ? (
                <div className="text-center py-12">
                  <Split className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold mb-2">No Segments Created</h3>
                  <p className="text-slate-400 text-sm">
                    Use the Trim tab to create segments
                  </p>
                </div>
              ) : (
                <>
                  {segments.map((segment, idx) => (
                    <Card key={segment.id} className="bg-slate-900/30 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded flex items-center justify-center font-bold text-white">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{segment.name}</p>
                              <p className="text-slate-400 text-xs">
                                {formatTime((segment.start / 100) * duration)} - {formatTime((segment.end / 100) * duration)}
                              </p>
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
              <CardHeader>
                <CardTitle className="text-white font-bold">Add Text Overlay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <SelectValue />
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
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Duration (s)</Label>
                    <Input
                      type="number"
                      value={overlayDuration}
                      onChange={(e) => setOverlayDuration(parseFloat(e.target.value))}
                      className="bg-slate-900 border-slate-700 text-white"
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
                      className="w-16 h-10 p-1 bg-slate-900 border-slate-700"
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
              </CardContent>
            </Card>

            {/* Overlays List */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-bold">Active Overlays ({textOverlays.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {textOverlays.length === 0 ? (
                  <div className="text-center py-8">
                    <Type className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No overlays added</p>
                  </div>
                ) : (
                  textOverlays.map((overlay) => (
                    <Card key={overlay.id} className="bg-slate-900/30 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm mb-1">{overlay.text}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge className="bg-purple-500 text-xs">{overlay.position}</Badge>
                              <Badge className="bg-cyan-500 text-xs">{formatTime(overlay.startTime)}</Badge>
                              <Badge className="bg-green-500 text-xs">{overlay.duration}s</Badge>
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
                  onValueChange={([v]) => setBrightness(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Contrast: {contrast}%</Label>
                <Slider
                  value={[contrast]}
                  min={50}
                  max={150}
                  onValueChange={([v]) => setContrast(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Saturation: {saturation}%</Label>
                <Slider
                  value={[saturation]}
                  min={0}
                  max={200}
                  onValueChange={([v]) => setSaturation(v)}
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Hue: {hue}°</Label>
                <Slider
                  value={[hue]}
                  min={-180}
                  max={180}
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
            <CardHeader>
              <CardTitle className="text-white font-bold">Transitions Between Segments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => addTransition('fade')}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fade
                </Button>
                <Button
                  onClick={() => addTransition('dissolve')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Dissolve
                </Button>
                <Button
                  onClick={() => addTransition('wipe')}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800"
                >
                  <Film className="w-4 h-4 mr-2" />
                  Wipe
                </Button>
                <Button
                  onClick={() => addTransition('slide')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Slide
                </Button>
              </div>

              {transitions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label className="text-white font-bold">Active Transitions</Label>
                  {transitions.map((trans) => (
                    <div key={trans.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded">
                      <Badge className="bg-purple-500">{trans.type}</Badge>
                      <Badge className="bg-cyan-500">{trans.duration}s</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setTransitions(transitions.filter(t => t.id !== trans.id))}
                        className="text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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
                <p>✓ {segments.length} segments defined</p>
                <p>✓ {textOverlays.length} text overlays</p>
                <p>✓ {transitions.length} transitions</p>
                <p>✓ Color correction applied</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={exportSettings} className="w-full bg-cyan-500 hover:bg-cyan-600">
                <Copy className="w-4 h-4 mr-2" />
                Copy All Settings (JSON)
              </Button>
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