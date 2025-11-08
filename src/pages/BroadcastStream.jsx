import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, Radio, Users, Clock, Activity,
  CheckCircle, AlertCircle, Settings, FileText, Sparkles
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Teleprompter from "../components/broadcast/Teleprompter";
import StreamTools from "../components/broadcast/StreamTools";

export default function BroadcastStream() {
  const [user, setUser] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [streamStats, setStreamStats] = useState({
    resolution: '1080p',
    bitrate: '4500 kbps',
    fps: 30
  });

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
        base44.auth.redirectToLogin();
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

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveStream.update(id, data),
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

    const result = await createStreamMutation.mutateAsync(streamData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
                <Radio className="w-3 h-3 mr-1" />
                STREAMING
              </Badge>
            )}
            <h1 className="text-3xl font-black text-white">Broadcast Studio</h1>
          </div>
          <p className="text-slate-400 font-semibold">Professional live streaming with AI-powered tools</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Video Feed + Teleprompter */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <Card className="bg-slate-800/50 border-2 border-orange-500/30 overflow-hidden">
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
                      {viewerCount} watching
                    </Badge>
                  </>
                )}
              </div>

              {/* Stream Controls */}
              <CardContent className="p-6 bg-slate-900/50">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    size="lg"
                    onClick={cameraOn ? stopCamera : startCamera}
                    disabled={isLive}
                    className={cameraOn 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-slate-700 hover:bg-slate-600"}
                  >
                    {cameraOn ? <Video className="w-5 h-5 mr-2" /> : <VideoOff className="w-5 h-5 mr-2" />}
                    {cameraOn ? 'Camera On' : 'Camera Off'}
                  </Button>

                  <Button
                    size="lg"
                    onClick={toggleMicrophone}
                    disabled={!cameraOn || isLive}
                    className={micOn 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-slate-700 hover:bg-slate-600"}
                  >
                    {micOn ? <Mic className="w-5 h-5 mr-2" /> : <MicOff className="w-5 h-5 mr-2" />}
                    {micOn ? 'Mic On' : 'Mic Off'}
                  </Button>

                  {!isLive ? (
                    <Button
                      size="lg"
                      onClick={goLive}
                      disabled={!cameraOn}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-bold px-8"
                    >
                      <Radio className="w-5 h-5 mr-2" />
                      GO LIVE
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={endStream}
                      variant="destructive"
                      className="font-bold px-8"
                    >
                      END STREAM
                    </Button>
                  )}

                  <Button
                    size="lg"
                    onClick={() => setShowTeleprompter(!showTeleprompter)}
                    className={showTeleprompter 
                      ? "bg-amber-500 hover:bg-amber-600" 
                      : "bg-slate-700 hover:bg-slate-600"}
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Script
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teleprompter - Only visible to host */}
            {showTeleprompter && (
              <div>
                <Teleprompter script={selectedScript} isVisible={true} />
                
                {/* Script Selector */}
                <Card className="bg-slate-800/50 border-slate-700 mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white font-bold text-sm">Select Script</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
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
                              <p className="text-xs text-slate-400">{script.topic} • {script.duration} min</p>
                            </div>
                            <Badge className="bg-purple-500">{script.script_type}</Badge>
                          </div>
                        </button>
                      ))}
                      {scripts.length === 0 && (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">No scripts available</p>
                          <p className="text-slate-500 text-xs">Create one using AI Script Generator</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stream Information */}
            {!isLive && !showTeleprompter && (
              <Card className="bg-slate-800/50 border-2 border-orange-500/30">
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
                      className="bg-slate-900/50 border-orange-500/30 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold mb-2 block">Description</Label>
                    <Textarea
                      placeholder="Tell viewers what this stream is about..."
                      value={streamInfo.description}
                      onChange={(e) => setStreamInfo({...streamInfo, description: e.target.value})}
                      className="bg-slate-900/50 border-orange-500/30 text-white h-24"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold mb-2 block">Category</Label>
                    <Input
                      placeholder="e.g., Worship, Teaching, Prayer"
                      value={streamInfo.category}
                      onChange={(e) => setStreamInfo({...streamInfo, category: e.target.value})}
                      className="bg-slate-900/50 border-orange-500/30 text-white"
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
                  <Settings className="w-4 h-4 mr-1" />
                  Tools
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-4 space-y-4">
                {/* Live Stats */}
                <Card className="bg-slate-800/50 border-2 border-cyan-500/30">
                  <CardHeader className="border-b border-cyan-500/20">
                    <CardTitle className="text-white font-black text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Live Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Current Viewers</span>
                      <span className="text-2xl font-black text-white">{viewerCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Peak Viewers</span>
                      <span className="text-2xl font-black text-white">{peakViewers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Chat Messages</span>
                      <span className="text-2xl font-black text-white">{chatCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Stream Duration</span>
                      <span className="text-lg font-black text-cyan-400">
                        {isLive ? formatDuration(streamDuration) : '00:00:00'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="bg-slate-800/50 border-2 border-purple-500/30">
                  <CardHeader className="border-b border-purple-500/20">
                    <CardTitle className="text-white font-black text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Camera</span>
                      <Badge className={cameraOn ? "bg-green-600" : "bg-slate-600"}>
                        {cameraOn ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {cameraOn ? 'Connected' : 'Off'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Microphone</span>
                      <Badge className={micOn ? "bg-green-600" : "bg-slate-600"}>
                        {micOn ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {micOn ? 'Active' : 'Off'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Connection</span>
                      <Badge className={connectionStatus === 'connected' ? "bg-green-600" : "bg-slate-600"}>
                        {connectionStatus === 'connected' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {connectionStatus === 'connected' ? 'Stable' : 'Disconnected'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Stream Info */}
                <Card className="bg-slate-800/50 border-2 border-orange-500/30">
                  <CardHeader className="border-b border-orange-500/20">
                    <CardTitle className="text-white font-black text-lg">Stream Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Status</span>
                      <Badge className={isLive ? "bg-red-600" : "bg-slate-600"}>
                        {isLive ? 'Live' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Resolution</span>
                      <span className="text-white font-bold">{streamStats.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Bitrate</span>
                      <span className="text-white font-bold">{streamStats.bitrate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">FPS</span>
                      <span className="text-white font-bold">{streamStats.fps}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tools" className="mt-4">
                <StreamTools />
              </TabsContent>
            </Tabs>

            {/* Quick Tips */}
            <Card className="bg-slate-800/50 border-2 border-yellow-500/30">
              <CardHeader className="border-b border-yellow-500/20">
                <CardTitle className="text-white font-black text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span className="font-semibold">Use teleprompter for seamless delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span className="font-semibold">Test audio levels before going live</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span className="font-semibold">Generate AI scripts for better content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span className="font-semibold">Check internet connection stability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span className="font-semibold">Position camera at eye level</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}