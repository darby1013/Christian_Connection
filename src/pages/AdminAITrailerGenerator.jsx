import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Video, Sparkles, Loader2, Play } from 'lucide-react';

export default function AdminAITrailerGenerator() {
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeDescription, setEpisodeDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [trailer, setTrailer] = useState(null);

  const generateTrailer = async () => {
    if (!episodeTitle) return alert('Please enter episode title');

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging 45-second podcast trailer script for:

Title: ${episodeTitle}
Description: ${episodeDescription}

Generate:
1. Attention-grabbing opening hook (5-7 seconds)
2. Key highlights/teasers (20-25 seconds)
3. Call-to-action (10-15 seconds)
4. Background music suggestions
5. Voice direction notes`,
        response_json_schema: {
          type: 'object',
          properties: {
            trailer_script: { type: 'string' },
            opening_hook: { type: 'string' },
            key_highlights: { type: 'array', items: { type: 'string' } },
            call_to_action: { type: 'string' },
            music_suggestion: { type: 'string' },
            voice_notes: { type: 'string' },
            estimated_duration: { type: 'string' }
          }
        }
      });

      setTrailer(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Trailer Generator"
        subtitle="Create engaging podcast trailers automatically"
        icon={Video}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Episode Title *</label>
              <Input
                placeholder="e.g., The Future of AI"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Episode Description</label>
              <Textarea
                placeholder="Brief description of the episode..."
                value={episodeDescription}
                onChange={(e) => setEpisodeDescription(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-32"
              />
            </div>

            <Button
              onClick={generateTrailer}
              disabled={generating}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Trailer</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {trailer ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge className="bg-pink-500 px-3 py-1">{trailer.estimated_duration}</Badge>
                  <Button size="sm" className="bg-green-500">
                    <Play className="w-3 h-3 mr-1" />Generate Audio
                  </Button>
                </div>

                <div className="bg-pink-900/20 p-6 rounded-lg border border-pink-500/30">
                  <h4 className="text-pink-300 font-bold mb-3 text-lg">Trailer Script</h4>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {trailer.trailer_script}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4">
                      <h5 className="text-cyan-400 font-bold text-sm mb-2">🎵 Music Suggestion</h5>
                      <p className="text-slate-300 text-sm">{trailer.music_suggestion}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4">
                      <h5 className="text-purple-400 font-bold text-sm mb-2">🎤 Voice Direction</h5>
                      <p className="text-slate-300 text-sm">{trailer.voice_notes}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Video className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Create Trailer</p>
                <p className="text-slate-400">AI will generate an engaging trailer script</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}