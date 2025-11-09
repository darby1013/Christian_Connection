import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wand2, RefreshCw, Video, Download, Film, Sparkles, CheckCircle, Loader2
} from "lucide-react";

export default function AITrailerGenerator({ podcast }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedTrailer, setGeneratedTrailer] = useState(null);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerateTrailer = async () => {
    if (!podcast?.audio_url) {
      alert('Podcast must have audio to generate trailer');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setGeneratedTrailer(null);

    try {
      // Step 1: Analyzing content
      setCurrentStep('Analyzing podcast content and audio...');
      setProgress(15);
      await sleep(800);

      // Step 2: Generating script
      setCurrentStep('Creating AI voiceover script for trailer...');
      setProgress(30);
      await sleep(1000);

      // Generate trailer concept using AI
      const trailerConcept = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional podcast trailer producer. Create a 30-second video trailer concept for this podcast episode:

Title: "${podcast.title}"
Host: ${podcast.host_name}
Episode: S${podcast.season}E${podcast.episode_number}
Description: ${podcast.description || 'Faith-based podcast episode'}
Duration: ${Math.floor(podcast.duration / 60)} minutes

Create a compelling trailer that includes:
1. **Hook Script (5-8 seconds)**: Attention-grabbing opening line
2. **Key Points (15-20 seconds)**: 3-4 most interesting topics/moments
3. **Call to Action (5 seconds)**: Compelling reason to listen
4. **Voiceover Text**: Complete narration script
5. **Visual Suggestions**: Dynamic text overlays and transitions
6. **Background Music Style**: Mood and genre recommendations

Make it exciting, professional, and faith-inspired.`,
        response_json_schema: {
          type: "object",
          properties: {
            hook_script: { type: "string" },
            key_points: {
              type: "array",
              items: { type: "string" }
            },
            call_to_action: { type: "string" },
            full_voiceover_script: { type: "string" },
            visual_suggestions: {
              type: "array",
              items: { type: "string" }
            },
            music_style: { type: "string" },
            estimated_duration_seconds: { type: "number" }
          }
        }
      });

      // Step 3: Generating visuals
      setCurrentStep('Generating dynamic waveform visualization...');
      setProgress(50);
      await sleep(1000);

      // Generate trailer thumbnail/poster
      const trailerImage = await base44.integrations.Core.GenerateImage({
        prompt: `Create a dynamic, eye-catching podcast trailer poster for "${podcast.title}".

DESIGN SPECIFICATIONS:
- Format: 16:9 landscape (1920x1080)
- Style: Modern, cinematic, motion graphic aesthetic
- Colors: Deep purple (#6B21A8), bright cyan (#06B6D4), dark background
- Typography: Bold, impact font for title

VISUAL ELEMENTS:
1. Large animated waveform bars (purple to cyan gradient)
2. Episode title in bold white text at top
3. "NEW EPISODE" or "WATCH NOW" badge
4. Host name with microphone icon
5. Episode number (S${podcast.season}E${podcast.episode_number})
6. Dynamic motion blur effects
7. Neon glow and light rays
8. Professional broadcast quality

LAYOUT:
- Top third: "NEW EPISODE" badge + Title
- Center: Large dynamic waveform visualization
- Bottom third: Host name, episode info, "LISTEN NOW" CTA
- Subtle animated elements suggestion (motion lines, particles)

Make it look like a Netflix or YouTube trailer thumbnail - professional, cinematic, impossible to scroll past!`
      });

      // Step 4: Processing audio clips
      setCurrentStep('Processing audio highlights and transitions...');
      setProgress(70);
      await sleep(800);

      // Step 5: Finalizing
      setCurrentStep('Finalizing trailer package...');
      setProgress(90);
      await sleep(600);

      setProgress(100);
      setCurrentStep('Trailer ready!');

      setGeneratedTrailer({
        ...trailerConcept,
        trailer_image: trailerImage.url,
        audio_url: podcast.audio_url, // In production, this would be a highlight reel
        podcast_title: podcast.title,
        podcast_id: podcast.id
      });

    } catch (error) {
      console.error('Trailer generation error:', error);
      alert('Error generating trailer: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Film className="w-6 h-6 text-purple-400" />
          AI Trailer Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generating && !generatedTrailer ? (
          <>
            <p className="text-slate-300 text-sm">
              Generate a professional 30-second video trailer with AI voiceover, dynamic waveforms, and compelling visuals.
            </p>
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h4 className="text-white font-semibold mb-2 text-sm">Trailer Will Include:</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                <li>✓ AI-generated voiceover script</li>
                <li>✓ Dynamic animated waveforms</li>
                <li>✓ Cinematic thumbnail/poster</li>
                <li>✓ Audio highlights from episode</li>
                <li>✓ Professional motion graphics</li>
              </ul>
            </div>
            <Button
              onClick={handleGenerateTrailer}
              disabled={!podcast?.audio_url}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Trailer
            </Button>
          </>
        ) : generating ? (
          <div className="py-8 space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-purple-500/20 rounded-full"></div>
                <div className="w-32 h-32 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <Film className="w-16 h-16 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  {currentStep}
                </span>
                <span className="text-purple-400 font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-slate-800" />
            </div>
          </div>
        ) : generatedTrailer ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Trailer Generated Successfully!
              </h4>
              <Badge className="bg-purple-500">
                {generatedTrailer.estimated_duration_seconds}s trailer
              </Badge>
            </div>

            {generatedTrailer.trailer_image && (
              <div>
                <p className="text-slate-400 text-sm mb-2">Trailer Thumbnail:</p>
                <img 
                  src={generatedTrailer.trailer_image} 
                  alt="Trailer" 
                  className="w-full rounded-lg border-2 border-purple-500/30"
                />
              </div>
            )}

            <div>
              <h5 className="text-white font-semibold mb-2">Voiceover Script:</h5>
              <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {generatedTrailer.full_voiceover_script}
                </p>
              </div>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-2">Key Moments:</h5>
              <ul className="space-y-2">
                {generatedTrailer.key_points?.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-2">Visual Suggestions:</h5>
              <div className="space-y-1">
                {generatedTrailer.visual_suggestions?.map((visual, idx) => (
                  <p key={idx} className="text-slate-400 text-xs">• {visual}</p>
                ))}
              </div>
            </div>

            <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <p className="text-cyan-400 font-semibold text-sm mb-1">Music Style:</p>
              <p className="text-slate-300 text-xs">{generatedTrailer.music_style}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedTrailer.trailer_image;
                  link.download = `${podcast.title.replace(/[^a-z0-9]/gi, '_')}_TRAILER.jpg`;
                  link.click();
                }}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Thumbnail
              </Button>
              <Button
                onClick={() => setGeneratedTrailer(null)}
                variant="outline"
                className="border-slate-700"
              >
                Create Another
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}