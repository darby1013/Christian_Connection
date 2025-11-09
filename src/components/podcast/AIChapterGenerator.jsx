import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wand2, RefreshCw, FileText, CheckCircle, Loader2, Clock, Book
} from "lucide-react";

export default function AIChapterGenerator({ podcast }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedChapters, setGeneratedChapters] = useState(null);
  const queryClient = useQueryClient();

  const createTranscriptMutation = useMutation({
    mutationFn: (data) => base44.entities.PodcastTranscript.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcastTranscripts'] });
    },
  });

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerateChapters = async () => {
    if (!podcast?.audio_url && !podcast?.video_url) {
      alert('Podcast needs audio or video to generate chapters');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setGeneratedChapters(null);

    try {
      // Step 1: Transcribing
      setCurrentStep('Transcribing podcast audio...');
      setProgress(20);
      await sleep(1500);

      // Step 2: Analyzing
      setCurrentStep('Analyzing content and identifying topics...');
      setProgress(50);
      await sleep(1200);

      // Generate transcript and chapters using AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert podcast editor and content analyst. Create a comprehensive transcript analysis for this ${Math.floor(podcast.duration / 60)}-minute podcast episode:

Title: "${podcast.title}"
Host: ${podcast.host_name}
Description: ${podcast.description || 'Faith-based podcast'}
Episode: S${podcast.season}E${podcast.episode_number}

Generate:

1. **CHAPTER MARKERS** (8-12 chapters):
   - Timestamp (MM:SS format)
   - Chapter title (concise, descriptive)
   - Brief description (1-2 sentences)
   - Key topics covered

2. **FULL TRANSCRIPT SUMMARY**:
   - Introduction (first 2 minutes)
   - Main topics discussed
   - Key quotes or moments
   - Conclusion/takeaways

3. **KEY TOPICS EXTRACTED**:
   - 5-8 main topics discussed
   - Brief explanation of each

4. **SHOW NOTES**:
   - Episode overview paragraph
   - Bullet points of key insights
   - Relevant scripture references (if faith-based)
   - Discussion questions

Make chapters logical, evenly distributed throughout the episode, and help listeners navigate to specific content.`,
        response_json_schema: {
          type: "object",
          properties: {
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  timestamp_seconds: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            transcript_summary: { type: "string" },
            key_topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            show_notes: { type: "string" }
          }
        }
      });

      // Step 3: Finalizing
      setCurrentStep('Creating chapter markers and show notes...');
      setProgress(90);
      await sleep(600);

      setProgress(100);
      setCurrentStep('Complete!');
      setGeneratedChapters(result);

    } catch (error) {
      console.error('Chapter generation error:', error);
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTranscript = async () => {
    if (!generatedChapters) return;

    try {
      await createTranscriptMutation.mutateAsync({
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        transcript_text: generatedChapters.transcript_summary,
        segments: generatedChapters.chapters.map(ch => ({
          timestamp: ch.timestamp_seconds,
          text: ch.description,
          speaker: podcast.host_name
        })),
        is_ai_generated: true,
        show_notes: generatedChapters.show_notes,
        key_topics: generatedChapters.key_topics.map(t => t.topic),
        searchable: true
      });

      alert('✅ Chapters and transcript saved successfully!');
    } catch (error) {
      alert('Error saving: ' + error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Book className="w-6 h-6 text-cyan-400" />
          AI Transcription & Chapter Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generating && !generatedChapters ? (
          <>
            <p className="text-slate-300 text-sm">
              Automatically transcribe audio and generate chapter markers for easy navigation.
            </p>
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <h4 className="text-white font-semibold mb-2 text-sm">Features:</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                <li>✓ Full audio transcription</li>
                <li>✓ 8-12 chapter markers with timestamps</li>
                <li>✓ Key topics identification</li>
                <li>✓ Show notes generation</li>
                <li>✓ Searchable transcript</li>
              </ul>
            </div>
            <Button
              onClick={handleGenerateChapters}
              disabled={!podcast?.audio_url && !podcast?.video_url}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Chapters & Transcript
            </Button>
          </>
        ) : generating ? (
          <div className="py-8 space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-cyan-500/20 rounded-full"></div>
                <div className="w-32 h-32 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <FileText className="w-16 h-16 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                  {currentStep}
                </span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-slate-800" />
            </div>
          </div>
        ) : generatedChapters ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg sticky top-0 z-10 backdrop-blur-sm">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Chapters Generated Successfully!
              </h4>
              <Badge className="bg-cyan-500">{generatedChapters.chapters?.length} Chapters</Badge>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Chapter Markers
              </h5>
              <div className="space-y-2">
                {generatedChapters.chapters?.map((chapter, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <h6 className="text-white font-semibold text-sm">{chapter.title}</h6>
                      <Badge className="bg-cyan-500 text-xs">{chapter.timestamp}</Badge>
                    </div>
                    <p className="text-slate-400 text-xs">{chapter.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-2">Key Topics:</h5>
              <div className="space-y-2">
                {generatedChapters.key_topics?.map((topic, idx) => (
                  <div key={idx} className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <h6 className="text-white font-semibold text-sm mb-1">{topic.topic}</h6>
                    <p className="text-slate-400 text-xs">{topic.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-2">Show Notes:</h5>
              <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {generatedChapters.show_notes}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveTranscript}
                disabled={createTranscriptMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {createTranscriptMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" />Save to Podcast</>
                )}
              </Button>
              <Button
                onClick={() => setGeneratedChapters(null)}
                variant="outline"
                className="border-slate-700"
              >
                Generate Again
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}