import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, RefreshCw, Target, TrendingUp } from "lucide-react";

export default function AILearningPathOptimizer({ courses }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState(null);

  const handleOptimize = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD in Education and Biblical Studies. Analyze these ${courses.length} courses and create an optimal learning path strategy.

Current Courses:
${courses.map(c => `- ${c.title} (${c.difficulty_level}, ${c.duration_hours}hrs, ${c.enrollment_count || 0} students)`).join('\n')}

Provide:
1. **Recommended Learning Paths**: Sequential course progressions for different learner types
2. **Course Gaps**: Missing courses that would complete the curriculum
3. **Difficulty Progression**: Optimal sequencing from beginner to advanced
4. **Content Balance**: Analysis of topic coverage and balance
5. **Engagement Strategies**: Ways to improve course completion rates
6. **New Course Recommendations**: 3-5 courses that would fill gaps or expand offerings`,
        response_json_schema: {
          type: "object",
          properties: {
            learning_paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path_name: { type: "string" },
                  target_learner: { type: "string" },
                  courses_sequence: {
                    type: "array",
                    items: { type: "string" }
                  },
                  total_duration: { type: "string" },
                  expected_outcomes: { type: "string" }
                }
              }
            },
            course_gaps: {
              type: "array",
              items: { type: "string" }
            },
            new_course_ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  rationale: { type: "string" },
                  target_audience: { type: "string" }
                }
              }
            },
            optimization_tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setOptimization(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-green-400" />
          AI Learning Path Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!optimization ? (
          <>
            <p className="text-slate-300">
              Analyze your course catalog and receive AI-powered recommendations for optimal learning paths,
              course sequencing, and curriculum gaps.
            </p>
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <p className="text-white font-semibold mb-2">Current Catalog:</p>
              <p className="text-cyan-400 text-2xl font-black">{courses.length} Courses</p>
            </div>
            <Button
              onClick={handleOptimize}
              disabled={analyzing || courses.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {analyzing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Optimize Learning Paths</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Recommended Learning Paths
              </h4>
              {optimization.learning_paths?.map((path, idx) => (
                <div key={idx} className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg mb-3">
                  <h5 className="text-white font-bold mb-1">{path.path_name}</h5>
                  <Badge className="bg-green-500 mb-2">{path.target_learner}</Badge>
                  <p className="text-slate-300 text-sm mb-2">{path.expected_outcomes}</p>
                  <p className="text-xs text-slate-400">Duration: {path.total_duration}</p>
                  <div className="mt-2 space-y-1">
                    {path.courses_sequence?.map((course, cidx) => (
                      <div key={cidx} className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">{cidx + 1}.</span>
                        <span className="text-slate-300 text-sm">{course}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">Identified Course Gaps</h4>
              <ul className="space-y-2">
                {optimization.course_gaps?.map((gap, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3">New Course Recommendations</h4>
              {optimization.new_course_ideas?.map((idea, idx) => (
                <div key={idx} className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg mb-2">
                  <h5 className="text-white font-semibold mb-1">{idea.title}</h5>
                  <Badge className="bg-purple-500 mb-2 text-xs">{idea.target_audience}</Badge>
                  <p className="text-slate-400 text-sm">{idea.rationale}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setOptimization(null)}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Run Another Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}