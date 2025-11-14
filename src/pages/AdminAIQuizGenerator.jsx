import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Target, Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminAIQuizGenerator() {
  const [content, setContent] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice', 'true_false']);
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const generateQuiz = async () => {
    if (!content) {
      alert('Please enter content for the quiz');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following content, create a comprehensive quiz with ${questionCount} questions:

${content}

Question types to include: ${questionTypes.join(', ')}

For each question provide:
- Question text
- Type (multiple_choice, true_false, short_answer)
- Options (for multiple choice)
- Correct answer
- Explanation of why the answer is correct`,
        response_json_schema: {
          type: 'object',
          properties: {
            quiz_title: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  type: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correct_answer: { type: 'string' },
                  explanation: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setQuiz(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleQuestionType = (type) => {
    if (questionTypes.includes(type)) {
      setQuestionTypes(questionTypes.filter(t => t !== type));
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Quiz Generator"
        subtitle="Auto-create assessments from your content"
        icon={Target}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Course Content *</label>
              <Textarea
                placeholder="Paste lesson content, transcript, or notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-40"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Number of Questions</label>
              <Input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                min="5"
                max="50"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-3 block">Question Types</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={questionTypes.includes('multiple_choice')} 
                    onCheckedChange={() => toggleQuestionType('multiple_choice')}
                  />
                  <span className="text-slate-300 text-sm">Multiple Choice</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={questionTypes.includes('true_false')} 
                    onCheckedChange={() => toggleQuestionType('true_false')}
                  />
                  <span className="text-slate-300 text-sm">True/False</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={questionTypes.includes('short_answer')} 
                    onCheckedChange={() => toggleQuestionType('short_answer')}
                  />
                  <span className="text-slate-300 text-sm">Short Answer</span>
                </label>
              </div>
            </div>

            <Button
              onClick={generateQuiz}
              disabled={generating}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Quiz</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {quiz ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-2xl font-black text-white mb-4">{quiz.quiz_title}</h3>

                <div className="space-y-4">
                  {quiz.questions?.map((q, i) => (
                    <Card key={i} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Badge className="bg-cyan-500 shrink-0">Q{i + 1}</Badge>
                          <p className="text-white font-bold">{q.question}</p>
                        </div>

                        {q.type === 'multiple_choice' && (
                          <div className="space-y-2 ml-8">
                            {q.options?.map((option, j) => (
                              <div key={j} className={`p-2 rounded ${option === q.correct_answer ? 'bg-green-900/30 border border-green-500/30' : 'bg-slate-800/50'}`}>
                                <div className="flex items-center gap-2">
                                  {option === q.correct_answer ? 
                                    <CheckCircle className="w-4 h-4 text-green-400" /> :
                                    <XCircle className="w-4 h-4 text-slate-600" />
                                  }
                                  <span className={option === q.correct_answer ? 'text-green-300 font-semibold' : 'text-slate-400'}>{option}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div className="ml-8 flex gap-3">
                            <Badge className={q.correct_answer === 'true' ? 'bg-green-500' : 'bg-slate-700'}>True</Badge>
                            <Badge className={q.correct_answer === 'false' ? 'bg-green-500' : 'bg-slate-700'}>False</Badge>
                          </div>
                        )}

                        {q.explanation && (
                          <div className="mt-3 ml-8 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                            <p className="text-blue-300 text-xs font-bold mb-1">Explanation:</p>
                            <p className="text-blue-200 text-sm">{q.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Target className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Create Quiz</p>
                <p className="text-slate-400">Paste your content and AI will generate assessment questions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}