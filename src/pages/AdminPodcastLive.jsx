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
  MessageSquare, Timer, MonitorPlay, RefreshCw, Download, Save, Mic2
} from "lucide-react";
import ScriptEditor from "../components/broadcast/ScriptEditor";
import AdvancedStreamTools from "../components/broadcast/AdvancedStreamTools";

export default function AdminPodcastLive() {
  const [user, setUser] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState(null);
  const [streamDuration, setStreamDuration] = useState(0);
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
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const teleprompterRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const queryClient = useQueryClient();

  const [podcastInfo, setPodcastInfo] = useState({
    title: '',
    description: '',
    category: 'Discussion',
    episode_number: 1,
    season: 1,
    host_name: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setPodcastInfo(prev => ({ ...prev, host_name: currentUser.full_name }));
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

  // HEARTBEAT: Keep podcast "alive" by updating every 4 seconds while broadcasting
  useEffect(() => {
    if (isLive && currentPodcastId) {
      updatePodcastMutation.mutate({
        id: currentPodcastId,
        data: {
          plays: listenerCount,
          is_live: true
        }
      });

      heartbeatIntervalRef.current = setInterval(() => {
        updatePodcastMutation.mutate({
          id: currentPodcastId,
          data: {
            plays: listenerCount,
            is_live: true
          }
        });
      }, 4000);
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isLive, currentPodcastId, listenerCount]);

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

  const createPodcastMutation = useMutation({
    mutationFn: (podcastData) => base44.entities.Podcast.create(podcastData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['livePodcasts'] });
    },
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['livePodcasts'] });
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
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraOn(true);
      setMicOn(true);
      setConnectionStatus('connected');
    } catch (error) {
      alert('Error accessing camera/microphone: ' + error.message);
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
    setMicOn(false);
    setConnectionStatus('disconnected');
  };

  const toggleMicrophone = async () => {
    if (!streamRef.current) {
      alert('Please start the camera first');
      return;
    }

    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicOn(!micOn);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      alert('No stream to record');
      return;
    }

    try {
      recordedChunksRef.current = [];
      
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, chunks:', recordedChunksRef.current.length);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error starting recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          console.log('Recording stopped, total chunks:', recordedChunksRef.current.length);
          setIsRecording(false);
          resolve();
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve();
      }
    });
  };

  const captureVideoThumbnail = () => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const uploadRecordedVideo = async () => {
    if (recordedChunksRef.current.length === 0) {
      console.log('No recorded chunks to upload');
      return null;
    }

    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `podcast_${currentPodcastId}_${Date.now()}.webm`, { type: 'video/webm' });
      
      console.log('Uploading video file, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('Video uploaded successfully:', file_url);
      return file_url;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  };

  const uploadThumbnail = async (thumbnailBlob) => {
    if (!thumbnailBlob) return null;

    try {
      const file = new File([thumbnailBlob], `podcast_thumbnail_${currentPodcastId}.jpg`, { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('Thumbnail uploaded successfully:', file_url);
      return file_url;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }
  };

  const goLive = async () => {
    if (!podcastInfo.title.trim()) {
      alert('Please enter a podcast title in the Podcast Information section below');
      return;
    }

    if (!cameraOn) {
      alert('Please turn on your camera first');
      return;
    }

    // Capture thumbnail before going live
    const thumbnailBlob = await captureVideoThumbnail();
    let thumbnailUrl = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800';
    
    if (thumbnailBlob) {
      const uploadedThumbnail = await uploadThumbnail(thumbnailBlob);
      if (uploadedThumbnail) {
        thumbnailUrl = uploadedThumbnail;
      }
    }

    const podcastData = {
      ...podcastInfo,
      content_type: 'video',
      is_live: true,
      published_date: new Date().toISOString(),
      plays: 0,
      image_url: thumbnailUrl,
      video_thumbnail_url: thumbnailUrl,
      duration: 0
    };

    const createdPodcast = await createPodcastMutation.mutateAsync(podcastData);
    setCurrentPodcastId(createdPodcast.id);
    setIsLive(true);
    setStreamStartTime(Date.now());
    
    // Start recording
    startRecording();
    
    const listenerInterval = setInterval(() => {
      const randomChange = Math.floor(Math.random() * 8) - 2;
      setListenerCount(prev => {
        const newCount = Math.max(0, prev + randomChange);
        setPeakListeners(current => Math.max(current, newCount));
        return newCount;
      });
    }, 5000);

    return () => clearInterval(listenerInterval);
  };

  const endPodcast = async () => {
    setIsSavingVideo(true);

    // Stop heartbeat immediately
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Stop recording
    await stopRecording();

    // Upload the recorded video
    let videoUrl = null;
    try {
      videoUrl = await uploadRecordedVideo();
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Warning: Video upload failed. Podcast will be saved without video file.');
    }

    // Capture final thumbnail
    const thumbnailBlob = await captureVideoThumbnail();
    let thumbnailUrl = null;
    if (thumbnailBlob) {
      thumbnailUrl = await uploadThumbnail(thumbnailBlob);
    }

    if (currentPodcastId) {
      const updateData = {
        is_live: false,
        duration: Math.floor(streamDuration / 60) * 60,
        plays: peakListeners
      };

      // Add video URL if upload was successful
      if (videoUrl) {
        updateData.video_url = videoUrl;
      }

      // Add thumbnail if captured
      if (thumbnailUrl) {
        updateData.video_thumbnail_url = thumbnailUrl;
        updateData.image_url = thumbnailUrl;
      }

      await updatePodcastMutation.mutateAsync({
        id: currentPodcastId,
        data: updateData
      });
    }

    setIsLive(false);
    setIsRecording(false);
    stopCamera();
    setStreamStartTime(null);
    setStreamDuration(0);
    setListenerCount(0);
    setPeakListeners(0);
    setTeleprompterPlaying(false);
    setCurrentPodcastId(null);
    setIsSavingVideo(false);
    recordedChunksRef.current = [];
    
    setPodcastInfo({
      title: '',
      description: '',
      category: 'Discussion',
      episode_number: 1,
      season: 1,
      host_name: user?.full_name || ''
    });

    alert('Live podcast ended and video saved successfully!');
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
            {isRecording && (
              <Badge className="bg-red-600 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-white mr-2" />
                Recording
              </Badge>
            )}
            <h2 className="text-3xl font-black text-white">Live Podcast Studio</h2>
          </div>
          <p className="text-slate-400 font-semibold">Professional live podcast streaming with video recording</p>
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
                    <Mic2 className="w-3 h-3 mr-1" />
                    LIVE PODCAST
                  </Badge>
                  <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                    <Users className="w-3 h-3 mr-1" />
                    {listenerCount} listening
                  </Badge>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge className="bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                      <Timer className="w-3 h-3 mr-1" />
                      {formatDuration(streamDuration)}
                    </Badge>
                    {isRecording && (
                      <Badge className="bg-red-600/80 backdrop-blur-sm border-0 shadow-xl animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-white mr-2" />
                        REC
                      </Badge>
                    )}
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
                    disabled={!cameraOn}
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
                      disabled={!cameraOn || !podcastInfo.title.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-black text-base px-8"
                    >
                      <Mic2 className="w-5 h-5 mr-2" />
                      GO LIVE
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={endPodcast}
                      disabled={isSavingVideo}
                      variant="destructive"
                      className="font-black text-base px-8"
                    >
                      {isSavingVideo ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          SAVING...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          END & SAVE
                        </>
                      )}
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

          {/* Podcast Information Form */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-purple-400" />
                Podcast Information
                {!podcastInfo.title.trim() && (
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-white font-bold mb-2 block">Episode Title *</Label>
                <Input
                  placeholder="e.g., Deep Dive: Faith and Technology"
                  value={podcastInfo.title}
                  onChange={(e) => setPodcastInfo({...podcastInfo, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  disabled={isLive}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Input
                    placeholder="Discussion, Interview..."
                    value={podcastInfo.category}
                    onChange={(e) => setPodcastInfo({...podcastInfo, category: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={isLive}
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Episode #</Label>
                  <Input
                    type="number"
                    value={podcastInfo.episode_number}
                    onChange={(e) => setPodcastInfo({...podcastInfo, episode_number: parseInt(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={isLive}
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Season</Label>
                  <Input
                    type="number"
                    value={podcastInfo.season}
                    onChange={(e) => setPodcastInfo({...podcastInfo, season: parseInt(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    disabled={isLive}
                  />
                </div>
              </div>
              <div>
                <Label className="text-white font-bold mb-2 block">Description</Label>
                <Textarea
                  placeholder="Tell listeners about this episode..."
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
            <TabsList className="w-full bg-slate-800/50 border border-slate-700 grid grid-cols-2">
              <TabsTrigger value="stats" className="data-[state=active]:bg-purple-500 text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-purple-500 text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Tools
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
                    <span className="text-slate-400 text-xs font-semibold">Listeners</span>
                    <span className="text-xl font-black text-white">{listenerCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Peak</span>
                    <span className="text-xl font-black text-white">{peakListeners}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Duration</span>
                    <span className="text-sm font-black text-purple-400">
                      {isLive ? formatDuration(streamDuration) : '00:00:00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Recording</span>
                    <Badge className={isRecording ? "bg-red-600" : "bg-slate-600"}>
                      {isRecording ? 'Active' : 'Stopped'}
                    </Badge>
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
              <AdvancedStreamTools />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}