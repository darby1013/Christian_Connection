import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Send } from 'lucide-react';

export default function ProductQA({ productId }) {
  const [user, setUser] = useState(null);
  const [question, setQuestion] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [answer, setAnswer] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
  }, []);

  const { data: questions = [] } = useQuery({
    queryKey: ['productQuestions', productId],
    queryFn: () => base44.entities.ProductQuestion.filter({ product_id: productId, is_public: true }),
    initialData: []
  });

  const askMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductQuestion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productQuestions']);
      setQuestion('');
      alert('✅ Question posted!');
    }
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductQuestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productQuestions']);
      setAnsweringId(null);
      setAnswer('');
      alert('✅ Answer posted!');
    }
  });

  const helpfulMutation = useMutation({
    mutationFn: ({ id, count }) => base44.entities.ProductQuestion.update(id, { helpful_count: count + 1 }),
    onSuccess: () => queryClient.invalidateQueries(['productQuestions'])
  });

  const handleAskQuestion = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    askMutation.mutate({
      product_id: productId,
      user_id: user.id,
      user_name: user.full_name,
      question
    });
  };

  const handleAnswer = (questionId) => {
    answerMutation.mutate({
      id: questionId,
      data: {
        answer,
        answered_by: user?.full_name || 'Staff',
        answered_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-6 h-6 text-cyan-400" />
        <h3 className="text-white font-black text-2xl">Questions & Answers</h3>
        <Badge className="bg-cyan-500">{questions.length}</Badge>
      </div>

      {/* Ask Question */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-6">
          <h4 className="text-white font-bold mb-3">Have a question about this product?</h4>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question here..."
            className="bg-slate-800 border-slate-700 text-white mb-3"
          />
          <Button onClick={handleAskQuestion} className="bg-gradient-to-r from-cyan-600 to-blue-600">
            <Send className="w-4 h-4 mr-2" />
            Ask Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map(q => (
          <Card key={q.id} className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-bold">{q.user_name}</p>
                    <p className="text-slate-400 text-xs">{new Date(q.created_date).toLocaleDateString()}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => helpfulMutation.mutate({ id: q.id, count: q.helpful_count || 0 })}
                    className="text-slate-400 hover:text-cyan-400"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {q.helpful_count || 0}
                  </Button>
                </div>
                <p className="text-slate-300"><strong>Q:</strong> {q.question}</p>
              </div>

              {q.answer ? (
                <div className="pl-6 border-l-2 border-cyan-500">
                  <p className="text-cyan-400 font-bold text-sm mb-1">
                    {q.answered_by} • {new Date(q.answered_at).toLocaleDateString()}
                  </p>
                  <p className="text-slate-300"><strong>A:</strong> {q.answer}</p>
                </div>
              ) : (
                <div className="pl-6">
                  {answeringId === q.id ? (
                    <div>
                      <Textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="bg-slate-800 border-slate-700 text-white mb-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAnswer(q.id)} className="bg-cyan-600">
                          Post Answer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAnsweringId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    user && (
                      <Button size="sm" variant="outline" onClick={() => setAnsweringId(q.id)}>
                        Answer This Question
                      </Button>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}