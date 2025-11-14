import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { TrendingUp, Sparkles, Loader2, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminAILearningPathOptimizer() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const { data: courseProgress = [] } = useQuery({
    queryKey: ['courseProgress'],
    queryFn: () => base44.entities.CourseProgress.list(),
    initialData: []
  });

  const analyzeStudent = async () => {
    if (!selectedStudent) return alert('Please select a student');

    setAnalyzing(true);
    try {
      const studentProgress = courseProgress.filter(p => p.user_id === selectedStudent);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this student's learning progress and create a personalized learning path:

Student has completed ${studentProgress.length} courses.
Progress data: ${JSON.stringify(studentProgress.slice(0, 5))}

Generate:
1. Overall performance assessment
2. Strengths (3-5 areas)
3. Areas for improvement (3-5 areas)
4. Knowledge gaps identified
5. Recommended next courses (5 suggestions with reasoning)
6. Learning style recommendations
7. Personalized study plan`,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number' },
            performance_summary: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            knowledge_gaps: { type: 'array', items: { type: 'string' } },
            recommended_courses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  course_title: { type: 'string' },
                  reason: { type: 'string' },
                  priority: { type: 'string' }
                }
              }
            },
            study_plan: { type: 'string' }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Learning Path Optimizer"
        subtitle="Personalize student learning journeys with AI"
        icon={TrendingUp}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Select Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {users.slice(0, 20).map(user => (
                    <SelectItem key={user.id} value={user.id} className="text-white">
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={analyzeStudent}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 font-bold h-12"
            >
              {analyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="w-5 h-5 mr-2" />Analyze & Optimize</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {analysis ? (
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-black text-xl">Overall Performance</h3>
                    <div className="text-right">
                      <p className="text-4xl font-black text-white">{analysis.overall_score}%</p>
                      <p className="text-slate-400 text-xs">Score</p>
                    </div>
                  </div>
                  <Progress value={analysis.overall_score} className="h-3 mb-3" />
                  <p className="text-slate-300 text-sm">{analysis.performance_summary}</p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-green-900/20 border-green-500/30">
                  <CardContent className="p-6">
                    <h4 className="text-green-300 font-bold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strengths?.map((s, i) => (
                        <li key={i} className="text-green-200 text-sm">✓ {s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-amber-900/20 border-amber-500/30">
                  <CardContent className="p-6">
                    <h4 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />Areas to Improve
                    </h4>
                    <ul className="space-y-2">
                      {analysis.improvements?.map((s, i) => (
                        <li key={i} className="text-amber-200 text-sm">• {s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
                <CardContent className="p-6">
                  <h4 className="text-white font-bold mb-4 text-lg">Recommended Learning Path</h4>
                  <div className="space-y-3">
                    {analysis.recommended_courses?.map((course, i) => (
                      <div key={i} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-white font-bold">{course.course_title}</h5>
                          <Badge className={
                            course.priority === 'high' ? 'bg-red-500' :
                            course.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'
                          }>
                            {course.priority?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{course.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <TrendingUp className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Analyze</p>
                <p className="text-slate-400">Select a student to generate personalized recommendations</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}