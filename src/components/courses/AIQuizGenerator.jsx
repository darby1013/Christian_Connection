import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wand2, CheckCircle, RefreshCw, FileQuestion } from "lucide-react";

export default function AIQuizGenerator({ courses, modules }) {
  const [generating, setGenerating] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('mixed');
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  const handleGenerateQuiz = async () => {
    if (!selectedCourse || !quizTopic) return;

    setGenerating(true);
    try {
      const course = courses.find(c => c.id === selectedCourse);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD in Biblical Studies. Create a ${difficulty} difficulty quiz with ${questionCount} questions on "${quizTopic}" for the course "${course?.title}".

Create thoughtful multiple-choice questions that:
1. Test biblical knowledge and understanding
2. Require critical thinking, not just memorization
3. Include relevant scripture references
4. Provide educational explanations for answers
5. Cover different aspects of the topic

For each question:
- Write a clear, concise question
- Provide 4 answer options
- Indicate the correct answer (0-3)
- Write a detailed explanation of why the answer is correct
- Include supporting scripture if relevant`,
        response_json_schema: {
          type: "object",
          properties: {
            quiz_title: { type: "string" },
            questions: {
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
                  explanation: { type: "string" },
                  scripture_reference: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedQuiz(result);
    } catch (error) {
      alert('Error generating quiz: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <FileQuestion className="w-6 h-6 text-purple-400" />
          AI Quiz Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedQuiz ? (
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
              <Label className="text-white mb-2 block">Quiz Topic</Label>
              <input
                type="text"
                placeholder="e.g., The Parables of Jesus"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Number of Questions</Label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="mixed">Mixed</option>
                  <option value="challenging">Challenging</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerateQuiz}
              disabled={generating || !selectedCourse || !quizTopic}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating Quiz...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Quiz</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                {generatedQuiz.quiz_title}
              </h4>
              <Badge className="bg-purple-500">{generatedQuiz.questions?.length} Questions</Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedQuiz.questions?.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <p className="text-white font-semibold mb-2">{idx + 1}. {q.question}</p>
                  <ul className="space-y-1 mb-2">
                    {q.options.map((option, optIdx) => (
                      <li
                        key={optIdx}
                        className={`text-sm ${
                          optIdx === q.correct_answer
                            ? 'text-green-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}. {option}
                        {optIdx === q.correct_answer && ' ✓'}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500">{q.explanation}</p>
                  {q.scripture_reference && (
                    <Badge className="bg-cyan-500 mt-2 text-xs">{q.scripture_reference}</Badge>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setGeneratedQuiz(null)}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Create Another Quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}