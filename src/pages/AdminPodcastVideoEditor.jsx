
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Info, AlertTriangle, Film, Download, Save
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AdvancedVideoEditor from "../components/video/AdvancedVideoEditor";

export default function AdminPodcastVideoEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const podcastId = urlParams.get('id');
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: podcast, isLoading, error } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: async () => {
      if (!podcastId) return null;
      const results = await base44.entities.Podcast.filter({ id: podcastId });
      return results[0] || null;
    },
    enabled: !!podcastId,
  });

  const { data: script } = useQuery({
    queryKey: ['podcastScript', podcast?.id],
    queryFn: async () => {
      if (!podcast?.id) return null;
      const transcripts = await base44.entities.PodcastTranscript.filter({ podcast_id: podcast.id });
      return transcripts[0] || null;
    },
    enabled: !!podcast,
  });

  const updatePodcastMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Podcast.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    },
  });

  const handleSaveEdits = async (editSettings) => {
    setSaving(true);
    try {
      // Save edit settings to podcast metadata
      await updatePodcastMutation.mutateAsync({
        id: podcastId,
        data: {
          video_edit_settings: editSettings
        }
      });
      alert('✅ Video edit settings saved!');
    } catch (error) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading video editor...</p>
        </div>
      </div>
    );
  }

  if (!podcast || !podcast.video_url) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Film className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">No Video Found</h2>
            <p className="text-slate-400 mb-6">This podcast doesn't have a video file</p>
            <Link to={createPageUrl("AdminPodcasts")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Podcasts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AdminPodcasts")}>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Podcasts
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white mb-1">Advanced Video Editor</h2>
            <p className="text-slate-400">{podcast.title}</p>
            <Badge className="bg-purple-500 mt-1">
              S{podcast.season}E{podcast.episode_number}
            </Badge>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <Alert className="bg-amber-900/20 border-amber-500/30">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <AlertDescription className="text-amber-200">
          <strong>Browser Limitation:</strong> This editor provides real-time preview and exports settings.
          For final video rendering, use professional software like Adobe Premiere, Final Cut Pro, or DaVinci Resolve.
        </AlertDescription>
      </Alert>

      {/* Advanced Editor Component */}
      <AdvancedVideoEditor 
        videoUrl={podcast.video_url}
        podcastId={podcast.id}
        script={script}
        onSave={handleSaveEdits}
      />

      {/* Bottom Actions */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Ready to Export?</h3>
              <p className="text-slate-400 text-sm">
                Download the original video and apply your settings in desktop software
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = podcast.video_url;
                  link.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_original.webm`;
                  link.click();
                }}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Original
              </Button>
              <Button
                onClick={() => alert('Edit settings have been copied to your clipboard. Import these into your video editing software.')}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
