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
  Mic, MicOff, Radio, Users, Activity, FileText, Eye,
  EyeOff, Play, Pause, Volume2, Timer, MonitorPlay,
  Settings as SettingsIcon, CheckCircle, AlertCircle
} from "lucide-react";
import StreamTools from "../components/broadcast/StreamTools";
import ScriptEditor from "../components/broadcast/ScriptEditor";
import AdvancedStreamTools from "../components/broadcast/AdvancedStreamTools";

export default function AdminLivePodcast() {
  const [user, setUser] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [podcastStartTime, setPodcastStartTime] = useState(null);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [listenerCount, setListenerCount] = useState(0);
  const [peakListeners, setPeakListeners] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);
  const [teleprompterFontSize, setTeleprompterFontSize] = useState(20);
  const [showScriptManager, setShowScriptManager] = useState(false);
  const [teleprompterPlaying, setTeleprompterPlaying] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(1);
  const [currentPodcastId, setCurrentPodcastId] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const teleprompterRef = useRef(null);
  const queryClient = useQueryClient();

  const [podcastInfo, setPodcastInfo] = useState({
    title: '',
    description: '',
    category: 'Teaching',
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
    if (isLive && podcastStartTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - podcastStartTime) / 1000);
        setPodcastDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, podcastStartTime]);

  useEffect(() => {
    let interval;
    if (teleprompterPlaying && teleprompterRef.current) {
      interval = setInterval(() => {
        teleprompterRef.current.scrollTop += teleprompterSpeed;
      }, 50);
    }
    return () => clearInterval(interval);
  }, [teleprompterPlaying, teleprompterSpeed]);

  // Audio level simulation
  useEffect(() => {
    if (micOn) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [micOn]);

  const createPodcastMutation = useMutation({
    mutationFn: (podcastData) => base44.entities.LivePodcast.create(podcastData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livePodcasts'] });
    },
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LivePodcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livePodcasts'] });
    },
  });

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicOn(true);
      setConnectionStatus('connected');
    } catch (error) {
      alert('Error accessing microphone: ' + error.message);
      setConnectionStatus('error');
    }
  };

  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setMicOn(false);
    setConnectionStatus('disconnected');
  };

  const goLive = async () => {
    if (!podcastInfo.title.trim()) {
      alert('Please enter a podcast title');
      return;
    }

    if (!micOn) {
      alert('Please turn on your microphone first');
      return;
    }

    const podcastData = {
      ...podcastInfo,
      host_id: user.id,
      host_name: user.full_name,
      status: 'live',
      started_at: new Date().toISOString(),
      listener_count: 0,
      thumbnail_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800'
    };

    const createdPodcast = await createPodcastMutation.mutateAsync(podcastData);
    setCurrentPodcastId(createdPodcast.id);
    setIsLive(true);
    setPodcastStartTime(Date.now());
    
    const listenerInterval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 5) - 2;
      setListenerCount(prev => {
        const newCount = Math.max(0, prev + randomChange);
        setPeakListeners(current => Math.max(current, newCount));
        return newCount;
      });
    }, 5000);

    return () => clearInterval(listenerInterval);
  };

  const endPodcast = async () => {
    if (currentPodcastId) {
      await updatePodcastMutation.mutateAsync({
        id: currentPodcastId,
        data: {
          status: 'ended',
          ended_at: new Date().toISOString(),
          listener_count: peakListeners,
          audio_url: `https://example.com/recordings/${currentPodcastId}.mp3`,
          duration: Math.floor(podcastDuration / 60)
        }
      });
    }

    setIsLive(false);
    stopMicrophone();
    setPodcastStartTime(null);
    setPodcastDuration(0);
    setListenerCount(0);
    setPeakListeners(0);
    setTeleprompterPlaying(false);
    setCurrentPodcastId(null);
    
    setPodcastInfo({
      title: '',
      description: '',
      category: 'Teaching',
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            <h2 className="text-3xl font-black text-white">Live Podcast Studio</h2>
          </div>
          <p className="text-slate-400 font-semibold">Professional audio broadcasting with advanced tools</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Audio Studio */}
          <Card className="bg-[#1a1f3a] border-0">
            <div className="relative aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                  <Mic className={`w-16 h-16 ${micOn ? 'text-green-400' : 'text-slate-600'}`} />
                </div>
                
                {/* Audio Level Indicator */}
                {micOn && (
                  <div className="flex items-end gap-1 h-24">
                    {Array.from({ length: 40 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-2 bg-gradient-to-t from-green-500 to-cyan-400 rounded-t-full transition-all duration-75"
                        style={{ 
                          height: `${Math.min(100, Math.abs(Math.sin(idx + audioLevel / 10) * audioLevel))}%`,
                          opacity: 0.7 + (audioLevel / 200)
                        }}
                      />
                    ))}
                  </div>
                )}

                {!micOn && (
                  <p className="text-slate-400 font-semibold">Microphone Off</p>
                )}
              </div>

              {isLive && (
                <>
                  <Badge variant="destructive" className="absolute top-4 left-4 animate-pulse shadow-xl text-sm">
                    <Radio className="w-3 h-3 mr-1" />
                    LIVE
                  </Badge>
                  <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-0 shadow-xl text-sm">
                    <Users className="w-3 h-3 mr-1" />
                    {listenerCount} listening
                  </Badge>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge className="bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                      <Timer className="w-3 h-3 mr-1" />
                      {formatDuration(podcastDuration)}
                    </Badge>
                    {micOn && (
                      <Badge className="bg-green-500/20 border border-green-500/50 text-green-300">
                        <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                        Recording
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>

            <CardContent className="p-4 bg-slate-900/50 border-t border-slate-800">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={micOn ? stopMicrophone : startMicrophone}
                    disabled={isLive}
                    className={micOn ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"}
                  >
                    {micOn ? <Mic className="w-4 h-4 mr-1" /> : <MicOff className="w-4 h-4 mr-1" />}
                    Microphone
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
                      disabled={!micOn || !podcastInfo.title.trim()}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-black text-base px-8"
                    >
                      <Radio className="w-5 h-5 mr-2" />
                      GO LIVE
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={endPodcast}
                      variant="destructive"
                      className="font-black text-base px-8"
                    >
                      END PODCAST
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Podcast Info */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-cyan-400" />
                Podcast Information
                {!podcastInfo.title.trim() && (
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-white font-bold mb-2 block">Title *</Label>
                <Input
                  placeholder="e.g., Sunday Morning Teaching"
                  value={podcastInfo.title}
                  onChange={(e) => setPodcastInfo({...podcastInfo, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  disabled={isLive}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Input
                    placeholder="Teaching, Worship..."
                    value={podcastInfo.category}
                    onChange={(e) => setPodcastInfo({...podcastInfo, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={isLive}
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Type</Label>
                  <Input
                    value="Audio Podcast"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled
                  />
                </div>
              </div>
              <div>
                <Label className="text-white font-bold mb-2 block">Description</Label>
                <Textarea
                  placeholder="Tell listeners about this podcast..."
                  value={podcastInfo.description}
                  onChange={(e) => setPodcastInfo({...podcastInfo, description: e.target.value})}
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
                  {showScriptManager ? 'Hide' : 'New Script'}
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

        {/* Sidebar Stats & Tools */}
        <div className="space-y-4">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="w-full bg-slate-800/50 border border-slate-700 grid grid-cols-3">
              <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-500 text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-cyan-500 text-xs">
                <SettingsIcon className="w-3 h-3 mr-1" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-purple-500 text-xs">
                Pro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-4 space-y-3">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700 py-2 px-3">
                  <CardTitle className="text-white font-bold text-sm">Live Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Listeners</span>
                    <span className="text-xl font-black text-white">{listenerCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Peak</span>
                    <span className="text-xl font-black text-white">{peakListeners}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Duration</span>
                    <span className="text-sm font-black text-cyan-400">
                      {isLive ? formatDuration(podcastDuration) : '00:00:00'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700 py-2 px-3">
                  <CardTitle className="text-white font-bold text-sm">System</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Microphone</span>
                    <Badge className={micOn ? "bg-green-600 text-xs" : "bg-slate-600 text-xs"}>
                      {micOn ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
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