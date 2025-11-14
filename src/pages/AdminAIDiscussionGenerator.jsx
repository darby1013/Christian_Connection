import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { MessageSquare, Sparkles, Loader2, Copy } from 'lucide-react';

export default function AdminAIDiscussionGenerator() {
  const [lessonTopic, setLessonTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [discussions, setDiscussions] = useState(null);

  const generateDiscussions = async () => {
    if (!lessonTopic) return alert('Please enter a topic');

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 8 engaging discussion prompts for: "${lessonTopic}"

Create thought-provoking questions that:
1. Encourage critical thinking
2. Foster community engagement
3. Apply concepts to real-world scenarios
4. Spark meaningful debate
5. Are open-ended (no simple yes/no answers)

For each prompt provide the question and expected discussion points.`,
        response_json_schema: {
          type: 'object',
          properties: {
            prompts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  discussion_points: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      });

      setDiscussions(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Discussion Generator"
        subtitle="Create engaging forum discussion prompts"
        icon={MessageSquare}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Lesson/Course Topic *</label>
              <Input
                placeholder="e.g., Climate Change Impact"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={generateDiscussions}
              disabled={generating}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Discussions</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {discussions ? (
            <div className="space-y-4">
              {discussions.prompts?.map((prompt, i) => (
                <Card key={i} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-cyan-500">Discussion {i + 1}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(prompt.question)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-white font-bold text-lg mb-3">{prompt.question}</p>
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                      <p className="text-cyan-400 font-bold text-xs mb-2">Expected Discussion Points:</p>
                      <ul className="space-y-1">
                        {prompt.discussion_points?.map((point, j) => (
                          <li key={j} className="text-slate-300 text-sm">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <MessageSquare className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Generate</p>
                <p className="text-slate-400">AI will create thought-provoking discussion prompts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}