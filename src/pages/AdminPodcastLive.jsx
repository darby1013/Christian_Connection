
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
import { format } from 'date-fns';
import {
  Video, VideoOff, Mic, MicOff, Radio, Users, Activity,
  CheckCircle, AlertCircle, FileText, Settings as SettingsIcon,
  Plus, Eye, EyeOff, Play, Pause, Volume2, Zap, Layers,
  MessageSquare, Timer, MonitorPlay, RefreshCw, Download, Save, Mic2,
  Music, Trash2, BarChart3
} from "lucide-react";
import ScriptEditor from "../components/broadcast/ScriptEditor";
import AdvancedStreamTools from "../components/broadcast/AdvancedStreamTools";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState('video'); // 'video' or 'audio'

  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autoSaveProgress, setAutoSaveProgress] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'

  // Co-hosting state
  const [coHosts, setCoHosts] = useState([]);
  const [showCoHostDialog, setShowCoHostDialog] = useState(false);
  const [coHostEmail, setCoHostEmail] = useState('');
  const [addingCoHost, setAddingCoHost] = useState(false);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [engagementData, setEngagementData] = useState({
    likes: 0,
    comments: [],
    shares: 0,
    avgWatchTime: 0,
    peakMoment: null,
    dropOffPoints: []
  });
  const [realtimeFeedback, setRealtimeFeedback] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioChunksRef = useRef([]);
  const teleprompterRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
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
  }, [isLive, currentPodcastId, listenerCount, updatePodcastMutation]);

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

  // AUTO-SAVE: Save recording chunks every 5 minutes
  useEffect(() => {
    if (isRecording && autoSaveEnabled && currentPodcastId) {
      const autoSaveInterval = 5 * 60 * 1000; // 5 minutes

      autoSaveIntervalRef.current = setInterval(async () => {
        await performAutoSave();
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    };
  }, [isRecording, autoSaveEnabled, currentPodcastId, broadcastMode, streamDuration]);

  // Track engagement metrics in real-time
  useEffect(() => {
    if (isLive) {
      const engagementInterval = setInterval(() => {
        // Simulate engagement metrics
        setEngagementData(prev => ({
          likes: prev.likes + Math.floor(Math.random() * 3),
          comments: prev.comments,
          shares: prev.shares + (Math.random() > 0.9 ? 1 : 0),
          avgWatchTime: streamDuration * 0.7,
          peakMoment: streamDuration > 300 ? Math.floor(streamDuration / 2) : null,
          dropOffPoints: prev.dropOffPoints
        }));

        // Simulate real-time feedback
        if (Math.random() > 0.85) {
          const feedbackTypes = [
            { emoji: '🔥', text: 'This is fire!', sentiment: 'positive' },
            { emoji: '💯', text: 'Amazing content', sentiment: 'positive' },
            { emoji: '🙏', text: 'Thank you for this', sentiment: 'positive' },
            { emoji: '❤️', text: 'Love this topic', sentiment: 'positive' },
            { emoji: '👏', text: 'Great insights', sentiment: 'positive' },
            { emoji: '🤔', text: 'Interesting perspective', sentiment: 'neutral' },
          ];
          const feedback = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
          setRealtimeFeedback(prev => [
            { ...feedback, timestamp: Date.now() },
            ...prev.slice(0, 9)
          ]);
        }
      }, 8000);

      return () => clearInterval(engagementInterval);
    }
  }, [isLive, streamDuration]);

  const performAutoSave = async () => {
    if (!currentPodcastId) return;

    setIsAutoSaving(true);
    setAutoSaveStatus('saving');

    try {
      // Create backup of current chunks
      const chunks = broadcastMode === 'video' ? recordedChunksRef.current : audioChunksRef.current;

      if (chunks.length === 0) {
        console.log('No chunks to auto-save yet');
        setAutoSaveStatus('idle');
        setIsAutoSaving(false);
        return;
      }

      const blob = broadcastMode === 'video'
        ? new Blob(chunks, { type: 'video/webm' })
        : new Blob(chunks, { type: 'audio/webm' });

      const file = new File(
        [blob],
        `autosave_${currentPodcastId}_${Date.now()}.webm`,
        { type: broadcastMode === 'video' ? 'video/webm' : 'audio/webm' }
      );

      setAutoSaveProgress(30);

      // Upload backup
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setAutoSaveProgress(70);

      // Update podcast with backup URL
      const updateData = broadcastMode === 'video'
        ? { video_url: file_url, duration: Math.floor(streamDuration) }
        : { audio_url: file_url, duration: Math.floor(streamDuration) };

      await updatePodcastMutation.mutateAsync({
        id: currentPodcastId,
        data: updateData
      });

      setAutoSaveProgress(100);
      setLastAutoSave(new Date());
      setAutoSaveStatus('success');

      console.log('Auto-save successful at', new Date().toLocaleTimeString());

      setTimeout(() => {
        setAutoSaveStatus('idle');
        setAutoSaveProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');

      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 5000);
    } finally {
      setIsAutoSaving(false);
    }
  };

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
      setBroadcastMode('video');
    } catch (error) {
      alert('Error accessing camera/microphone: ' + error.message);
      setConnectionStatus('error');
    }
  };

  const startAudioOnly = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      });
      streamRef.current = stream;
      setMicOn(true);
      setConnectionStatus('connected');

      console.log('Audio-only stream started (no video)');
    } catch (error) {
      alert('Error accessing microphone: ' + error.message);
      setConnectionStatus('error');
    }
  };

  const stopMedia = () => {
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
      alert('Please start the camera or audio first');
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
      if (broadcastMode === 'video') {
        // Video recording (video + audio)
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

        mediaRecorder.start(1000);
        mediaRecorderRef.current = mediaRecorder;
        console.log('Video recording started (video + audio)');
      } else {
        // Audio-only recording (NO VIDEO)
        audioChunksRef.current = [];
        const options = {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 192000 // High quality audio
        };

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/webm';
        }

        const audioRecorder = new MediaRecorder(streamRef.current, options);

        audioRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        audioRecorder.start(1000);
        audioRecorderRef.current = audioRecorder;
        console.log('Audio-only recording started (no video track)');
      }

      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error starting recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (broadcastMode === 'video' && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          console.log('Video recording stopped, total chunks:', recordedChunksRef.current.length);
          setIsRecording(false);
          resolve();
        };
        mediaRecorderRef.current.stop();
      } else if (broadcastMode === 'audio' && audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        audioRecorderRef.current.onstop = () => {
          console.log('Audio recording stopped, total chunks:', audioChunksRef.current.length);
          setIsRecording(false);
          resolve();
        };
        audioRecorderRef.current.stop();
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
      console.log('No recorded video chunks to upload');
      return null;
    }

    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `podcast_video_${currentPodcastId}_${Date.now()}.webm`, { type: 'video/webm' });

      console.log('Uploading video file, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('Video uploaded successfully:', file_url);
      return file_url;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  };

  const uploadRecordedAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log('No recorded audio chunks to upload');
      return null;
    }

    try {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], `podcast_audio_${currentPodcastId}_${Date.now()}.webm`, { type: 'audio/webm' });

      console.log('Uploading AUDIO-ONLY file, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('Audio uploaded successfully:', file_url);
      return file_url;
    } catch (error) {
      console.error('Error uploading audio:', error);
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

  const generateAudioThumbnail = async () => {
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional podcast cover art for audio podcast.
        Beautiful gradient background with warm sunset colors (orange, amber, golden).
        Elegant typography displaying: "${podcastInfo.title}"
        Microphone icon, sound waves, audio waveform elements.
        Host: ${podcastInfo.host_name}
        Modern, artistic design. Square format 1:1 ratio for podcast cover.
        Professional, clean, high-quality podcast artwork.`
      });
      return result.url;
    } catch (error) {
      console.error('Error generating audio thumbnail:', error);
      return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800';
    }
  };

  const goLive = async () => {
    if (!podcastInfo.title.trim()) {
      alert('Please enter a podcast title in the Podcast Information section below');
      return;
    }

    if (!micOn) {
      alert(`Please turn on your ${broadcastMode === 'video' ? 'camera' : 'microphone'} first`);
      return;
    }

    let thumbnailUrl = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800';

    if (broadcastMode === 'video' && cameraOn) {
      // Capture video thumbnail
      const thumbnailBlob = await captureVideoThumbnail();
      if (thumbnailBlob) {
        const uploadedThumbnail = await uploadThumbnail(thumbnailBlob);
        if (uploadedThumbnail) {
          thumbnailUrl = uploadedThumbnail;
        }
      }
    } else {
      // Generate AI audio cover art
      thumbnailUrl = await generateAudioThumbnail();
    }

    const podcastData = {
      ...podcastInfo,
      content_type: broadcastMode === 'video' ? 'video' : 'audio',
      is_live: true,
      published_date: new Date().toISOString(),
      plays: 0,
      image_url: thumbnailUrl,
      video_thumbnail_url: broadcastMode === 'video' ? thumbnailUrl : null,
      duration: 0,
      publish_status: 'published'
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
    setIsSavingMedia(true);

    // Stop auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    // Stop heartbeat immediately
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Stop recording
    await stopRecording();

    // Upload the recorded media
    let mediaUrl = null;
    let thumbnailUrl = null;

    try {
      if (broadcastMode === 'video') {
        console.log('Uploading VIDEO podcast recording...');
        mediaUrl = await uploadRecordedVideo();
        const thumbnailBlob = await captureVideoThumbnail();
        if (thumbnailBlob) {
          thumbnailUrl = await uploadThumbnail(thumbnailBlob);
        }
      } else {
        console.log('Uploading AUDIO-ONLY podcast recording...');
        mediaUrl = await uploadRecordedAudio();
        thumbnailUrl = await generateAudioThumbnail();
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
      alert('Warning: Media upload failed. Podcast will be saved without media file.');
    }

    if (currentPodcastId) {
      const updateData = {
        is_live: false,
        duration: Math.floor(streamDuration),
        plays: peakListeners
      };

      if (broadcastMode === 'video' && mediaUrl) {
        updateData.video_url = mediaUrl;
        updateData.content_type = 'video';
        if (thumbnailUrl) {
          updateData.video_thumbnail_url = thumbnailUrl;
          updateData.image_url = thumbnailUrl;
        }
      } else if (broadcastMode === 'audio' && mediaUrl) {
        updateData.audio_url = mediaUrl;
        updateData.content_type = 'audio';
        updateData.video_url = null; // Ensure no video URL for audio podcasts
        if (thumbnailUrl) {
          updateData.image_url = thumbnailUrl;
        }
      }

      await updatePodcastMutation.mutateAsync({
        id: currentPodcastId,
        data: updateData
      });
    }

    setIsLive(false);
    setIsRecording(false);
    stopMedia();
    setStreamStartTime(null);
    setStreamDuration(0);
    setListenerCount(0);
    setPeakListeners(0);
    setTeleprompterPlaying(false);
    setCurrentPodcastId(null);
    setIsSavingMedia(false);
    setLastAutoSave(null);
    setAutoSaveProgress(0);
    setAutoSaveStatus('idle');
    recordedChunksRef.current = [];
    audioChunksRef.current = [];
    setCoHosts([]); // Clear co-hosts on stream end
    setEngagementData({ likes: 0, comments: [], shares: 0, avgWatchTime: 0, peakMoment: null, dropOffPoints: [] });
    setRealtimeFeedback([]);


    setPodcastInfo({
      title: '',
      description: '',
      category: 'Discussion',
      episode_number: 1,
      season: 1,
      host_name: user?.full_name || ''
    });

    const fileType = broadcastMode === 'video' ? 'video' : 'audio-only';
    alert(`✅ Live podcast ended and ${fileType} saved successfully!\n\n${broadcastMode === 'audio' ? '🎵 This is a pure AUDIO file with cover art.\n📥 Download it from the Podcasts page.' : ''}`);
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

  const addCoHost = async () => {
    if (!coHostEmail.trim()) return;

    setAddingCoHost(true);
    try {
      // Find user by email
      const users = await base44.entities.User.filter({ email: coHostEmail });
      const coHostUser = users[0];

      if (!coHostUser) {
        alert('User not found with this email');
        return;
      }

      if (coHosts.find(h => h.id === coHostUser.id)) {
        alert('This user is already a co-host');
        return;
      }

      setCoHosts(prev => [...prev, {
        id: coHostUser.id,
        name: coHostUser.full_name,
        email: coHostUser.email,
        role: 'co-host',
        joinedAt: new Date()
      }]);

      setCoHostEmail('');
      setShowCoHostDialog(false);
      
      alert(`✅ ${coHostUser.full_name} added as co-host!`);
    } catch (error) {
      alert('Error adding co-host: ' + error.message);
    } finally {
      setAddingCoHost(false);
    }
  };

  const removeCoHost = (hostId) => {
    if (confirm('Remove this co-host?')) {
      setCoHosts(prev => prev.filter(h => h.id !== hostId));
    }
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
                Recording {broadcastMode === 'video' ? 'Video' : 'Audio'}
              </Badge>
            )}
            {/* Auto-save status indicator */}
            {isRecording && autoSaveEnabled && (
              <Badge className={
                autoSaveStatus === 'saving' ? "bg-amber-500" :
                autoSaveStatus === 'success' ? "bg-green-500" :
                autoSaveStatus === 'error' ? "bg-red-500" : "bg-slate-600"
              }>
                {autoSaveStatus === 'saving' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                {autoSaveStatus === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                {autoSaveStatus === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                {autoSaveStatus === 'saving' ? 'Auto-saving...' :
                 autoSaveStatus === 'success' ? 'Auto-saved' :
                 autoSaveStatus === 'error' ? 'Auto-save failed' :
                 lastAutoSave ? `Last save: ${format(lastAutoSave, 'HH:mm')}` : 'Auto-save active'}
              </Badge>
            )}
            <h2 className="text-3xl font-black text-white">Live Podcast Studio</h2>
          </div>
          <p className="text-slate-400 font-semibold">Professional live podcast streaming with video or audio recording</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Video/Audio + Teleprompter Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Broadcast Mode Selector */}
          {!isLive && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <CardTitle className="text-white font-bold text-base">Select Broadcast Mode</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setBroadcastMode('video');
                      if (micOn || cameraOn) stopMedia();
                    }}
                    disabled={cameraOn || micOn}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      broadcastMode === 'video'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    } ${(cameraOn || micOn) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Video className={`w-12 h-12 mx-auto mb-3 ${broadcastMode === 'video' ? 'text-purple-400' : 'text-slate-400'}`} />
                    <h3 className={`font-bold mb-1 ${broadcastMode === 'video' ? 'text-white' : 'text-slate-400'}`}>
                      Video Podcast
                    </h3>
                    <p className="text-xs text-slate-500">Camera + Microphone</p>
                    <p className="text-xs text-purple-400 mt-2">Saves as: Video file (.webm)</p>
                  </button>
                  <button
                    onClick={() => {
                      setBroadcastMode('audio');
                      if (cameraOn || micOn) stopMedia();
                    }}
                    disabled={cameraOn || micOn}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      broadcastMode === 'audio'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    } ${(cameraOn || micOn) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Mic2 className={`w-12 h-12 mx-auto mb-3 ${broadcastMode === 'audio' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <h3 className={`font-bold mb-1 ${broadcastMode === 'audio' ? 'text-white' : 'text-slate-400'}`}>
                      Audio Podcast
                    </h3>
                    <p className="text-xs text-slate-500">Microphone Only</p>
                    <p className="text-xs text-cyan-400 mt-2">Saves as: Audio file (.webm) + Cover Art</p>
                  </button>
                </div>
                {(cameraOn || micOn) && (
                  <div className="mt-3 p-2 bg-amber-900/20 border border-amber-500/30 rounded text-center">
                    <p className="text-amber-300 text-xs">Stop current stream to change mode</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video/Audio Preview */}
          <Card className="bg-[#1a1f3a] border-0">
            <div className="relative aspect-video bg-black">
              {broadcastMode === 'video' ? (
                <>
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
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="text-center">
                    {micOn ? (
                      <>
                        <div className="relative">
                          <Music className="w-24 h-24 text-cyan-400 mx-auto mb-4" />
                          {isLive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-32 h-32 border-4 border-cyan-400 rounded-full animate-ping opacity-20"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-white font-bold text-xl mb-2">Audio Podcast</p>
                        <p className="text-slate-400">Microphone Active</p>
                      </>
                    ) : (
                      <>
                        <MicOff className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 font-semibold">Microphone Off</p>
                      </>
                    )}
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

                  {/* Auto-save progress indicator */}
                  {isAutoSaving && (
                    <div className="absolute top-14 right-4 z-10">
                      <Card className="bg-amber-500/90 backdrop-blur-sm border-0 shadow-xl">
                        <CardContent className="p-2 flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 text-white animate-spin" />
                          <span className="text-white text-xs font-bold">Auto-saving... {autoSaveProgress}%</span>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge className="bg-black/80 backdrop-blur-sm border-0 shadow-xl">
                      <Timer className="w-3 h-3 mr-1" />
                      {formatDuration(streamDuration)}
                    </Badge>
                    {isRecording && (
                      <Badge className="bg-red-600/80 backdrop-blur-sm border-0 shadow-xl animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-white mr-2" />
                        REC {broadcastMode === 'video' ? 'VIDEO' : 'AUDIO'}
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
                  {broadcastMode === 'video' ? (
                    <Button
                      size="sm"
                      onClick={cameraOn ? stopMedia : startCamera}
                      disabled={isLive}
                      className={cameraOn ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"}
                    >
                      {cameraOn ? <Video className="w-4 h-4 mr-1" /> : <VideoOff className="w-4 h-4 mr-1" />}
                      Camera
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={micOn ? stopMedia : startAudioOnly}
                      disabled={isLive}
                      className={micOn ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"}
                    >
                      {micOn ? <Mic className="w-4 h-4 mr-1" /> : <MicOff className="w-4 h-4 mr-1" />}
                      Microphone
                    </Button>
                  )}

                  {broadcastMode === 'video' && (
                    <Button
                      size="sm"
                      onClick={toggleMicrophone}
                      disabled={!cameraOn}
                      className={micOn ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"}
                    >
                      {micOn ? <Mic className="w-4 h-4 mr-1" /> : <MicOff className="w-4 h-4 mr-1" />}
                      Mic
                    </Button>
                  )}

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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-black text-base px-8"
                    >
                      <Mic2 className="w-5 h-5 mr-2" />
                      GO LIVE
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={endPodcast}
                      disabled={isSavingMedia}
                      variant="destructive"
                      className="font-black text-base px-8"
                    >
                      {isSavingMedia ? (
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

          {/* Co-hosting & Analytics Panel */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Co-Hosts */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Co-Hosts ({coHosts.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowCoHostDialog(true)}
                    disabled={isLive}
                    className="bg-cyan-500 hover:bg-cyan-600 h-7 px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-48 overflow-y-auto">
                {coHosts.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs">No co-hosts added</p>
                  </div>
                ) : (
                  coHosts.map((host) => (
                    <div key={host.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded">
                      <div>
                        <p className="text-white text-sm font-semibold">{host.name}</p>
                        <p className="text-slate-400 text-xs">{host.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCoHost(host.id)}
                        disabled={isLive}
                        className="text-red-400 hover:text-red-300 h-6 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Real-time Analytics */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    Live Analytics
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="bg-green-500 hover:bg-green-600 h-7 px-2"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-900/30 rounded">
                    <p className="text-slate-400 mb-1">Engagement</p>
                    <p className="text-white font-bold">
                      {isLive ? Math.floor((engagementData.likes / Math.max(listenerCount, 1)) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-2 bg-slate-900/30 rounded">
                    <p className="text-slate-400 mb-1">Likes</p>
                    <p className="text-green-400 font-bold">{engagementData.likes}</p>
                  </div>
                  <div className="p-2 bg-slate-900/30 rounded">
                    <p className="text-slate-400 mb-1">Shares</p>
                    <p className="text-cyan-400 font-bold">{engagementData.shares}</p>
                  </div>
                  <div className="p-2 bg-slate-900/30 rounded">
                    <p className="text-slate-400 mb-1">Avg Time</p>
                    <p className="text-purple-400 font-bold">
                      {Math.floor(engagementData.avgWatchTime / 60)}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Feedback Stream */}
          {showAnalytics && isLive && (
            <Card className="bg-[#1a1f3a] border-green-500/30">
              <CardHeader className="border-b border-slate-700 py-3 px-4">
                <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  Real-time Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {realtimeFeedback.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs">Waiting for feedback...</p>
                  </div>
                ) : (
                  realtimeFeedback.map((feedback, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-900/30 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{feedback.emoji}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm">{feedback.text}</p>
                          <p className="text-slate-500 text-xs">
                            {Math.floor((Date.now() - feedback.timestamp) / 1000)}s ago
                          </p>
                        </div>
                        <Badge className={
                          feedback.sentiment === 'positive' ? 'bg-green-500' :
                          feedback.sentiment === 'neutral' ? 'bg-slate-500' : 'bg-amber-500'
                        }>
                          {feedback.sentiment}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
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
                    <span className="text-slate-400 text-xs font-semibold">Mode</span>
                    <Badge className={broadcastMode === 'video' ? "bg-purple-600" : "bg-cyan-600"}>
                      {broadcastMode === 'video' ? 'Video' : 'Audio'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-semibold">Recording</span>
                    <Badge className={isRecording ? "bg-red-600" : "bg-slate-600"}>
                      {isRecording ? 'Active' : 'Stopped'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Save Status Card */}
              {isRecording && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="border-b border-slate-700 py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-bold text-sm">Auto-Save</CardTitle>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoSaveEnabled}
                          onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-xs text-slate-400">On</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-semibold">Status</span>
                      <Badge className={
                        autoSaveStatus === 'saving' ? "bg-amber-500" :
                        autoSaveStatus === 'success' ? "bg-green-500" :
                        autoSaveStatus === 'error' ? "bg-red-500" : "bg-cyan-600"
                      }>
                        {autoSaveStatus === 'saving' ? 'Saving...' :
                         autoSaveStatus === 'success' ? 'Saved' :
                         autoSaveStatus === 'error' ? 'Failed' : 'Active'}
                      </Badge>
                    </div>
                    {lastAutoSave && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-semibold">Last Save</span>
                        <span className="text-xs text-cyan-400 font-bold">
                          {format(lastAutoSave, 'HH:mm:ss')}
                        </span>
                      </div>
                    )}
                    {isAutoSaving && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                            style={{ width: `${autoSaveProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-amber-300 text-center">{autoSaveProgress}%</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 text-center pt-1">
                      Auto-saves every 5 minutes
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* System Status */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="border-b border-slate-700 py-2 px-3">
                  <CardTitle className="text-white font-bold text-sm">System</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {broadcastMode === 'video' && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-semibold">Camera</span>
                      <Badge className={cameraOn ? "bg-green-600 text-xs" : "bg-slate-600 text-xs"}>
                        {cameraOn ? 'On' : 'Off'}
                      </Badge>
                    </div>
                  )}
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

      {/* Co-Host Dialog */}
      <Dialog open={showCoHostDialog} onOpenChange={setShowCoHostDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Add Co-Host
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Co-Host Email</Label>
              <Input
                type="email"
                placeholder="cohost@example.com"
                value={coHostEmail}
                onChange={(e) => setCoHostEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-slate-400 text-xs mt-2">
                Enter the email of a registered user to add as co-host
              </p>
            </div>

            <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <h4 className="text-cyan-300 font-bold text-sm mb-2">Co-Host Permissions:</h4>
              <ul className="text-cyan-200 text-xs space-y-1">
                <li>✓ Control microphone/camera</li>
                <li>✓ Manage teleprompter</li>
                <li>✓ View live analytics</li>
                <li>✓ Interact with chat</li>
                <li>✗ End the stream (host only)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCoHostDialog(false);
                setCoHostEmail('');
              }}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={addCoHost}
              disabled={addingCoHost || !coHostEmail.trim()}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {addingCoHost ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Adding...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Add Co-Host</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
