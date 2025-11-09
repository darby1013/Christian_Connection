import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wand2, RefreshCw, Award, FileText } from "lucide-react";

export default function AIAssessmentBuilder({ courses }) {
  const [generating, setGenerating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assessmentType, setAssessmentType] = useState('final_exam');
  const [generatedAssessment, setGeneratedAssessment] = useState(null);

  const handleGenerate = async () => {
    if (!selectedCourse) return;

    setGenerating(true);
    try {
      const course = courses.find(c => c.id === selectedCourse);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD. Create a comprehensive ${assessmentType.replace('_', ' ')} for "${course?.title}".

Create:
1. **Assessment Overview**: Purpose and structure
2. **Multiple Choice Section**: 10-15 questions testing knowledge
3. **Short Answer Section**: 5 questions requiring written responses
4. **Essay/Project Section**: 1-2 comprehensive questions
5. **Grading Rubric**: Clear criteria for evaluation
6. **Expected Responses**: Example answers for reference

Make it academically rigorous yet achievable, testing both knowledge and application.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            overview: { type: "string" },
            time_limit_minutes: { type: "number" },
            total_points: { type: "number" },
            multiple_choice: {
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
                  points: { type: "number" }
                }
              }
            },
            short_answer: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  expected_response: { type: "string" },
                  points: { type: "number" }
                }
              }
            },
            essay_questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  rubric: { type: "string" },
                  points: { type: "number" }
                }
              }
            },
            grading_guidelines: { type: "string" }
          }
        }
      });

      setGeneratedAssessment(result);
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
          <Award className="w-6 h-6 text-amber-400" />
          AI Assessment Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedAssessment ? (
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
              <Label className="text-white mb-2 block">Assessment Type</Label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="final_exam">Final Exam</option>
                <option value="midterm">Midterm Assessment</option>
                <option value="project">Capstone Project</option>
                <option value="practical">Practical Application</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedCourse}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Assessment</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg sticky top-0 z-10 backdrop-blur-sm">
              <h4 className="text-white font-bold text-lg mb-2">{generatedAssessment.title}</h4>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Time:</span>
                  <span className="text-white font-semibold ml-1">{generatedAssessment.time_limit_minutes} min</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Points:</span>
                  <span className="text-white font-semibold ml-1">{generatedAssessment.total_points}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-white font-bold mb-3">Multiple Choice ({generatedAssessment.multiple_choice?.length} questions)</h5>
              {generatedAssessment.multiple_choice?.slice(0, 3).map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg mb-2">
                  <p className="text-white font-semibold mb-2">{idx + 1}. {q.question}</p>
                  <div className="space-y-1">
                    {q.options.map((opt, oidx) => (
                      <p key={oidx} className={`text-sm ${oidx === q.correct_answer ? 'text-green-400' : 'text-slate-400'}`}>
                        {String.fromCharCode(65 + oidx)}. {opt}
                      </p>
                    ))}
                  </div>
                  <Badge className="bg-cyan-500 mt-2 text-xs">{q.points} points</Badge>
                </div>
              ))}
              <p className="text-slate-500 text-sm">+ {generatedAssessment.multiple_choice?.length - 3} more questions</p>
            </div>

            <div>
              <h5 className="text-white font-bold mb-3">Short Answer</h5>
              {generatedAssessment.short_answer?.slice(0, 2).map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg mb-2">
                  <p className="text-white font-semibold mb-2">{q.question}</p>
                  <p className="text-slate-400 text-xs">{q.expected_response}</p>
                  <Badge className="bg-purple-500 mt-2 text-xs">{q.points} points</Badge>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setGeneratedAssessment(null)}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Create Another Assessment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}