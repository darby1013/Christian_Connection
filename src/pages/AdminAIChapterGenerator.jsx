import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Zap, Sparkles, Loader2, Clock, Upload } from 'lucide-react';

export default function AdminAIChapterGenerator() {
  const [audioFile, setAudioFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [chapters, setChapters] = useState(null);

  const generateChapters = async () => {
    if (!audioFile) return alert('Please upload audio');

    setGenerating(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this podcast episode and create chapter segments:

Generate 8-12 logical chapter breaks with:
- Chapter title (descriptive and engaging)
- Start timestamp
- Duration
- Brief description of content covered
- Key topics discussed`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            episode_title: { type: 'string' },
            total_duration: { type: 'string' },
            chapters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chapter_number: { type: 'number' },
                  title: { type: 'string' },
                  start_time: { type: 'string' },
                  duration: { type: 'string' },
                  description: { type: 'string' },
                  topics: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      });

      setChapters(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Chapter Generator"
        subtitle="Auto-segment episodes into navigable chapters"
        icon={Zap}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Upload Podcast Audio *</label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0])}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {audioFile && (
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                <p className="text-green-300 font-bold text-sm">{audioFile.name}</p>
                <p className="text-green-200 text-xs">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <Button
              onClick={generateChapters}
              disabled={generating}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Chapters</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {chapters ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white">{chapters.episode_title}</h3>
                    <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      {chapters.total_duration} • {chapters.chapters?.length} chapters
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {chapters.chapters?.map((chapter, i) => (
                    <Card key={i} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-green-500">Ch {chapter.chapter_number}</Badge>
                            <h5 className="text-white font-bold">{chapter.title}</h5>
                          </div>
                          <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">
                            {chapter.start_time}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{chapter.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {chapter.topics?.map((topic, j) => (
                            <Badge key={j} variant="secondary" className="bg-slate-800 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Zap className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Segment</p>
                <p className="text-slate-400">AI will create chapter markers for your episode</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}