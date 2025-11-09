import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles, FileText, Save, RefreshCw, Search, Clock, Tag,
  CheckCircle, Edit, Wand2
} from "lucide-react";

export default function AITranscriptionManager({ podcast, transcript, user }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript?.transcript_text || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();

  const generateTranscriptMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      
      // Simulate AI transcription (in production, this would call a real transcription API)
      const prompt = `Generate a detailed transcript for a podcast episode titled "${podcast.title}". 
      The episode is ${Math.floor(podcast.duration / 60)} minutes long and is about: ${podcast.description}.
      
      Create a realistic podcast transcript with:
      1. Timestamped segments (every 30-60 seconds)
      2. Speaker labels (Host, Guest if applicable)
      3. Natural conversation flow
      4. Introduction and conclusion
      
      Also generate:
      - A comprehensive summary (2-3 paragraphs)
      - Show notes (bullet points of key topics discussed)
      - 5-7 key topics/themes covered
      
      Format the response as a structured transcript.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            transcript_text: { type: "string" },
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "number" },
                  speaker: { type: "string" },
                  text: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            show_notes: { type: "string" },
            key_topics: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Create transcript in database
      const transcriptData = {
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        transcript_text: result.transcript_text,
        segments: result.segments || [],
        summary: result.summary,
        show_notes: result.show_notes,
        key_topics: result.key_topics || [],
        is_ai_generated: true,
        is_verified: false,
        language: 'en',
        searchable: true
      };

      if (transcript) {
        return await base44.entities.PodcastTranscript.update(transcript.id, transcriptData);
      } else {
        return await base44.entities.PodcastTranscript.create(transcriptData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript'] });
      setIsGenerating(false);
    },
    onError: (error) => {
      alert('Error generating transcript: ' + error.message);
      setIsGenerating(false);
    }
  });

  const saveTranscriptMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastTranscript.update(transcript.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript'] });
      setIsEditing(false);
    },
  });

  const regenerateSummaryMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Based on this podcast transcript, generate:
      1. A comprehensive 2-3 paragraph summary
      2. Detailed show notes with bullet points
      3. 5-7 key topics covered
      
      Transcript: ${transcript.transcript_text.substring(0, 4000)}...`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            show_notes: { type: "string" },
            key_topics: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      return await base44.entities.PodcastTranscript.update(transcript.id, {
        summary: result.summary,
        show_notes: result.show_notes,
        key_topics: result.key_topics || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcript'] });
    },
  });

  const handleSaveEdit = () => {
    saveTranscriptMutation.mutate({
      transcript_text: editedTranscript,
      is_verified: true
    });
  };

  const highlightText = (text) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={i} className="bg-yellow-400 text-black px-1 rounded">{part}</span>
        : part
    );
  };

  if (!transcript) {
    return (
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-12 text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-white font-bold text-xl mb-2">No Transcript Yet</h3>
          <p className="text-slate-400 mb-6">
            Generate an AI-powered transcript with timestamps, speakers, and show notes
          </p>
          <Button
            onClick={() => generateTranscriptMutation.mutate()}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Transcript...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Transcript
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-black flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              Transcript Management
            </CardTitle>
            <div className="flex items-center gap-2">
              {transcript.is_ai_generated && (
                <Badge className="bg-purple-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              {transcript.is_verified && (
                <Badge className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Transcript'}
            </Button>
            <Button
              onClick={() => regenerateSummaryMutation.mutate()}
              disabled={regenerateSummaryMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {regenerateSummaryMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Regenerate Summary
                </>
              )}
            </Button>
            <Button
              onClick={() => generateTranscriptMutation.mutate()}
              disabled={isGenerating}
              variant="outline"
              className="border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate All
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search in transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transcript Content */}
      {isEditing ? (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader>
            <CardTitle className="text-white font-bold">Edit Transcript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white font-mono text-sm h-96"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                disabled={saveTranscriptMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTranscript(transcript.transcript_text);
                }}
                variant="outline"
                className="border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {transcript.summary || 'No summary available'}
              </p>
            </CardContent>
          </Card>

          {/* Key Topics */}
          {transcript.key_topics && transcript.key_topics.length > 0 && (
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  Key Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {transcript.key_topics.map((topic, idx) => (
                    <Badge key={idx} className="bg-purple-500 text-sm py-1 px-3">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Notes */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Show Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {transcript.show_notes || 'No show notes available'}
              </div>
            </CardContent>
          </Card>

          {/* Full Transcript */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-bold">Full Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              {transcript.segments && transcript.segments.length > 0 ? (
                <div className="space-y-3">
                  {transcript.segments
                    .filter(segment => 
                      !searchQuery || 
                      segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      segment.speaker?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((segment, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-cyan-500 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(segment.timestamp / 60)}:{String(Math.floor(segment.timestamp % 60)).padStart(2, '0')}
                          </Badge>
                          <div className="flex-1">
                            {segment.speaker && (
                              <span className="text-purple-400 font-semibold text-sm mr-2">
                                {segment.speaker}:
                              </span>
                            )}
                            <span className="text-slate-300 text-sm">
                              {highlightText(segment.text)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-300 whitespace-pre-wrap">
                  {highlightText(transcript.transcript_text)}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}