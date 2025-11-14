import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { FileText, Sparkles, Loader2, Download, Copy } from 'lucide-react';

export default function AdminAILessonGenerator() {
  const [lessonTopic, setLessonTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [duration, setDuration] = useState('30');
  const [generating, setGenerating] = useState(false);
  const [lesson, setLesson] = useState(null);

  const generateLesson = async () => {
    if (!lessonTopic) {
      alert('Please enter a lesson topic');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive lesson plan for: "${lessonTopic}"
        
Difficulty Level: ${difficulty}
Duration: ${duration} minutes

Generate detailed lesson content with:
1. Lesson title and overview
2. Learning objectives (3-5)
3. Introduction (engaging hook)
4. Main content (divided into sections with explanations and examples)
5. Practice exercises (2-3 hands-on activities)
6. Summary and key takeaways
7. Additional resources for deeper learning`,
        response_json_schema: {
          type: 'object',
          properties: {
            lesson_title: { type: 'string' },
            overview: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            introduction: { type: 'string' },
            content_sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section_title: { type: 'string' },
                  explanation: { type: 'string' },
                  examples: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            practice_exercises: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
            key_takeaways: { type: 'array', items: { type: 'string' } },
            resources: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setLesson(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Lesson Generator"
        subtitle="Create engaging lesson content with AI"
        icon={FileText}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Lesson Topic *</label>
              <Input
                placeholder="e.g., Introduction to JavaScript Variables"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Difficulty Level</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Duration (minutes)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={generateLesson}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Lesson</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {lesson ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">{lesson.lesson_title}</h3>
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(lesson, null, 2))}>
                    <Copy className="w-3 h-3 mr-1" />Copy
                  </Button>
                </div>

                <p className="text-slate-300">{lesson.overview}</p>

                <div className="bg-cyan-900/20 p-4 rounded-lg border border-cyan-500/30">
                  <h4 className="text-cyan-300 font-bold mb-2">Learning Objectives</h4>
                  <ul className="space-y-1">
                    {lesson.objectives?.map((obj, i) => (
                      <li key={i} className="text-cyan-200 text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-3 text-lg">Introduction</h4>
                  <p className="text-slate-300 leading-relaxed">{lesson.introduction}</p>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-4 text-lg">Lesson Content</h4>
                  {lesson.content_sections?.map((section, i) => (
                    <div key={i} className="mb-6 p-4 bg-slate-900/50 rounded-lg">
                      <h5 className="text-white font-bold mb-2">{section.section_title}</h5>
                      <p className="text-slate-300 mb-3 text-sm leading-relaxed">{section.explanation}</p>
                      {section.examples?.length > 0 && (
                        <div className="bg-slate-950/50 p-3 rounded border border-slate-700">
                          <p className="text-cyan-400 font-bold text-xs mb-2">Examples:</p>
                          {section.examples.map((example, j) => (
                            <p key={j} className="text-slate-400 text-sm mb-1">• {example}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-300 font-bold mb-3">Practice Exercises</h4>
                  {lesson.practice_exercises?.map((exercise, i) => (
                    <p key={i} className="text-purple-200 text-sm mb-2">
                      {i + 1}. {exercise}
                    </p>
                  ))}
                </div>

                <div>
                  <h4 className="text-white font-bold mb-2">Summary</h4>
                  <p className="text-slate-300 text-sm">{lesson.summary}</p>
                </div>

                <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                  <h4 className="text-green-300 font-bold mb-2">Key Takeaways</h4>
                  {lesson.key_takeaways?.map((takeaway, i) => (
                    <p key={i} className="text-green-200 text-sm mb-1">✓ {takeaway}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <FileText className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Generate</p>
                <p className="text-slate-400">Enter lesson details and AI will create comprehensive content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}