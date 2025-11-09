import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wand2, RefreshCw, FileText, CheckCircle, Loader2, Video, Book, Brain
} from "lucide-react";

export default function AILessonGenerator({ courseId, moduleId, moduleName, onLessonCreated }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lessonPrompt, setLessonPrompt] = useState({
    topic: '',
    contentType: 'text',
    duration: 30,
    includeScripture: true,
    includeQuiz: true
  });
  const [generatedLesson, setGeneratedLesson] = useState(null);
  
  const queryClient = useQueryClient();

  const createLessonMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseLesson.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseLessons'] });
      if (onLessonCreated) onLessonCreated();
    },
  });

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerateLesson = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedLesson(null);

    try {
      setProgress(15);
      await sleep(600);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD in Biblical Studies. Create a comprehensive ${lessonPrompt.duration}-minute lesson on "${lessonPrompt.topic}" for the module "${moduleName}".

LESSON REQUIREMENTS:
- Content Type: ${lessonPrompt.contentType}
- Duration: ${lessonPrompt.duration} minutes
- Include Scripture: ${lessonPrompt.includeScripture ? 'Yes' : 'No'}
- Include Quiz: ${lessonPrompt.includeQuiz ? 'Yes' : 'No'}

Create a lesson with:
1. **Engaging Title**: Compelling and descriptive
2. **Clear Description**: What students will learn
3. **Learning Objectives**: 3-5 specific outcomes
4. **Core Content**: Rich, biblically-grounded teaching
5. **Scripture References**: Relevant Bible passages with context
6. **Discussion Questions**: 3-5 thought-provoking questions
7. **Practical Application**: How to apply this in daily life
8. **Reflection Prompts**: For journaling and meditation
${lessonPrompt.includeQuiz ? '9. **Assessment Questions**: 5 multiple-choice questions with answers' : ''}

Make it transformative and academically rigorous yet accessible.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            learning_objectives: {
              type: "array",
              items: { type: "string" }
            },
            content: { type: "string" },
            scripture_references: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reference: { type: "string" },
                  context: { type: "string" }
                }
              }
            },
            discussion_questions: {
              type: "array",
              items: { type: "string" }
            },
            practical_application: { type: "string" },
            reflection_prompts: {
              type: "array",
              items: { type: "string" }
            },
            quiz_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correct_answer: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setProgress(100);
      setGeneratedLesson(result);

    } catch (error) {
      alert('Error generating lesson: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!generatedLesson) return;

    try {
      const lessonData = {
        course_id: courseId,
        module_id: moduleId,
        title: generatedLesson.title,
        description: generatedLesson.description,
        content_type: lessonPrompt.contentType,
        text_content: generatedLesson.content,
        duration_minutes: lessonPrompt.duration,
        order: 1,
        is_preview: false
      };

      await createLessonMutation.mutateAsync(lessonData);
      alert('✅ Lesson created successfully!');
      setGeneratedLesson(null);
      setLessonPrompt({
        topic: '',
        contentType: 'text',
        duration: 30,
        includeScripture: true,
        includeQuiz: true
      });
    } catch (error) {
      alert('Error creating lesson: ' + error.message);
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          AI Lesson Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generating && !generatedLesson ? (
          <>
            <div>
              <Label className="text-white mb-2 block">Lesson Topic</Label>
              <input
                type="text"
                placeholder="e.g., Understanding Grace Through Romans 5"
                value={lessonPrompt.topic}
                onChange={(e) => setLessonPrompt({...lessonPrompt, topic: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Content Type</Label>
                <select
                  value={lessonPrompt.contentType}
                  onChange={(e) => setLessonPrompt({...lessonPrompt, contentType: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="text">Text Lesson</option>
                  <option value="video">Video Lesson</option>
                  <option value="quiz">Quiz/Assessment</option>
                </select>
              </div>

              <div>
                <Label className="text-white mb-2 block">Duration (minutes)</Label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={lessonPrompt.duration}
                  onChange={(e) => setLessonPrompt({...lessonPrompt, duration: parseInt(e.target.value)})}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lessonPrompt.includeScripture}
                  onChange={(e) => setLessonPrompt({...lessonPrompt, includeScripture: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white text-sm">Include Scripture</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lessonPrompt.includeQuiz}
                  onChange={(e) => setLessonPrompt({...lessonPrompt, includeQuiz: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white text-sm">Include Quiz</Label>
              </div>
            </div>

            <Button
              onClick={handleGenerateLesson}
              disabled={!lessonPrompt.topic}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Lesson
            </Button>
          </>
        ) : generating ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-slate-400 text-sm">
              Creating comprehensive lesson content...
            </p>
          </div>
        ) : generatedLesson ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                {generatedLesson.title}
              </h4>
              <p className="text-slate-300 text-sm">{generatedLesson.description}</p>
            </div>

            {generatedLesson.learning_objectives && (
              <div>
                <h5 className="text-white font-semibold mb-2 text-sm">Learning Objectives:</h5>
                <ul className="space-y-1">
                  {generatedLesson.learning_objectives.map((obj, idx) => (
                    <li key={idx} className="text-slate-400 text-sm">• {obj}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreateLesson}
                disabled={createLessonMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {createLessonMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" />Create Lesson</>
                )}
              </Button>
              <Button
                onClick={() => setGeneratedLesson(null)}
                variant="outline"
                className="border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}