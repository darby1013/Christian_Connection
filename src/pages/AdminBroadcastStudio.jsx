import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Video, VideoOff, Mic, MicOff, Radio, Users, Activity,
  CheckCircle, AlertCircle, FileText, Settings as SettingsIcon, 
  Plus, Eye, EyeOff, Play, Pause, Volume2, Zap, Layers,
  MessageSquare, Timer, MonitorPlay, RefreshCw, Download
} from "lucide-react";
import StreamTools from "../components/broadcast/StreamTools";
import ScriptEditor from "../components/broadcast/ScriptEditor";
import AdvancedStreamTools from "../components/broadcast/AdvancedStreamTools";

export default function AdminBroadcastStudio() {
  const [user, setUser] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [teleprompterFontSize, setTeleprompterFontSize] = useState(20);
  const [showScriptManager, setShowScriptManager] = useState(false);
  const [teleprompterPlaying, setTeleprompterPlaying] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(1);
  const [currentStreamId, setCurrentStreamId] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const teleprompterRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const queryClient = useQueryClient();

  const [streamInfo, setStreamInfo] = useState({
    title: '',
    description: '',
    category: 'Worship',
    stream_type: 'video'
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: scripts = [] } = useQuery({
    queryKey: ['streamScripts', user?.id],
    queryFn: () => base44.entities.StreamScript.filter({ author_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  // HEARTBEAT: Keep stream "alive" by updating every 4 seconds while broadcasting
  useEffect(() => {
    if (isLive && currentStreamId) {
      // Update immediately when going live
      updateStreamMutation.mutate({
        id: currentStreamId,
        data: {
          viewer_count: viewerCount,
          status: 'live'
        }
      });

      // Then update every 4 seconds to keep it "active"
      heartbeatIntervalRef.current = setInterval(() => {
        updateStreamMutation.mutate({
          id: currentStreamId,
          data: {
            viewer_count: viewerCount,
            status: 'live'
          }
        });
      }, 4000); // Update every 4 seconds
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isLive, currentStreamId, viewerCount]);

  useEffect(() => {
    let interval;
    if (isLive && streamStartTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - streamStartTime) / 1000);
        setStreamDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, streamStartTime]);

  // Auto-scroll teleprompter
  useEffect(() => {
    let interval;
    if (teleprompterPlaying && teleprompterRef.current) {
      interval = setInterval(() => {
        teleprompterRef.current.scrollTop += teleprompterSpeed;
      }, 50);
    }
    return () => clearInterval(interval);
  }, [teleprompterPlaying, teleprompterSpeed]);

  const createStreamMutation = useMutation({
    mutationFn: (streamData) => base44.entities.LiveStream.create(streamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
      queryClient.invalidateQueries({ queryKey: ['activeLiveStreams'] });
    },
  });

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveStream.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
      queryClient.invalidateQueries({ queryKey: ['activeLiveStreams'] });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraOn(true);
      setConnectionStatus('connected');
    } catch (error) {
      alert('Error accessing camera: ' + error.message);
      setConnectionStatus('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
    }
    setCameraOn(false);
    setConnectionStatus('disconnected');
  };

  const toggleMicrophone = async () => {
    if (!micOn) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (streamRef.current) {
          const audioTrack = audioStream.getAudioTracks()[0];
          streamRef.current.addTrack(audioTrack);
        }
        setMicOn(true);
      } catch (error) {
        alert('Error accessing microphone: ' + error.message);
      }
    } else {
      if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        audioTracks.forEach(track => {
          track.stop();
          streamRef.current.removeTrack(track);
        });
      }
      setMicOn(false);
    }
  };

  const goLive = async () => {
    if (!streamInfo.title.trim()) {
      alert('Please enter a stream title in the Stream Information section below');
      return;
    }

    if (!cameraOn) {
      alert('Please turn on your camera first');
      return;
    }

    const streamData = {
      ...streamInfo,
      host_id: user.id,
      host_name: user.full_name,
      status: 'live',
      started_at: new Date().toISOString(),
      viewer_count: 0,
      total_donations: 0,
      thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'
    };

    const createdStream = await createStreamMutation.mutateAsync(streamData);
    setCurrentStreamId(createdStream.id);
    setIsLive(true);
    setStreamStartTime(Date.now());
    
    const viewerInterval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 10) - 3;
      setViewerCount(prev => {
        const newCount = Math.max(0, prev + randomChange);
        setPeakViewers(current => Math.max(current, newCount));
        return newCount;
      });
    }, 5000);

    return () => clearInterval(viewerInterval);
  };

  const endStream = async () => {
    // Stop heartbeat immediately
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (currentStreamId) {
      // Update stream to ended status
      await updateStreamMutation.mutateAsync({
        id: currentStreamId,
        data: {
          status: 'ended',
          ended_at: new Date().toISOString(),
          viewer_count: peakViewers,
          stream_url: `https://example.com/recordings/${currentStreamId}.mp4`,
          duration: Math.floor(streamDuration / 60)
        }
      });
    }

    setIsLive(false);
    stopCamera();
    setStreamStartTime(null);
    setStreamDuration(0);
    setViewerCount(0);
    setPeakViewers(0);
    setTeleprompterPlaying(false);
    setCurrentStreamId(null);
    
    setStreamInfo({
      title: '',
      description: '',
      category: 'Worship',
      stream_type: 'video'
    });
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScriptCreated = (script) => {
    setSelectedScript(script);
    setShowScriptManager(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            <h2 className="text-3xl font-black text-white">Broadcast Studio</h2>
          </div>
          <p className="text-slate-400 font-semibold">Professional live streaming with advanced tools</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Video + Teleprompter Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Preview */}
          <Card className="bg-[#1a1f3a] border-0">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-semibold">Camera Off</p>
                  </div>
                </div>
              )}
              
              {isLive && (
                <>
                  <Badge variant="destructive" className="absolute top-4 left-4 animate-pulse shadow-xl text-sm">
                    <Radio className="w-3 h-3 mr-1" />
                    LIVE
                  </Badge>
                  <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                    <Users className="w-3 h-3 mr-1" />
                    {viewerCount} watching
                  </Badge>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge className="bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                      <Timer className="w-3 h-3 mr-1" />
                      {formatDuration(streamDuration)}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Stream Controls */}
            <CardContent className="p-4 bg-slate-900/50 border-t border-slate-800">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={cameraOn ? stopCamera : startCamera}
                    disabled={isLive}
                    className={cameraOn ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"}
                  >
                    {cameraOn ? <Video className="w-4 h-4 mr-1" /> : <VideoOff className="w-4 h-4 mr-1" />}
                    Camera
                  </Button>

                  <Button
                    size="sm"
                    onClick={toggleMicrophone}
                    disabled={!cameraOn || isLive}
                    className={micOn ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"}
                  >
                    {micOn ? <Mic className="w-4 h-4 mr-1" /> : <MicOff className="w-4 h-4 mr-1" />}
                    Mic
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setShowTeleprompter(!showTeleprompter)}
                    className={showTeleprompter ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-700 hover:bg-slate-600"}
                  >
                    {showTeleprompter ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    Script
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {!isLive ? (
                    <Button
                      size="lg"
                      onClick={goLive}
                      disabled={!cameraOn || !streamInfo.title.trim()}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-black text-base px-8"
                    >
                      <Radio className="w-5 h-5 mr-2" />
                      GO LIVE
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={endStream}
                      variant="destructive"
                      className="font-black text-base px-8"
                    >
                      END STREAM
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teleprompter */}
          {showTeleprompter && (
            <Card className="bg-black border-2 border-amber-500/30">
              <CardHeader className="border-b border-amber-500/20 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-400 font-bold text-base flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Teleprompter
                    {selectedScript && (
                      <Badge className="bg-purple-500 ml-2">{selectedScript.title}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => setTeleprompterPlaying(!teleprompterPlaying)}
                      disabled={!selectedScript}
                      className={teleprompterPlaying ? "bg-amber-500" : "bg-slate-700"}
                    >
                      {teleprompterPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-xs">{teleprompterFontSize}px</span>
                      <Slider
                        value={[teleprompterFontSize]}
                        onValueChange={([value]) => setTeleprompterFontSize(value)}
                        min={14}
                        max={28}
                        step={2}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-xs">Speed</span>
                      <Slider
                        value={[teleprompterSpeed]}
                        onValueChange={([value]) => setTeleprompterSpeed(value)}
                        min={0.5}
                        max={3}
                        step={0.5}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div 
                ref={teleprompterRef}
                className="h-64 overflow-y-auto p-6 bg-black"
                style={{
                  fontSize: `${teleprompterFontSize}px`,
                  lineHeight: '1.8'
                }}
              >
                {selectedScript ? (
                  <div className="text-amber-100 font-mono">
                    {selectedScript.content.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-4">{line}</p>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-16">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">No script selected</p>
                    <p className="text-sm">Select or create a script below</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Stream Information Form */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-cyan-400" />
                Stream Information
                {!streamInfo.title.trim() && (
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-white font-bold mb-2 block">Title *</Label>
                <Input
                  placeholder="e.g., Sunday Morning Worship"
                  value={streamInfo.title}
                  onChange={(e) => setStreamInfo({...streamInfo, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  disabled={isLive}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Input
                    placeholder="Worship, Teaching..."
                    value={streamInfo.category}
                    onChange={(e) => setStreamInfo({...streamInfo, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={isLive}
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Type</Label>
                  <Input
                    value={streamInfo.stream_type}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled
                  />
                </div>
              </div>
              <div>
                <Label className="text-white font-bold mb-2 block">Description</Label>
                <Textarea
                  placeholder="Tell viewers about this stream..."
                  value={streamInfo.description}
                  onChange={(e) => setStreamInfo({...streamInfo, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-20"
                  disabled={isLive}
                />
              </div>
            </CardContent>
          </Card>

          {/* Script Manager */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Script Manager
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowScriptManager(!showScriptManager)}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {showScriptManager ? 'Hide' : <><Plus className="w-3 h-3 mr-1" />New</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {showScriptManager ? (
                <ScriptEditor user={user} onScriptCreated={handleScriptCreated} />
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scripts.map((script) => (
                    <button
                      key={script.id}
                      onClick={() => setSelectedScript(script)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedScript?.id === script.id
                          ? 'bg-amber-500/20 border-2 border-amber-500'
                          : 'bg-slate-900/50 border-2 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm">{script.title}</h4>
                          <p className="text-xs text-slate-400">
                            {script.duration} min • {script.is_ai_generated ? 'AI Generated' : 'Manual'}
                          </p>
                        </div>
                        <Badge className="bg-purple-500 text-xs">{script.script_type}</Badge>
                      </div>
                    </button>
                  ))}
                  {scripts.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-semibold">No scripts yet</p>
                      <p className="text-slate-500 text-xs">Create one to get started</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats & Tools */}
        <div className="space-y-4">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="w-full bg-slate-800/50 border border-slate-700 grid grid-cols-3">
              <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-500 text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-cyan-500 text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-purple-500 text-xs">
                <Layers className="w-3 h-3 mr-1" />
                Pro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-4 space-y-3">
              {/* Live Stats */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700 py-2 px-3">
                  <CardTitle className="text-white font-bold text-sm">Live Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Viewers</span>
                    <span className="text-xl font-black text-white">{viewerCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Peak</span>
                    <span className="text-xl font-black text-white">{peakViewers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Duration</span>
                    <span className="text-sm font-black text-cyan-400">
                      {isLive ? formatDuration(streamDuration) : '00:00:00'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700 py-2 px-3">
                  <CardTitle className="text-white font-bold text-sm">System</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Camera</span>
                    <Badge className={cameraOn ? "bg-green-600 text-xs" : "bg-slate-600 text-xs"}>
                      {cameraOn ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Mic</span>
                    <Badge className={micOn ? "bg-green-600 text-xs" : "bg-slate-600 text-xs"}>
                      {micOn ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Connection</span>
                    <Badge className={connectionStatus === 'connected' ? "bg-green-600 text-xs" : "bg-slate-600 text-xs"}>
                      {connectionStatus === 'connected' ? 'Stable' : 'Offline'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="mt-4">
              <StreamTools />
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              <AdvancedStreamTools />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}