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
  CheckCircle, AlertCircle, FileText, Settings as SettingsIcon, Plus, Eye
} from "lucide-react";
import Teleprompter from "../components/broadcast/Teleprompter";
import StreamTools from "../components/broadcast/StreamTools";
import ScriptEditor from "../components/broadcast/ScriptEditor";

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
  const [teleprompterFontSize, setTeleprompterFontSize] = useState(24);
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
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

  const createStreamMutation = useMutation({
    mutationFn: (streamData) => base44.entities.LiveStream.create(streamData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
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
    if (!streamInfo.title) {
      alert('Please enter a stream title');
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
      total_donations: 0
    };

    await createStreamMutation.mutateAsync(streamData);
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

  const endStream = () => {
    setIsLive(false);
    stopCamera();
    setStreamStartTime(null);
    setStreamDuration(0);
    setViewerCount(0);
    setPeakViewers(0);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScriptCreated = (script) => {
    setSelectedScript(script);
    setShowScriptEditor(false);
    setShowTeleprompter(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                STREAMING
              </Badge>
            )}
            <h2 className="text-3xl font-black text-white">Broadcast Studio</h2>
          </div>
          <p className="text-slate-400 font-semibold">Professional live streaming with AI-powered tools</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Video Feed */}
            <Card className="bg-[#1a1f3a] border-0 overflow-hidden">
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
                      <p className="text-slate-500 font-semibold">Camera is off</p>
                    </div>
                  </div>
                )}
                
                {isLive && (
                  <>
                    <Badge variant="destructive" className="absolute top-4 left-4 animate-pulse shadow-lg">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                    <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-0 shadow-lg">
                      <Users className="w-3 h-3 mr-1" />
                      {viewerCount}
                    </Badge>
                  </>
                )}
              </div>

              <CardContent className="p-4 bg-slate-900/50">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    size="sm"
                    onClick={cameraOn ? stopCamera : startCamera}
                    disabled={isLive}
                    className={cameraOn ? "bg-green-600" : "bg-slate-700"}
                  >
                    {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="sm"
                    onClick={toggleMicrophone}
                    disabled={!cameraOn || isLive}
                    className={micOn ? "bg-green-600" : "bg-slate-700"}
                  >
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>

                  {!isLive ? (
                    <Button
                      size="sm"
                      onClick={goLive}
                      disabled={!cameraOn}
                      className="bg-gradient-to-r from-orange-600 to-red-600 font-bold"
                    >
                      <Radio className="w-4 h-4 mr-1" />
                      GO LIVE
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={endStream}
                      variant="destructive"
                      className="font-bold"
                    >
                      END STREAM
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => setShowTeleprompter(!showTeleprompter)}
                    className={showTeleprompter ? "bg-amber-500" : "bg-slate-700"}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teleprompter - Side by Side */}
            {showTeleprompter && selectedScript && (
              <Card className="bg-black border-2 border-amber-500/30 overflow-hidden">
                <CardHeader className="border-b border-amber-500/20 py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-amber-400 font-bold text-sm">Teleprompter</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-xs">{teleprompterFontSize}px</span>
                      <Slider
                        value={[teleprompterFontSize]}
                        onValueChange={([value]) => setTeleprompterFontSize(value)}
                        min={16}
                        max={32}
                        step={2}
                        className="w-20"
                      />
                    </div>
                  </div>
                </CardHeader>
                <div 
                  className="h-[calc(100%-60px)] overflow-y-auto p-4 bg-black"
                  style={{
                    fontSize: `${teleprompterFontSize}px`,
                    lineHeight: '1.8'
                  }}
                >
                  <div className="text-white font-mono">
                    {selectedScript.content.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-4">{line}</p>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Script Management */}
          {showTeleprompter && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-sm">Scripts</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowScriptEditor(!showScriptEditor)}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New Script
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {showScriptEditor ? (
                  <ScriptEditor user={user} onScriptCreated={handleScriptCreated} />
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scripts.map((script) => (
                      <button
                        key={script.id}
                        onClick={() => setSelectedScript(script)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedScript?.id === script.id
                            ? 'bg-amber-500/20 border-2 border-amber-500'
                            : 'bg-slate-900/50 border-2 border-transparent hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold text-sm">{script.title}</h4>
                            <p className="text-xs text-slate-400">{script.duration} min • {script.is_ai_generated ? 'AI Generated' : 'Manual'}</p>
                          </div>
                          <Badge className="bg-purple-500 text-xs">{script.script_type}</Badge>
                        </div>
                      </button>
                    ))}
                    {scripts.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No scripts yet</p>
                        <p className="text-slate-500 text-xs">Create one to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stream Info Form */}
          {!showTeleprompter && (
            <Card className="bg-[#1a1f3a] border-0">
              <CardHeader>
                <CardTitle className="text-white font-black">Stream Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Stream Title *</Label>
                  <Input
                    placeholder="Enter your stream title..."
                    value={streamInfo.title}
                    onChange={(e) => setStreamInfo({...streamInfo, title: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Description</Label>
                  <Textarea
                    placeholder="Tell viewers what this stream is about..."
                    value={streamInfo.description}
                    onChange={(e) => setStreamInfo({...streamInfo, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white h-24"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g., Worship, Teaching, Prayer"
                    value={streamInfo.category}
                    onChange={(e) => setStreamInfo({...streamInfo, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Stats & Tools */}
        <div className="space-y-6">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="w-full bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-cyan-500">
                <Activity className="w-4 h-4 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 data-[state=active]:bg-cyan-500">
                <SettingsIcon className="w-4 h-4 mr-1" />
                Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-4 space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-black text-lg">Live Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Viewers</span>
                    <span className="text-2xl font-black text-white">{viewerCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Peak</span>
                    <span className="text-2xl font-black text-white">{peakViewers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Duration</span>
                    <span className="text-lg font-black text-cyan-400">
                      {isLive ? formatDuration(streamDuration) : '00:00:00'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-black text-lg">System</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Camera</span>
                    <Badge className={cameraOn ? "bg-green-600" : "bg-slate-600"}>
                      {cameraOn ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {cameraOn ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Mic</span>
                    <Badge className={micOn ? "bg-green-600" : "bg-slate-600"}>
                      {micOn ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {micOn ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Connection</span>
                    <Badge className={connectionStatus === 'connected' ? "bg-green-600" : "bg-slate-600"}>
                      {connectionStatus === 'connected' ? 'Stable' : 'Offline'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="mt-4">
              <StreamTools />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}