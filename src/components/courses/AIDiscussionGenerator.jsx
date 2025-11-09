import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wand2, RefreshCw, MessageSquare, Users } from "lucide-react";

export default function AIDiscussionGenerator({ courses }) {
  const [generating, setGenerating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [discussionType, setDiscussionType] = useState('small_group');
  const [generatedDiscussions, setGeneratedDiscussions] = useState(null);

  const handleGenerate = async () => {
    if (!selectedCourse || !lessonTopic) return;

    setGenerating(true);
    try {
      const course = courses.find(c => c.id === selectedCourse);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD. Create ${discussionType === 'small_group' ? 'small group' : 'class'} discussion questions for "${lessonTopic}" in "${course?.title}".

Create 8-10 discussion questions that:
1. Promote deep reflection and biblical thinking
2. Encourage personal sharing and vulnerability
3. Connect scripture to real-life situations
4. Build community and mutual edification
5. Lead to practical application

Include:
- Ice-breaker questions (2)
- Deep dive questions (4-5)
- Application questions (2-3)
- Closing reflection (1)

For each question, provide:
- The question itself
- Why this question matters (purpose)
- Expected responses or discussion directions
- Related scripture passages`,
        response_json_schema: {
          type: "object",
          properties: {
            ice_breakers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            deep_dive: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  purpose: { type: "string" },
                  scripture: { type: "string" }
                }
              }
            },
            application: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            closing: { type: "string" }
          }
        }
      });

      setGeneratedDiscussions(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-cyan-400" />
          AI Discussion Question Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedDiscussions ? (
          <>
            <div>
              <Label className="text-white mb-2 block">Select Course</Label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Lesson Topic</Label>
              <input
                type="text"
                placeholder="e.g., Forgiveness and Reconciliation"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Discussion Type</Label>
              <select
                value={discussionType}
                onChange={(e) => setDiscussionType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="small_group">Small Group (6-12 people)</option>
                <option value="class">Large Class (20+ people)</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedCourse || !lessonTopic}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Discussion Questions</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Ice Breakers
              </h4>
              {generatedDiscussions.ice_breakers?.map((q, idx) => (
                <div key={idx} className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg mb-2">
                  <p className="text-white font-semibold mb-1">{q.question}</p>
                  <p className="text-xs text-slate-400">{q.purpose}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Deep Dive Questions</h4>
              {generatedDiscussions.deep_dive?.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg mb-2">
                  <p className="text-white font-semibold mb-1">{q.question}</p>
                  <p className="text-xs text-slate-400 mb-2">{q.purpose}</p>
                  {q.scripture && (
                    <Badge className="bg-cyan-500 text-xs">{q.scripture}</Badge>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Application Questions</h4>
              {generatedDiscussions.application?.map((q, idx) => (
                <div key={idx} className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg mb-2">
                  <p className="text-white font-semibold mb-1">{q.question}</p>
                  <p className="text-xs text-slate-400">{q.purpose}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <h4 className="text-white font-bold mb-2">Closing Reflection</h4>
              <p className="text-slate-300">{generatedDiscussions.closing}</p>
            </div>

            <Button
              onClick={() => setGeneratedDiscussions(null)}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Create More Questions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}