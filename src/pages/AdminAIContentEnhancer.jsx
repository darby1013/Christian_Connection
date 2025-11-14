import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Sparkles, Loader2, Copy, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminAIContentEnhancer() {
  const [originalContent, setOriginalContent] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState(null);

  const enhanceContent = async () => {
    if (!originalContent) return alert('Please enter content to enhance');

    setEnhancing(true);
    try {
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze and enhance this content for SEO, readability, and engagement:

${originalContent}

Provide:
1. Readability score (0-100)
2. Engagement score (0-100)
3. SEO score (0-100)
4. Enhanced version (improved grammar, clarity, flow, engagement)
5. Key improvements made
6. Recommendations for further optimization`,
        response_json_schema: {
          type: 'object',
          properties: {
            readability_score: { type: 'number' },
            engagement_score: { type: 'number' },
            seo_score: { type: 'number' },
            enhanced_content: { type: 'string' },
            improvements: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            word_count_before: { type: 'number' },
            word_count_after: { type: 'number' }
          }
        }
      });

      setResult(analysisResult);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setEnhancing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Content Enhancer"
        subtitle="Improve SEO, readability, and engagement"
        icon={Sparkles}
        badge="AI"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold mb-2 block">Original Content *</label>
              <Textarea
                placeholder="Paste your content here for enhancement..."
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-96"
              />
              <p className="text-slate-500 text-xs mt-1">
                {originalContent.split(' ').filter(w => w).length} words
              </p>
            </div>

            <Button
              onClick={enhanceContent}
              disabled={enhancing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-bold h-12"
            >
              {enhancing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enhancing...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" />Enhance Content</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <p className={`text-4xl font-black mb-1 ${getScoreColor(result.readability_score)}`}>
                      {result.readability_score}
                    </p>
                    <p className="text-green-300 text-xs font-bold">Readability</p>
                    <Progress value={result.readability_score} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
                  <CardContent className="p-4 text-center">
                    <p className={`text-4xl font-black mb-1 ${getScoreColor(result.engagement_score)}`}>
                      {result.engagement_score}
                    </p>
                    <p className="text-purple-300 text-xs font-bold">Engagement</p>
                    <Progress value={result.engagement_score} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
                  <CardContent className="p-4 text-center">
                    <p className={`text-4xl font-black mb-1 ${getScoreColor(result.seo_score)}`}>
                      {result.seo_score}
                    </p>
                    <p className="text-blue-300 text-xs font-bold">SEO Score</p>
                    <Progress value={result.seo_score} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold text-lg">Enhanced Content</h4>
                    <Button 
                      size="sm" 
                      onClick={() => navigator.clipboard.writeText(result.enhanced_content)}
                      variant="outline"
                      className="border-slate-600"
                    >
                      <Copy className="w-3 h-3 mr-1" />Copy
                    </Button>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {result.enhanced_content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <p className="text-slate-500">{result.word_count_after} words</p>
                    <Badge className="bg-green-500">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Improved
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-6">
                  <h4 className="text-green-300 font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Key Improvements Made
                  </h4>
                  <ul className="space-y-2">
                    {result.improvements?.map((improvement, i) => (
                      <li key={i} className="text-green-200 text-sm flex items-start gap-2">
                        <span className="text-green-400 font-bold">✓</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-amber-900/20 border-amber-500/30">
                <CardContent className="p-6">
                  <h4 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Further Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations?.map((rec, i) => (
                      <li key={i} className="text-amber-200 text-sm flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Sparkles className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Enhance</p>
                <p className="text-slate-400">AI will analyze and improve your content for better performance</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}