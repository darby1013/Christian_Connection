import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { BookOpen, Sparkles, Loader2, Download, Copy, CheckCircle } from 'lucide-react';

export default function AdminAICourseCreator() {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [duration, setDuration] = useState('');
  const [generating, setGenerating] = useState(false);
  const [courseOutline, setCourseOutline] = useState(null);

  const generateCourse = async () => {
    if (!topic) {
      alert('Please enter a course topic');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive course outline for: "${topic}"
        
Target Audience: ${targetAudience || 'General audience'}
Duration: ${duration || 'Standard duration'}

Generate a complete course structure with:
1. Course title and description
2. Learning objectives (5-7 key objectives)
3. Prerequisites (if any)
4. Module breakdown (5-8 modules)
   - For each module: title, description, topics covered, estimated time
5. Assessment strategy
6. Additional resources recommendations`,
        response_json_schema: {
          type: 'object',
          properties: {
            course_title: { type: 'string' },
            description: { type: 'string' },
            learning_objectives: { type: 'array', items: { type: 'string' } },
            prerequisites: { type: 'array', items: { type: 'string' } },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  module_number: { type: 'number' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  topics: { type: 'array', items: { type: 'string' } },
                  estimated_hours: { type: 'number' }
                }
              }
            },
            assessment_strategy: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setCourseOutline(result);
    } catch (error) {
      alert('Error generating course: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyOutline = () => {
    navigator.clipboard.writeText(JSON.stringify(courseOutline, null, 2));
    alert('Course outline copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Course Creator"
        subtitle="Generate complete course structures with AI"
        icon={BookOpen}
        badge="AI POWERED"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Course Topic *</label>
              <Input
                placeholder="e.g., Digital Marketing Fundamentals"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Target Audience</label>
              <Input
                placeholder="e.g., Beginners, Professionals"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Course Duration</label>
              <Input
                placeholder="e.g., 6 weeks, 20 hours"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={generateCourse}
              disabled={generating || !topic}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 font-bold h-12"
            >
              {generating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" />Generate Course</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {courseOutline ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">{courseOutline.course_title}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={copyOutline} variant="outline" className="border-slate-600">
                      <Copy className="w-3 h-3 mr-1" />Copy
                    </Button>
                    <Button size="sm" className="bg-green-500">
                      <Download className="w-3 h-3 mr-1" />Export
                    </Button>
                  </div>
                </div>

                <p className="text-slate-300">{courseOutline.description}</p>

                <div>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {courseOutline.learning_objectives?.map((obj, i) => (
                      <li key={i} className="text-slate-300 flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                {courseOutline.prerequisites?.length > 0 && (
                  <div>
                    <h4 className="text-white font-bold mb-2">Prerequisites</h4>
                    <div className="flex flex-wrap gap-2">
                      {courseOutline.prerequisites.map((pre, i) => (
                        <Badge key={i} className="bg-amber-500">{pre}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-white font-bold mb-4 text-xl">Course Modules ({courseOutline.modules?.length})</h4>
                  <div className="space-y-4">
                    {courseOutline.modules?.map((module, i) => (
                      <Card key={i} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className="bg-cyan-500 mb-2">Module {module.module_number}</Badge>
                              <h5 className="text-white font-bold text-lg">{module.title}</h5>
                            </div>
                            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                              {module.estimated_hours}h
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mb-3">{module.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {module.topics?.map((topic, j) => (
                              <Badge key={j} variant="secondary" className="bg-slate-800 text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {courseOutline.assessment_strategy && (
                  <div>
                    <h4 className="text-white font-bold mb-2">Assessment Strategy</h4>
                    <p className="text-slate-300 text-sm">{courseOutline.assessment_strategy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <BookOpen className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Create</p>
                <p className="text-slate-400">Enter course details and click Generate to create your AI-powered course outline</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}