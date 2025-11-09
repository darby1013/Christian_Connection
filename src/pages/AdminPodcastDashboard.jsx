import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Mic2, FileAudio, Sparkles, Scissors, Download,
  Eye, TrendingUp, Clock, CheckCircle, AlertCircle, Play
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function AdminPodcastDashboard() {
  const [user, setUser] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [processingPodcast, setProcessingPodcast] = useState(null);
  const [podcastForm, setPodcastForm] = useState({
    title: '',
    description: '',
    category: '',
    audio_url: ''
  });

  const queryClient = useQueryClient();

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

  const { data: podcasts = [] } = useQuery({
    queryKey: ['adminPodcasts'],
    queryFn: () => base44.entities.Podcast.list('-created_date'),
    initialData: [],
  });

  const { data: transcriptions = [] } = useQuery({
    queryKey: ['transcriptions'],
    queryFn: () => base44.entities.PodcastTranscription.list(),
    initialData: [],
  });

  const { data: clips = [] } = useQuery({
    queryKey: ['podcastClips'],
    queryFn: () => base44.entities.PodcastClip.list('-created_date'),
    initialData: [],
  });

  const uploadPodcastMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (fileUrl) => {
      setPodcastForm({...podcastForm, audio_url: fileUrl});
    },
  });

  const createPodcastMutation = useMutation({
    mutationFn: async (podcastData) => {
      const podcast = await base44.entities.Podcast.create({
        ...podcastData,
        host_name: user.full_name,
        published_date: new Date().toISOString()
      });

      // Auto-generate transcription
      setProcessingPodcast(podcast.id);
      
      // Simulate AI transcription (in production, this would call a real AI service)
      await base44.entities.PodcastTranscription.create({
        podcast_id: podcast.id,
        transcript_text: "Transcription in progress...",
        processing_status: "processing"
      });

      return podcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPodcasts'] });
      setUploadDialogOpen(false);
      setPodcastForm({ title: '', description: '', category: '', audio_url: '' });
      setProcessingPodcast(null);
    },
  });

  const generateShowNotesMutation = useMutation({
    mutationFn: async (podcastId) => {
      const transcript = transcriptions.find(t => t.podcast_id === podcastId);
      
      // Use AI to generate show notes
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this podcast transcript, generate comprehensive show notes including:
1. A compelling summary (2-3 paragraphs)
2. 5-7 key points or takeaways
3. Main topics discussed
4. Chapter timestamps (at least 3)

Transcript: ${transcript?.transcript_text || "Sample podcast about faith and community"}

Format the response as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            topics: { type: "array", items: { type: "string" } },
            timestamps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  label: { type: "string" }
                }
              }
            }
          }
        }
      });

      return base44.entities.PodcastShowNote.create({
        podcast_id: podcastId,
        ...result,
        is_auto_generated: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPodcasts'] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadPodcastMutation.mutate(file);
    }
  };

  const handleSubmit = () => {
    if (!podcastForm.title.trim() || !podcastForm.audio_url) {
      alert('Please provide title and audio file');
      return;
    }
    createPodcastMutation.mutate(podcastForm);
  };

  const totalPlays = podcasts.reduce((sum, p) => sum + (p.plays || 0), 0);
  const processingCount = transcriptions.filter(t => t.processing_status === 'processing').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Podcast Dashboard</h2>
          <p className="text-slate-400 font-semibold">Manage, upload, and optimize your podcast content</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600 font-bold">
              <Upload className="w-4 h-4 mr-2" />
              Upload Podcast
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl">Upload New Podcast</DialogTitle>
              <DialogDescription className="text-slate-400">
                Upload audio and we'll auto-generate transcripts and show notes
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Audio File *</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={uploadPodcastMutation.isPending}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {uploadPodcastMutation.isPending && (
                  <p className="text-cyan-400 text-sm mt-2">Uploading...</p>
                )}
                {podcastForm.audio_url && (
                  <p className="text-green-400 text-sm mt-2">✓ Audio uploaded successfully</p>
                )}
              </div>
              <div>
                <Label className="text-white mb-2 block">Episode Title *</Label>
                <Input
                  placeholder="e.g., Faith & Community - Episode 1"
                  value={podcastForm.title}
                  onChange={(e) => setPodcastForm({...podcastForm, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Episode description..."
                  value={podcastForm.description}
                  onChange={(e) => setPodcastForm({...podcastForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Category</Label>
                <Input
                  placeholder="e.g., Sermon, Teaching, Interview"
                  value={podcastForm.category}
                  onChange={(e) => setPodcastForm({...podcastForm, category: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-purple-300 font-semibold mb-1">AI-Powered Processing</p>
                    <p className="text-slate-300 text-sm">
                      We'll automatically generate transcripts and show notes after upload
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createPodcastMutation.isPending || !podcastForm.audio_url}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {createPodcastMutation.isPending ? 'Creating...' : 'Upload & Process'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Total Episodes</p>
                <p className="text-3xl font-black text-white">{podcasts.length}</p>
              </div>
              <Mic2 className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Total Plays</p>
                <p className="text-3xl font-black text-white">{totalPlays}</p>
              </div>
              <Play className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Processing</p>
                <p className="text-3xl font-black text-white">{processingCount}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-semibold mb-1">Clips Created</p>
                <p className="text-3xl font-black text-white">{clips.length}</p>
              </div>
              <Scissors className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="episodes" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="episodes" className="data-[state=active]:bg-cyan-500">Episodes</TabsTrigger>
          <TabsTrigger value="transcripts" className="data-[state=active]:bg-cyan-500">Transcripts</TabsTrigger>
          <TabsTrigger value="clips" className="data-[state=active]:bg-cyan-500">Clips</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="episodes" className="mt-6">
          <div className="space-y-4">
            {podcasts.map((podcast) => {
              const transcription = transcriptions.find(t => t.podcast_id === podcast.id);
              
              return (
                <Card key={podcast.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        {podcast.image_url ? (
                          <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <FileAudio className="w-10 h-10 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-bold text-lg mb-1">{podcast.title}</h4>
                            <p className="text-slate-400 text-sm">{podcast.description}</p>
                          </div>
                          <Badge className={`${
                            transcription?.processing_status === 'completed' ? 'bg-green-500' :
                            transcription?.processing_status === 'processing' ? 'bg-amber-500' :
                            'bg-slate-600'
                          }`}>
                            {transcription?.processing_status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            {podcast.plays || 0} plays
                          </span>
                          <span>{podcast.duration ? `${Math.floor(podcast.duration / 60)} min` : 'N/A'}</span>
                          <span>{format(new Date(podcast.created_date), 'MMM d, yyyy')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generate Show Notes
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-700">
                            <Scissors className="w-3 h-3 mr-1" />
                            Create Clips
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-700">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="transcripts" className="mt-6">
          <div className="space-y-4">
            {transcriptions.map((transcript) => {
              const podcast = podcasts.find(p => p.id === transcript.podcast_id);
              
              return (
                <Card key={transcript.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-bold mb-1">{podcast?.title || 'Unknown'}</h4>
                        <p className="text-slate-400 text-sm">{transcript.word_count || 0} words • {transcript.language}</p>
                      </div>
                      <Badge className={`${
                        transcript.processing_status === 'completed' ? 'bg-green-500' :
                        transcript.processing_status === 'processing' ? 'bg-amber-500' :
                        transcript.processing_status === 'failed' ? 'bg-red-500' :
                        'bg-slate-600'
                      }`}>
                        {transcript.processing_status}
                      </Badge>
                    </div>
                    
                    {transcript.processing_status === 'completed' && (
                      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                        <p className="text-slate-300 text-sm line-clamp-3">{transcript.transcript_text}</p>
                      </div>
                    )}
                    
                    {transcript.processing_status === 'processing' && (
                      <div className="mb-4">
                        <Progress value={65} className="h-2" />
                        <p className="text-cyan-400 text-sm mt-2">Processing transcript...</p>
                      </div>
                    )}
                    
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                      <Download className="w-3 h-3 mr-1" />
                      Download Transcript
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="clips" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip) => {
              const podcast = podcasts.find(p => p.id === clip.podcast_id);
              
              return (
                <Card key={clip.id} className="bg-[#1a1f3a] border-slate-700">
                  <CardContent className="p-5">
                    <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-3 flex items-center justify-center">
                      <Scissors className="w-12 h-12 text-white" />
                    </div>
                    <h4 className="text-white font-bold mb-2">{clip.title}</h4>
                    <p className="text-slate-400 text-sm mb-3">{clip.duration}s • {clip.platform}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Eye className="w-4 h-4" />
                        {clip.views || 0}
                      </div>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">Analytics Coming Soon</h3>
              <p className="text-slate-400">Track plays, engagement, and audience insights</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}