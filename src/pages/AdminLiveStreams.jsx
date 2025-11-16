
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Video, Plus, Play, StopCircle, Eye, Edit, Trash2, FileText, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminLiveStreams() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [streamForm, setStreamForm] = useState({
    title: '',
    description: '',
    stream_type: 'video',
    thumbnail_url: '',
    category: '',
    tags: []
  });
  const [generatingTranscript, setGeneratingTranscript] = useState(null);
  const queryClient = useQueryClient();

  const { data: liveStreams = [] } = useQuery({
    queryKey: ['adminLiveStreams'],
    queryFn: () => base44.entities.LiveStream.list('-created_date'),
    refetchInterval: 3000,
    initialData: []
  });

  const createStreamMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveStream.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminLiveStreams']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveStream.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminLiveStreams']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteStreamMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveStream.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['adminLiveStreams'])
  });

  const generateTranscriptMutation = useMutation({
    mutationFn: async (stream) => {
      setGeneratingTranscript(stream.id);
      // Generate transcript using AI
      const transcript = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional transcript for this live stream: "${stream.title}". Include timestamps, speaker labels, and format it professionally. Make it at least 500 words.`,
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string" },
            duration: { type: "string" },
            word_count: { type: "number" }
          }
        }
      });

      // Create digital product for the transcript
      const digitalProduct = await base44.entities.DigitalProduct.create({
        name: `${stream.title} - Official Transcript`,
        description: `Complete transcript of the live stream: ${stream.title}`,
        category: 'transcript',
        price: 4.99,
        thumbnail_url: stream.thumbnail_url,
        file_url: `data:text/plain;base64,${btoa(transcript.transcript)}`,
        file_format: 'TXT',
        file_size: `${Math.round(transcript.transcript.length / 1024)}KB`,
        source_type: 'livestream',
        source_id: stream.id,
        tags: ['transcript', 'livestream', ...(stream.tags || [])]
      });

      setGeneratingTranscript(null);
      return digitalProduct;
    },
    onSuccess: () => {
      alert('✅ Transcript generated and added to marketplace!');
      queryClient.invalidateQueries(['digitalProducts']);
    }
  });

  const resetForm = () => {
    setStreamForm({
      title: '',
      description: '',
      stream_type: 'video',
      thumbnail_url: '',
      category: '',
      tags: []
    });
    setEditingStream(null);
  };

  const handleSubmit = () => {
    if (editingStream) {
      updateStreamMutation.mutate({ id: editingStream.id, data: streamForm });
    } else {
      createStreamMutation.mutate(streamForm);
    }
  };

  const handleEdit = (stream) => {
    setEditingStream(stream);
    setStreamForm(stream); // Pre-fill form with stream data
    setShowDialog(true);
  };

  const handleDelete = (streamId) => {
    if (confirm('Are you sure you want to delete this stream?')) {
      deleteStreamMutation.mutate(streamId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Live Streams</h1>
          <p className="text-slate-400 font-semibold">Manage your live streaming content</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Create Stream
        </Button>
      </div>

      <div className="grid gap-4">
        {liveStreams.map(stream => (
          <Card key={stream.id} className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <img 
                  src={stream.thumbnail_url || '/placeholder.jpg'} 
                  alt={stream.title}
                  className="w-32 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-bold text-xl">{stream.title}</h3>
                    <Badge className={
                      stream.status === 'live' ? 'bg-red-500' :
                      stream.status === 'scheduled' ? 'bg-blue-500' : 'bg-slate-500'
                    }>
                      {stream.status}
                    </Badge>
                  </div>
                  <p className="text-slate-400 mb-2">{stream.description}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {stream.viewer_count || 0} viewers
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500 text-cyan-400"
                    onClick={() => generateTranscriptMutation.mutate(stream)}
                    disabled={generatingTranscript === stream.id || generateTranscriptMutation.isLoading}
                  >
                    {generatingTranscript === stream.id ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generate Transcript
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(stream)} className="border-slate-600 text-white hover:bg-slate-800">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(stream.id)} className="border-slate-600 text-red-400 hover:bg-slate-800">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {liveStreams.length === 0 && (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold">No streams found</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingStream ? 'Edit Stream' : 'Create New Stream'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input
                id="title"
                value={streamForm.title}
                onChange={(e) => setStreamForm({...streamForm, title: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={streamForm.description}
                onChange={(e) => setStreamForm({...streamForm, description: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white h-24"
              />
            </div>
            <div>
              <Label htmlFor="thumbnail_url" className="text-white">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={streamForm.thumbnail_url}
                onChange={(e) => setStreamForm({...streamForm, thumbnail_url: e.target.value})}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stream_type" className="text-white">Stream Type</Label>
                <Select value={streamForm.stream_type} onValueChange={(val) => setStreamForm({...streamForm, stream_type: val})}>
                  <SelectTrigger id="stream_type" className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Input
                  id="category"
                  value={streamForm.category}
                  onChange={(e) => setStreamForm({...streamForm, category: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {setShowDialog(false); resetForm();}} 
                className="flex-1 border-slate-600 text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
                disabled={createStreamMutation.isLoading || updateStreamMutation.isLoading}
              >
                {editingStream ? 
                  (updateStreamMutation.isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : 'Update Stream') 
                  : 
                  (createStreamMutation.isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : 'Create Stream')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
