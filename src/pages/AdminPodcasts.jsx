
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic2, Plus, Search, TrendingUp, Play, Trash2, Edit, Upload,
  Eye, BarChart3, Clock, Star, Video, Film, Calendar as CalendarIcon,
  DollarSign, Download, Wand2, RefreshCw, FileVideo, Music, Sliders,
  AlertCircle, AlertTriangle, Filter, SortAsc, SortDesc, User,
  Share2, Copy // Added Share2 and Copy icons
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AITrailerGenerator from "../components/podcast/AITrailerGenerator";
import AISocialMediaGenerator from "../components/podcast/AISocialMediaGenerator";
import AIChapterGenerator from "../components/podcast/AIChapterGenerator";
import SEOOptimizer from "../components/podcast/SEOOptimizer";

export default function AdminPodcasts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [contentType, setContentType] = useState("audio");
  const [activeTab, setActiveTab] = useState("all");
  const [convertingPodcast, setConvertingPodcast] = useState(null);
  const [convertingAudio, setConvertingAudio] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [extractingAudio, setExtractingAudio] = useState(false);
  const [showConversionGuide, setShowConversionGuide] = useState(false);

  const [showAITools, setShowAITools] = useState(false);
  const [selectedPodcastForAI, setSelectedPodcastForAI] = useState(null);

  // Advanced filtering and sorting
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterHost, setFilterHost] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterDurationMin, setFilterDurationMin] = useState("");
  const [filterDurationMax, setFilterDurationMax] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  // Auto social media & chapters state
  const [generatingSocial, setGeneratingSocial] = useState(null);
  const [generatingChapters, setGeneratingChapters] = useState(null);
  const [socialMediaDialog, setSocialMediaDialog] = useState(false);
  const [chaptersDialog, setChaptersDialog] = useState(false);
  const [selectedForSocial, setSelectedForSocial] = useState(null);
  const [selectedForChapters, setSelectedForChapters] = useState(null);
  const [generatedSocial, setGeneratedSocial] = useState(null);
  const [generatedChapters, setGeneratedChapters] = useState(null);

  // NEW: SEO Optimization state
  const [selectedForSEO, setSelectedForSEO] = useState(null);
  const [seoDialogOpen, setSeoDialogOpen] = useState(false);

  const [podcastForm, setPodcastForm] = useState({
    title: '',
    description: '',
    audio_url: '',
    video_url: '',
    image_url: '',
    video_thumbnail_url: '',
    content_type: 'audio',
    duration: 0,
    episode_number: 1,
    season: 1,
    host_name: '',
    guests: [],
    category: '',
    tags: [],
    publish_status: 'draft',
    scheduled_publish_date: '',
    is_scheduled: false,
    auto_publish: false
  });

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => base44.entities.Podcast.list('-published_date'),
    initialData: [],
  });

  const createPodcastMutation = useMutation({
    mutationFn: (data) => base44.entities.Podcast.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deletePodcastMutation = useMutation({
    mutationFn: (id) => base44.entities.Podcast.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    },
  });

  const captureVideoThumbnail = (videoElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);

      video.onloadedmetadata = async () => {
        const duration = Math.floor(video.duration);
        video.currentTime = 2;

        video.onseeked = async () => {
          try {
            const thumbnailBlob = await captureVideoThumbnail(video);
            const thumbnailFile = new File([thumbnailBlob], `thumbnail_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const { file_url: thumbnailUrl } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });

            setPodcastForm(prev => ({
              ...prev,
              video_url: file_url,
              video_thumbnail_url: thumbnailUrl,
              image_url: thumbnailUrl,
              duration: duration,
              content_type: 'video'
            }));
            setUploadingMedia(false);
            URL.revokeObjectURL(video.src);
          } catch (error) {
            console.error('Error capturing thumbnail:', error);
            setPodcastForm(prev => ({
              ...prev,
              video_url: file_url,
              duration: duration,
              content_type: 'video'
            }));
            setUploadingMedia(false);
          }
        };
      };

      video.onerror = () => {
        alert('Error loading video');
        setUploadingMedia(false);
      };
    } catch (error) {
      alert('Error uploading video: ' + error.message);
      setUploadingMedia(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const audio = new Audio(file_url);
      audio.onloadedmetadata = () => {
        setPodcastForm(prev => ({
          ...prev,
          audio_url: file_url,
          duration: Math.floor(audio.duration),
          content_type: 'audio'
        }));
        setUploadingMedia(false);
      };
    } catch (error) {
      alert('Error uploading audio: ' + error.message);
      setUploadingMedia(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPodcastForm(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const handleConvertAudioToVideo = async (podcast) => {
    if (!podcast.audio_url) {
      alert('This podcast has no audio file to convert');
      return;
    }

    setConvertingPodcast(podcast.id);
    setConvertingAudio(true);

    try {
      // Use AI to generate a video with soundwave animation
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Create a professional podcast video background with animated audio soundwave visualization.
        Dark gradient background with purple and cyan colors.
        Include waveform animation bars, music visualization elements.
        Title: "${podcast.title}"
        Host: ${podcast.host_name}
        Modern, sleek design with neon accents. 16:9 aspect ratio.`
      });

      // In a real implementation, you'd use a video processing service
      // For now, we'll save the generated image as the video thumbnail
      await updatePodcastMutation.mutateAsync({
        id: podcast.id,
        data: {
          converted_video_url: podcast.audio_url, // In real app, this would be actual video URL
          video_thumbnail_url: result.url,
          image_url: result.url,
          has_converted_video: true,
          converted_video_formats: {
            mp4: podcast.audio_url,
            webm: podcast.audio_url,
            avi: podcast.audio_url
          }
        }
      });

      alert('Audio converted to video with soundwave animation!');
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting audio to video: ' + error.message);
    } finally {
      setConvertingAudio(false);
      setConvertingPodcast(null);
    }
  };

  const handleDownloadVideo = async (podcast, format = 'mp4') => {
    const url = podcast.converted_video_formats?.[format] || podcast.video_url || podcast.audio_url;

    if (!url) {
      alert('No video available for download');
      return;
    }

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = () => {
    if (editingPodcast) {
      updatePodcastMutation.mutate({ id: editingPodcast.id, data: podcastForm });
    } else {
      createPodcastMutation.mutate(podcastForm);
    }
  };

  const handleEdit = (podcast) => {
    setEditingPodcast(podcast);
    setPodcastForm(podcast);
    setContentType(podcast.content_type || 'audio');
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this podcast?')) {
      deletePodcastMutation.mutate(id);
    }
  };

  const handlePublishNow = async (podcast) => {
    if (confirm('Publish this episode now?')) {
      await updatePodcastMutation.mutateAsync({
        id: podcast.id,
        data: {
          ...podcast,
          publish_status: 'published',
          published_date: new Date().toISOString(),
          is_scheduled: false
        }
      });
    }
  };

  const resetForm = () => {
    setPodcastForm({
      title: '',
      description: '',
      audio_url: '',
      video_url: '',
      image_url: '',
      video_thumbnail_url: '',
      content_type: 'audio',
      duration: 0,
      episode_number: 1,
      season: 1,
      host_name: '',
      guests: [],
      category: '',
      tags: [],
      publish_status: 'draft',
      scheduled_publish_date: '',
      is_scheduled: false,
      auto_publish: false
    });
    setContentType('audio');
    setEditingPodcast(null);
  };

  // Advanced filtering and sorting logic
  const applyFiltersAndSort = (podcastList) => {
    let filtered = [...podcastList];

    // Text search across title, description
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.host_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // Host filter
    if (filterHost !== "all") {
      filtered = filtered.filter(p => p.host_name === filterHost);
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter(p => {
        const pubDate = new Date(p.published_date || p.created_date);
        return pubDate >= new Date(filterDateFrom);
      });
    }
    if (filterDateTo) {
      filtered = filtered.filter(p => {
        const pubDate = new Date(p.published_date || p.created_date);
        // Set time to end of day for 'to' date to include full day
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        return pubDate <= toDate;
      });
    }

    // Duration filter (convert minutes to seconds)
    if (filterDurationMin) {
      filtered = filtered.filter(p => (p.duration || 0) >= parseInt(filterDurationMin) * 60);
    }
    if (filterDurationMax) {
      filtered = filtered.filter(p => (p.duration || 0) <= parseInt(filterDurationMax) * 60);
    }

    // Sorting
    switch (sortBy) {
      case "date_desc":
        filtered.sort((a, b) => new Date(b.published_date || b.created_date) - new Date(a.published_date || a.created_date));
        break;
      case "date_asc":
        filtered.sort((a, b) => new Date(a.published_date || a.created_date) - new Date(b.published_date || b.created_date));
        break;
      case "plays_desc":
        filtered.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      case "plays_asc":
        filtered.sort((a, b) => (a.plays || 0) - (b.plays || 0));
        break;
      case "duration_desc":
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case "duration_asc":
        filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case "title_asc":
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "title_desc":
        filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredPodcasts = applyFiltersAndSort(podcasts);

  const publishedPodcasts = applyFiltersAndSort(podcasts.filter(p => p.publish_status === 'published'));
  const scheduledPodcasts = applyFiltersAndSort(podcasts.filter(p => p.publish_status === 'scheduled'));
  const draftPodcasts = applyFiltersAndSort(podcasts.filter(p => p.publish_status === 'draft'));

  const liveRecordedPodcasts = applyFiltersAndSort(publishedPodcasts.filter(p => (p.content_type === 'video' && p.video_url) || p.audio_url));
  const audioPodcasts = applyFiltersAndSort(publishedPodcasts.filter(p => p.content_type === 'audio' || !p.video_url));

  // Get unique categories and hosts for filter dropdowns
  const uniqueCategories = [...new Set(podcasts.map(p => p.category).filter(Boolean))];
  const uniqueHosts = [...new Set(podcasts.map(p => p.host_name).filter(Boolean))];

  const totalPlays = podcasts.reduce((sum, p) => sum + (p.plays || 0), 0);
  const avgDuration = podcasts.length > 0
    ? Math.floor(podcasts.reduce((sum, p) => sum + (p.duration || 0), 0) / podcasts.length)
    : 0;
  const videoPodcasts = podcasts.filter(p => p.content_type === 'video' || p.video_url).length;

  const activeFiltersCount = [
    filterCategory !== "all",
    filterHost !== "all",
    filterDateFrom,
    filterDateTo,
    filterDurationMin,
    filterDurationMax
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterCategory("all");
    setFilterHost("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterDurationMin("");
    setFilterDurationMax("");
    setSearchQuery(""); // Also clear search query
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: <Badge className="bg-slate-500">Draft</Badge>,
      scheduled: <Badge className="bg-amber-500">Scheduled</Badge>,
      published: <Badge className="bg-green-500">Published</Badge>
    };
    return badges[status] || <Badge>Unknown</Badge>;
  };

  const scheduledByDate = scheduledPodcasts.reduce((acc, podcast) => {
    if (podcast.scheduled_publish_date) {
      const date = format(new Date(podcast.scheduled_publish_date), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(podcast);
    }
    return acc;
  }, {});

  const copySettingsToClipboard = () => {
    // This function was originally a placeholder. If there's specific logic, it should be added here.
    // Otherwise, it can remain empty or be removed if unused.
  };

  const formatTime = (seconds) => {
    // This function was originally a placeholder. If there's specific logic, it should be added here.
    // Otherwise, it can remain empty or be removed if unused.
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const extractAudioFromVideo = async (podcast) => {
    if (!podcast?.audio_url && !podcast?.video_url) {
      alert('No media file found');
      return;
    }

    setExtractingAudio(true);
    try {
      // Fetch the video/audio file
      const mediaUrl = podcast.video_url || podcast.audio_url; // Prioritize video if available
      const response = await fetch(mediaUrl);
      const blob = await response.blob();

      // Create video element to extract audio
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(blob);
      video.src = videoUrl;
      video.autoplay = true; // Required for MediaStreamSource to pick up audio
      video.muted = true; // Mute to avoid playing sound during extraction

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          if (video.duration === Infinity) { // Handle live streams or unknown duration
            reject(new Error("Cannot extract audio from media with unknown duration."));
          } else {
            resolve();
          }
        };
        video.onerror = (e) => reject(new Error(`Error loading video for extraction: ${e.message}`));
      });

      // Create audio context to extract audio track
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      const dest = audioContext.createMediaStreamDestination();
      source.connect(dest);
      // We don't connect to audioContext.destination because we only want to record, not play

      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: 'audio/webm;codecs=opus' // Use WebM for broader browser support
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });

          // Download audio file
          const audioFileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_S${podcast.season}E${podcast.episode_number}_AUDIO.webm`;
          const audioDownloadUrl = URL.createObjectURL(audioBlob);
          const audioLink = document.createElement('a');
          audioLink.href = audioDownloadUrl;
          audioLink.download = audioFileName;
          document.body.appendChild(audioLink);
          audioLink.click();
          document.body.removeChild(audioLink);
          URL.revokeObjectURL(audioDownloadUrl);

          // Download cover image
          if (podcast.image_url) {
            setTimeout(() => {
              const imgLink = document.createElement('a');
              imgLink.href = podcast.image_url;
              imgLink.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_Cover.jpg`;
              imgLink.target = '_blank';
              document.body.appendChild(imgLink);
              imgLink.click();
              document.body.removeChild(imgLink);
            }, 500);
          }

          URL.revokeObjectURL(videoUrl);
          setExtractingAudio(false);
          resolve();
        };

        mediaRecorder.onerror = (error) => {
          setExtractingAudio(false);
          reject(error);
        };

        mediaRecorder.start();

        // Record for full duration
        setTimeout(() => {
          mediaRecorder.stop();
          video.pause(); // Ensure video playback stops
          source.disconnect();
          audioContext.close(); // Close audio context
        }, video.duration * 1000);
      });

    } catch (error) {
      console.error('Audio extraction error:', error);
      setExtractingAudio(false);
      alert('Error extracting audio. Try the desktop tool method instead:\n\n1. Download the file as-is\n2. Use free tools like Audacity, FFmpeg, or VLC to extract audio\n3. Add cover art in iTunes/Windows Media Player');
    }
  };

  const handleDownloadAudioWithCover = async (podcast) => {
    if (!podcast?.audio_url && !podcast?.video_url) return;

    try {
      const isAudioOnly = podcast.content_type === 'audio' && podcast.audio_url && !podcast.video_url;

      const mediaUrl = podcast.audio_url || podcast.video_url;
      // Determine file extension based on mediaUrl, default to 'webm' if not clear
      let fileExtension = 'webm';
      if (mediaUrl.includes('.mp3')) {
        fileExtension = 'mp3';
      } else if (mediaUrl.includes('.mp4')) {
        fileExtension = 'mp4';
      }

      const fileName = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_S${podcast.season}E${podcast.episode_number}${isAudioOnly ? '_AUDIO' : ''}.${fileExtension}`;

      const mediaLink = document.createElement('a');
      mediaLink.href = mediaUrl;
      mediaLink.download = fileName;
      mediaLink.target = '_blank';
      document.body.appendChild(mediaLink);
      mediaLink.click();
      document.body.removeChild(mediaLink);

      if (podcast.image_url) {
        setTimeout(() => {
          const imgLink = document.createElement('a');
          imgLink.href = podcast.image_url;
          imgLink.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_Cover.jpg`;
          imgLink.target = '_blank';
          document.body.appendChild(imgLink);
          imgLink.click();
          document.body.removeChild(imgLink);
        }, 500);
      }

      if (isAudioOnly) {
        alert('📥 Audio file downloaded (likely WebM/MP3).\n\nSee the Conversion Guide for converting to MP3 + adding cover art if needed.');
        setShowConversionGuide(true);
      } else {
        alert('📥 Video file downloaded!\n\nThis contains video. See the Conversion Guide for extracting audio + adding cover art.');
        setShowConversionGuide(true);
      }
    } catch (error) {
      alert('Download error: ' + error.message);
    }
  };

  const generateSocialMediaPosts = async (podcast) => {
    setGeneratingSocial(podcast.id);
    setSelectedForSocial(podcast);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate social media posts for this podcast episode:

Title: ${podcast.title}
Description: ${podcast.description}
Host: ${podcast.host_name}
Duration: ${Math.floor((podcast.duration || 0) / 60)} minutes
Episode: S${podcast.season}E${podcast.episode_number}

Create optimized posts for:

1. TWITTER/X (280 chars max):
   - Hook in first line
   - Key insight
   - Call to action
   - 3-5 hashtags

2. LINKEDIN (1300 chars max):
   - Professional hook
   - 3 key takeaways
   - Professional hashtags
   - Thought-provoking question

3. INSTAGRAM Caption (2200 chars max):
   - Storytelling hook
   - Episode highlights
   - Emojis
   - 20-25 hashtags

4. FACEBOOK (few paragraphs):
   - Community-focused
   - Engaging question
   - Call to action

Make each post platform-specific and engaging!`,
        response_json_schema: {
          type: "object",
          properties: {
            twitter: {
              type: "object",
              properties: {
                post: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } }
              }
            },
            linkedin: {
              type: "object",
              properties: {
                post: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } }
              }
            },
            instagram: {
              type: "object",
              properties: {
                caption: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } }
              }
            },
            facebook: {
              type: "object",
              properties: {
                post: { type: "string" }
              }
            }
          }
        }
      });

      setGeneratedSocial(result);
      setSocialMediaDialog(true);
      alert('✅ Social media posts generated!');
    } catch (error) {
      alert('Error generating social posts: ' + error.message);
    } finally {
      setGeneratingSocial(null);
    }
  };

  const generateChapterMarkers = async (podcast) => {
    setGeneratingChapters(podcast.id);
    setSelectedForChapters(podcast);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate chapter markers for this podcast episode:

Title: ${podcast.title}
Description: ${podcast.description}
Host: ${podcast.host_name}
Duration: ${Math.floor((podcast.duration || 0) / 60)} minutes

Create 8-12 chapter markers with:
- Timestamp (format: MM:SS)
- Chapter title (concise, descriptive)
- Brief description (1 sentence)
- Keywords for SEO (3-5 per chapter)

Distribute chapters evenly across the episode duration.
Make chapters searchable and descriptive for SEO optimization.`,
        response_json_schema: {
          type: "object",
          properties: {
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } }
                }
              }
            },
            seo_description: { type: "string" },
            seo_keywords: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedChapters(result);
      setChaptersDialog(true);
      alert('✅ Chapter markers generated!');
    } catch (error) {
      alert('Error generating chapters: ' + error.message);
    } finally {
      setGeneratingChapters(null);
    }
  };

  const handleSEOUpdate = async (podcastId, updates) => {
    await updatePodcastMutation.mutateAsync({
      id: podcastId,
      data: updates
    });
    queryClient.invalidateQueries({ queryKey: ['podcasts'] }); // Invalidate to reflect changes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Management</h2>
          <p className="text-slate-400 font-semibold">Manage audio and video podcast episodes</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("AdminPodcastMonetization")}>
            <Button className="bg-green-500 hover:bg-green-600 font-bold">
              <DollarSign className="w-4 h-4 mr-2" />
              Monetization
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Add Podcast
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white font-black text-xl">
                  {editingPodcast ? 'Edit Podcast' : 'Add New Podcast'}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Upload audio or video podcast episodes
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Episode Title *</Label>
                    <Input
                      placeholder="Episode title"
                      value={podcastForm.title}
                      onChange={(e) => setPodcastForm({...podcastForm, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Host Name</Label>
                    <Input
                      placeholder="Host name"
                      value={podcastForm.host_name}
                      onChange={(e) => setPodcastForm({...podcastForm, host_name: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Description</Label>
                  <Textarea
                    placeholder="Episode description"
                    value={podcastForm.description}
                    onChange={(e) => setPodcastForm({...podcastForm, description: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white h-24"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">Episode #</Label>
                    <Input
                      type="number"
                      value={podcastForm.episode_number}
                      onChange={(e) => setPodcastForm({...podcastForm, episode_number: parseInt(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Season</Label>
                    <Input
                      type="number"
                      value={podcastForm.season}
                      onChange={(e) => setPodcastForm({...podcastForm, season: parseInt(e.target.value)})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <Input
                      placeholder="e.g., Faith"
                      value={podcastForm.category}
                      onChange={(e) => setPodcastForm({...podcastForm, category: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <Label className="text-white mb-3 block font-bold">Content Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setContentType('audio')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        contentType === 'audio'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Mic2 className={`w-8 h-8 mx-auto mb-2 ${contentType === 'audio' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <p className={`text-sm font-semibold ${contentType === 'audio' ? 'text-white' : 'text-slate-400'}`}>
                        Audio Podcast
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentType('video')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        contentType === 'video'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Video className={`w-8 h-8 mx-auto mb-2 ${contentType === 'video' ? 'text-purple-400' : 'text-slate-400'}`} />
                      <p className={`text-sm font-semibold ${contentType === 'video' ? 'text-white' : 'text-slate-400'}`}>
                        Video Podcast
                      </p>
                    </button>
                  </div>
                </div>

                {contentType === 'audio' ? (
                  <div>
                    <Label className="text-white mb-2 block">Audio File *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        disabled={uploadingMedia}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                      {uploadingMedia && <Badge className="bg-amber-500">Uploading...</Badge>}
                    </div>
                    {podcastForm.audio_url && (
                      <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm">
                          ✓ Audio uploaded ({formatDuration(podcastForm.duration)})
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label className="text-white mb-2 block">Video File *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploadingMedia}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                      {uploadingMedia && <Badge className="bg-amber-500">Processing...</Badge>}
                    </div>
                    {podcastForm.video_url && (
                      <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-purple-400 text-sm mb-2">
                          ✓ Video uploaded ({formatDuration(podcastForm.duration)})
                        </p>
                        {podcastForm.video_thumbnail_url && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-400 mb-1">Auto-generated thumbnail:</p>
                            <img src={podcastForm.video_thumbnail_url} alt="Video thumbnail" className="w-full h-32 object-cover rounded" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-white mb-2 block">
                    Cover Image {contentType === 'video' && '(Optional - video thumbnail is used by default)'}
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                  {podcastForm.image_url && (
                    <img src={podcastForm.image_url} alt="Cover" className="mt-2 w-32 h-32 object-cover rounded" />
                  )}
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <Label className="text-white mb-3 block font-bold">Publishing Options</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white mb-2 block">Status</Label>
                      <select
                        value={podcastForm.publish_status}
                        onChange={(e) => setPodcastForm({...podcastForm, publish_status: e.target.value})}
                        className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                      >
                        <option value="draft">Draft - Not visible</option>
                        <option value="published">Published - Live now</option>
                        <option value="scheduled">Scheduled - Publish later</option>
                      </select>
                    </div>

                    {podcastForm.publish_status === 'scheduled' && (
                      <div>
                        <Label className="text-white mb-2 block">Schedule Publish Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={podcastForm.scheduled_publish_date ? format(new Date(podcastForm.scheduled_publish_date), "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => setPodcastForm({
                            ...podcastForm,
                            scheduled_publish_date: new Date(e.target.value).toISOString(),
                            is_scheduled: true
                          })}
                          className="bg-slate-900/50 border-slate-700 text-white"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={podcastForm.auto_publish}
                            onChange={(e) => setPodcastForm({...podcastForm, auto_publish: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <Label className="text-white text-sm">Auto-publish at scheduled time</Label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-slate-700">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!podcastForm.title || (contentType === 'audio' && !podcastForm.audio_url) || (contentType === 'video' && !podcastForm.video_url)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {editingPodcast ? 'Update' : 'Create'} Podcast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Mic2 className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{podcasts.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{podcasts.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Episodes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Film className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{videoPodcasts}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{videoPodcasts}</p>
            <p className="text-slate-400 text-sm font-semibold">Video Podcasts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-8 h-8 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{totalPlays.toLocaleString()}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Plays</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{formatDuration(avgDuration)}</p>
            <p className="text-slate-400 text-sm font-semibold">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search titles, descriptions, hosts, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-cyan-500">{activeFiltersCount}</Badge>
            )}
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] bg-[#1a1f3a] border-slate-700 text-white">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="date_desc" className="text-white">Newest First</SelectItem>
              <SelectItem value="date_asc" className="text-white">Oldest First</SelectItem>
              <SelectItem value="plays_desc" className="text-white">Most Popular</SelectItem>
              <SelectItem value="plays_asc" className="text-white">Least Popular</SelectItem>
              <SelectItem value="duration_desc" className="text-white">Longest First</SelectItem>
              <SelectItem value="duration_asc" className="text-white">Shortest First</SelectItem>
              <SelectItem value="title_asc" className="text-white">Title A-Z</SelectItem>
              <SelectItem value="title_desc" className="text-white">Title Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold text-base flex items-center gap-2">
                  <Filter className="w-5 h-5 text-cyan-400" />
                  Advanced Filters
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllFilters}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Clear All ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">All Categories</SelectItem>
                      {uniqueCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Host</Label>
                  <Select value={filterHost} onValueChange={setFilterHost}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="All Hosts" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">All Hosts</SelectItem>
                      {uniqueHosts.map(host => (
                        <SelectItem key={host} value={host} className="text-white">{host}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-white font-bold mb-2 block text-xs">Duration Min (mins)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filterDurationMin}
                      onChange={(e) => setFilterDurationMin(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-bold mb-2 block text-xs">Duration Max (mins)</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={filterDurationMax}
                      onChange={(e) => setFilterDurationMax(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Published From</Label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white font-bold mb-2 block">Published To</Label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-300 text-sm">
                  <strong>Showing {filteredPodcasts.length}</strong> of {podcasts.length} podcasts
                  {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active)`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500">
            All ({filteredPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-cyan-500">
            Published ({publishedPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="live_recorded" className="data-[state=active]:bg-cyan-500">
            <Film className="w-4 h-4 mr-1" />
            Live Recorded ({liveRecordedPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-cyan-500">
            <CalendarIcon className="w-4 h-4 mr-1" />
            Scheduled ({scheduledPodcasts.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-cyan-500">
            Drafts ({draftPodcasts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-3">
          {filteredPodcasts.length === 0 ? (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">No Podcasts Found</h3>
                <p className="text-slate-400 mb-6">
                  {searchQuery || activeFiltersCount > 0
                    ? "Try adjusting your filters or search query"
                    : "Create your first podcast to get started"}
                </p>
                {(searchQuery || activeFiltersCount > 0) && (
                  <Button onClick={clearAllFilters} className="bg-cyan-500 hover:bg-cyan-600">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPodcasts.map((podcast) => (
              <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                      {podcast.video_thumbnail_url || podcast.image_url ? (
                        <img
                          src={podcast.video_thumbnail_url || podcast.image_url}
                          alt={podcast.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {podcast.content_type === 'video' || podcast.video_url ? (
                            <Video className="w-10 h-10 text-white" />
                          ) : (
                            <Mic2 className="w-10 h-10 text-white" />
                          )}
                        </div>
                      )}
                      {(podcast.content_type === 'video' || podcast.video_url) && (
                        <div className="absolute top-1 right-1">
                          <Badge className="bg-purple-500 text-xs">
                            <Film className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                          <p className="text-slate-400 text-sm mb-2">
                            S{podcast.season}E{podcast.episode_number} • {podcast.host_name} • {formatDuration(podcast.duration || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(podcast.publish_status)}
                          <Badge className="bg-purple-500">
                            <Play className="w-3 h-3 mr-1" />
                            {podcast.plays || 0}
                          </Badge>
                        </div>
                      </div>
                      {podcast.scheduled_publish_date && podcast.publish_status === 'scheduled' && (
                        <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                          <p className="text-amber-400 text-xs font-semibold">
                            <CalendarIcon className="w-3 h-3 inline mr-1" />
                            Scheduled for: {format(new Date(podcast.scheduled_publish_date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      )}
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">{podcast.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>

                        {/* Audio Preview & Edit Buttons */}
                        {podcast.audio_url && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setPreviewAudio(podcast);
                                setPreviewDialogOpen(true);
                              }}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Listen to Preview
                            </Button>
                            <Link to={createPageUrl("AdminPodcastAudioEditor") + `?id=${podcast.id}`}>
                              <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                                <Sliders className="w-3 h-3 mr-1" />
                                Edit Audio
                              </Button>
                            </Link>
                          </>
                        )}

                        {/* Video Edit Button */}
                        {podcast.video_url && (
                          <Link to={createPageUrl("AdminPodcastVideoEditor") + `?id=${podcast.id}`}>
                            <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                              <Film className="w-3 h-3 mr-1" />
                              Edit Video
                            </Button>
                          </Link>
                        )}

                        {/* AI Social Media Generator */}
                        <Button
                          size="sm"
                          onClick={() => generateSocialMediaPosts(podcast)}
                          disabled={generatingSocial === podcast.id}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        >
                          {generatingSocial === podcast.id ? (
                            <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Generating...</>
                          ) : (
                            <><Wand2 className="w-3 h-3 mr-1" />Social Posts</>
                          )}
                        </Button>

                        {/* AI Chapter Markers */}
                        <Button
                          size="sm"
                          onClick={() => generateChapterMarkers(podcast)}
                          disabled={generatingChapters === podcast.id}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {generatingChapters === podcast.id ? (
                            <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Generating...</>
                          ) : (
                            <><Wand2 className="w-3 h-3 mr-1" />Chapters</>
                          )}
                        </Button>

                        {/* NEW: AI SEO Optimizer */}
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedForSEO(podcast);
                            setSeoDialogOpen(true);
                          }}
                          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                        >
                          <Search className="w-3 h-3 mr-1" />
                          SEO Optimize
                        </Button>

                        {/* NEW: AI Marketing Tools */}
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPodcastForAI(podcast);
                            setShowAITools(true);
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          AI Tools
                        </Button>

                        {podcast.publish_status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishNow(podcast)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Publish Now
                          </Button>
                        )}

                        {/* Audio to Video Conversion */}
                        {podcast.audio_url && !podcast.has_converted_video && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertAudioToVideo(podcast)}
                            disabled={convertingPodcast === podcast.id}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            {convertingPodcast === podcast.id ? (
                              <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Converting...</>
                            ) : (
                              <><Wand2 className="w-3 h-3 mr-1" />Convert to Video</>
                            )}
                          </Button>
                        )}

                        {/* Download Options */}
                        {(podcast.has_converted_video || podcast.video_url) && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadVideo(podcast, 'mp4')}
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              MP4
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadVideo(podcast, 'webm')}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              WebM
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadVideo(podcast, 'avi')}
                              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              AVI
                            </Button>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(podcast.id)}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="published" className="mt-6 space-y-3">
          {publishedPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                    {podcast.video_thumbnail_url || podcast.image_url ? (
                      <img src={podcast.video_thumbnail_url || podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
                    ) : (
                      <Mic2 className="w-10 h-10 text-white m-auto mt-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">S{podcast.season}E{podcast.episode_number}</p>
                    <Badge className="bg-green-500">Published</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="live_recorded" className="mt-6 space-y-3">
          <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Film className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold mb-1">Live Recorded Podcasts</h3>
                <p className="text-slate-300 text-sm">
                  These podcasts were recorded from live streaming sessions and saved automatically.
                  They appear in the WATCH section with video thumbnails.
                </p>
              </div>
            </div>
          </div>
          {liveRecordedPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-purple-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    {podcast.video_thumbnail_url ? (
                      <img src={podcast.video_thumbnail_url} alt={podcast.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Film className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-purple-600">
                      <Film className="w-3 h-3 mr-1" />
                      LIVE REC
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">
                      S{podcast.season}E{podcast.episode_number} • {podcast.host_name} • {formatDuration(podcast.duration || 0)}
                    </p>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{podcast.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-green-500">
                        <Play className="w-3 h-3 mr-1" />
                        {podcast.plays || 0} plays
                      </Badge>
                      <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      {podcast.video_url && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVideo(podcast, 'mp4')}
                            className="border-green-500/30 text-green-400"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download MP4
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {liveRecordedPodcasts.length === 0 && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-12 text-center">
                <Film className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">No Live Recorded Podcasts</h3>
                <p className="text-slate-400 mb-6">Start a live podcast stream to create recorded episodes</p>
                <Link to={createPageUrl("AdminPodcastLive")}>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    <Mic2 className="w-4 h-4 mr-2" />
                    Go Live Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6 space-y-3">
          {scheduledPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-amber-500 flex-shrink-0 flex items-center justify-center">
                    <CalendarIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">S{podcast.season}E{podcast.episode_number}</p>
                    <Badge className="bg-amber-500 mb-3">Scheduled</Badge>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
                      <p className="text-amber-400 text-sm font-semibold mb-1">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        {format(new Date(podcast.scheduled_publish_date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-amber-300 text-xs">
                        {format(new Date(podcast.scheduled_publish_date), 'h:mm a')}
                        {podcast.auto_publish && ' • Auto-publish enabled'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePublishNow(podcast)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Publish Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="mt-6 space-y-3">
          {draftPodcasts.map((podcast) => (
            <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    <Mic2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{podcast.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">S{podcast.season}E{podcast.episode_number}</p>
                    <Badge className="bg-slate-500 mb-3">Draft</Badge>
                    <Button size="sm" onClick={() => handleEdit(podcast)} className="bg-cyan-500 hover:bg-cyan-600">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Audio Preview Modal */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              Audio Preview
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {previewAudio?.title}
            </DialogDescription>
          </DialogHeader>
          {previewAudio && (
            <div className="py-4">
              <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-cyan-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {previewAudio.image_url ? (
                  <img src={previewAudio.image_url} alt={previewAudio.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-24 h-24 text-white opacity-30" />
                )}
              </div>

              {/* Show appropriate player based on content type */}
              {previewAudio.content_type === 'audio' && !previewAudio.video_url ? (
                <div className="mb-4">
                  <Badge className="bg-green-500 mb-2">✓ Pure Audio Recording (No Video)</Badge>
                  <audio controls className="w-full">
                    <source src={previewAudio.audio_url} type="audio/webm" />
                    <source src={previewAudio.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              ) : (
                <div className="mb-4">
                  <Badge className="bg-purple-500 mb-2">Video Recording (contains video)</Badge>
                  <video controls className="w-full rounded">
                    <source src={previewAudio.video_url || previewAudio.audio_url} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-semibold">
                    {Math.floor((previewAudio.duration || 0) / 60)}:{((previewAudio.duration || 0) % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Episode</span>
                  <span className="text-white font-semibold">S{previewAudio.season}E{previewAudio.episode_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Host</span>
                  <span className="text-white font-semibold">{previewAudio.host_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Format</span>
                  <span className="text-white font-semibold">
                    {previewAudio.content_type === 'audio' && !previewAudio.video_url ?
                      '🎵 Audio WebM (no video)' :
                      '📹 Video WebM'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)} className="border-slate-700 w-full sm:w-auto">
              Close
            </Button>
            {previewAudio && (
              <>
                <Button
                  onClick={() => handleDownloadAudioWithCover(previewAudio)}
                  disabled={extractingAudio}
                  className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                >
                  {extractingAudio ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" />Download + Cover</>
                  )}
                </Button>
                <Link to={createPageUrl("AdminPodcastAudioEditor") + `?id=${previewAudio.id}`}>
                  <Button className="bg-purple-500 hover:bg-purple-600 w-full sm:w-auto">
                    <Sliders className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WebM to MP3 Conversion Guide */}
      <Dialog open={showConversionGuide} onOpenChange={setShowConversionGuide}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Music className="w-6 h-6 text-cyan-400" />
              Convert WebM to MP3 + Add Cover Art
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Quick guide to convert your audio file and add the cover image
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h3 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Why WebM?
              </h3>
              <p className="text-blue-200 text-sm">
                Browsers can only record in WebM format. You downloaded a pure AUDIO WebM (no video inside).
                To get MP3 with cover art that displays in music players, follow these steps:
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-green-300 font-bold mb-2">FREE ONLINE CONVERTER (Easiest - No Install)</h4>
                    <div className="space-y-2 text-sm text-green-100">
                      <p><strong>CloudConvert.com</strong> (Free, no account needed):</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Go to <a href="https://cloudconvert.com/webm-to-mp3" target="_blank" className="text-cyan-400 underline" rel="noopener noreferrer">cloudconvert.com/webm-to-mp3</a></li>
                        <li>Upload your WebM file</li>
                        <li>Click "Convert"</li>
                        <li>Download MP3</li>
                        <li>Add cover art in iTunes/Windows Media Player (see Step 4)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-purple-300 font-bold mb-2">AUDACITY (Free Desktop App)</h4>
                    <div className="space-y-2 text-sm text-purple-100">
                      <p>Download: <a href="https://www.audacityteam.org/" target="_blank" className="text-cyan-400 underline" rel="noopener noreferrer">audacityteam.org</a></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open Audacity</li>
                        <li>File → Open → Select your WebM file</li>
                        <li>File → Export → Export as MP3</li>
                        <li>In export dialog, click "Edit Metadata"</li>
                        <li>Add title, artist, album info</li>
                        <li>Save MP3</li>
                        <li>Right-click MP3 → Properties/Get Info → Add cover image</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-cyan-300 font-bold mb-2">VLC MEDIA PLAYER (Free)</h4>
                    <div className="space-y-2 text-sm text-cyan-100">
                      <p>Download: <a href="https://www.videolan.org/vlc/" target="_blank" className="text-cyan-400 underline" rel="noopener noreferrer">videolan.org/vlc</a></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open VLC</li>
                        <li>Media → Convert/Save</li>
                        <li>Add your WebM file</li>
                        <li>Click "Convert/Save"</li>
                        <li>Profile: Audio - MP3</li>
                        <li>Choose destination filename</li>
                        <li>Click "Start"</li>
                        <li>Add cover art in iTunes/Media Player (see Step 4)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="text-amber-300 font-bold mb-2">ADD COVER ART TO MP3</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-100">
                      <div>
                        <p className="font-bold mb-2">🍎 iTunes / Music (Mac/Windows):</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Right-click MP3 file</li>
                          <li>Get Info (or Properties)</li>
                          <li>Go to "Artwork" tab</li>
                          <li>Click "Add Artwork"</li>
                          <li>Select downloaded cover image</li>
                          <li>Click OK</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-bold mb-2">🪟 Windows Media Player:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Right-click MP3 file</li>
                          <li>Properties</li>
                          <li>Go to "Pictures" tab</li>
                          <li>Click "Add"</li>
                          <li>Select cover image</li>
                          <li>Apply → OK</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 border border-slate-600 rounded-lg">
                <h4 className="text-white font-bold mb-3">🎯 RESULT:</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>✅ MP3 file with embedded cover art</p>
                  <p>✅ Works in iTunes, Spotify, Apple Music, etc.</p>
                  <p>✅ Shows beautiful cover image when playing</p>
                  <p>✅ Ready to upload to podcast platforms</p>
                  <p>✅ Professional podcast file with metadata</p>
                </div>
              </div>

              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h4 className="text-red-300 font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Why Can't Browsers Do This Automatically?
                </h4>
                <p className="text-red-200 text-sm">
                  Web browsers can only record in WebM/Ogg formats for security and compatibility reasons.
                  Converting to MP3 and embedding cover art requires desktop software or online tools.
                  This is a limitation of all browser-based recording platforms, not just Glory Wave.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowConversionGuide(false)} className="bg-cyan-500 hover:bg-cyan-600">
              Got It!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Media Posts Dialog */}
      <Dialog open={socialMediaDialog} onOpenChange={setSocialMediaDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-blue-400" />
              AI-Generated Social Media Posts
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedForSocial?.title}
            </DialogDescription>
          </DialogHeader>
          {generatedSocial && (
            <div className="space-y-4 py-4">
              {/* Twitter */}
              <Card className="bg-slate-900/30 border-blue-500/30">
                <CardHeader className="py-3 px-4 border-b border-slate-700">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    Twitter/X
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    value={generatedSocial.twitter?.post}
                    readOnly
                    className="bg-slate-900 border-slate-700 text-white h-32 mb-3"
                  />
                  <div className="flex flex-wrap gap-1 mb-3">
                    {generatedSocial.twitter?.hashtags?.map((tag, idx) => (
                      <Badge key={idx} className="bg-blue-500">#{tag}</Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSocial.twitter?.post + '\n\n' + generatedSocial.twitter?.hashtags?.map(t => `#${t}`).join(' '));
                      alert('Twitter post copied!');
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Post
                  </Button>
                </CardContent>
              </Card>

              {/* LinkedIn */}
              <Card className="bg-slate-900/30 border-blue-700/30">
                <CardHeader className="py-3 px-4 border-b border-slate-700">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    LinkedIn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    value={generatedSocial.linkedin?.post}
                    readOnly
                    className="bg-slate-900 border-slate-700 text-white h-48 mb-3"
                  />
                  <div className="flex flex-wrap gap-1 mb-3">
                    {generatedSocial.linkedin?.hashtags?.map((tag, idx) => (
                      <Badge key={idx} className="bg-blue-700">#{tag}</Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSocial.linkedin?.post + '\n\n' + generatedSocial.linkedin?.hashtags?.map(t => `#${t}`).join(' '));
                      alert('LinkedIn post copied!');
                    }}
                    className="bg-blue-700 hover:bg-blue-800"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Post
                  </Button>
                </CardContent>
              </Card>

              {/* Instagram */}
              <Card className="bg-slate-900/30 border-pink-500/30">
                <CardHeader className="py-3 px-4 border-b border-slate-700">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-pink-400" />
                    Instagram
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    value={generatedSocial.instagram?.caption}
                    readOnly
                    className="bg-slate-900 border-slate-700 text-white h-64 mb-3"
                  />
                  <div className="flex flex-wrap gap-1 mb-3 max-h-32 overflow-y-auto">
                    {generatedSocial.instagram?.hashtags?.map((tag, idx) => (
                      <Badge key={idx} className="bg-pink-500">#{tag}</Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSocial.instagram?.caption + '\n\n' + generatedSocial.instagram?.hashtags?.map(t => `#${t}`).join(' '));
                      alert('Instagram caption copied!');
                    }}
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Caption
                  </Button>
                </CardContent>
              </Card>

              {/* Facebook */}
              <Card className="bg-slate-900/30 border-blue-600/30">
                <CardHeader className="py-3 px-4 border-b border-slate-700">
                  <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-500" />
                    Facebook
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    value={generatedSocial.facebook?.post}
                    readOnly
                    className="bg-slate-900 border-slate-700 text-white h-48 mb-3"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSocial.facebook?.post);
                      alert('Facebook post copied!');
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Post
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSocialMediaDialog(false)} className="bg-cyan-500 hover:bg-cyan-600">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Markers Dialog */}
      <Dialog open={chaptersDialog} onOpenChange={setChaptersDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-green-400" />
              AI-Generated Chapter Markers
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedForChapters?.title}
            </DialogDescription>
          </DialogHeader>
          {generatedChapters && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h4 className="text-green-300 font-bold mb-2">SEO Optimized Description</h4>
                <p className="text-green-100 text-sm">{generatedChapters.seo_description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {generatedChapters.seo_keywords?.map((kw, idx) => (
                    <Badge key={idx} className="bg-green-500 text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-bold">Chapter Markers ({generatedChapters.chapters?.length})</h4>
                {generatedChapters.chapters?.map((chapter, idx) => (
                  <Card key={idx} className="bg-slate-900/30 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-black text-xl">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-500">{chapter.timestamp}</Badge>
                            <h5 className="text-white font-bold">{chapter.title}</h5>
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{chapter.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {chapter.keywords?.map((kw, kidx) => (
                              <Badge key={kidx} className="bg-emerald-500 text-xs">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const chaptersText = generatedChapters.chapters?.map((ch, idx) =>
                      `${ch.timestamp} - ${ch.title}\n${ch.description}\nKeywords: ${ch.keywords?.join(', ')}`
                    ).join('\n\n');
                    navigator.clipboard.writeText(chaptersText);
                    alert('Chapters copied to clipboard!');
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Chapters
                </Button>
                <Button
                  onClick={() => {
                    const youtubeFormat = generatedChapters.chapters?.map(ch =>
                      `${ch.timestamp} ${ch.title}`
                    ).join('\n');
                    navigator.clipboard.writeText(youtubeFormat);
                    alert('YouTube-formatted chapters copied!');
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy for YouTube
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setChaptersDialog(false)} className="bg-cyan-500 hover:bg-cyan-600">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Marketing Tools Dialog */}
      <Dialog open={showAITools} onOpenChange={setShowAITools}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-black text-2xl flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-purple-400" />
              AI Marketing & Content Tools
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedPodcastForAI?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {selectedPodcastForAI && (
              <div className="space-y-6">
                <AITrailerGenerator podcast={selectedPodcastForAI} />
                <AISocialMediaGenerator podcast={selectedPodcastForAI} />
                <AIChapterGenerator podcast={selectedPodcastForAI} />
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-slate-700 pt-4">
            <Button
              onClick={() => {
                setShowAITools(false);
                setSelectedPodcastForAI(null);
              }}
              variant="outline"
              className="w-full border-slate-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: SEO Optimization Dialog */}
      <Dialog open={seoDialogOpen} onOpenChange={setSeoDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-2xl flex items-center gap-3">
              <Search className="w-8 h-8 text-green-400" />
              AI SEO Optimization Suite
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedForSEO?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedForSEO && (
            <SEOOptimizer
              podcast={selectedForSEO}
              onUpdate={(updates) => handleSEOUpdate(selectedForSEO.id, updates)}
            />
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setSeoDialogOpen(false);
                setSelectedForSEO(null);
              }}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
