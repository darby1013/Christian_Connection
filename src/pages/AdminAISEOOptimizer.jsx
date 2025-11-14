import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Search, Sparkles, Loader2, TrendingUp, AlertTriangle, CheckCircle, Target, Hash, Link2, FileText } from 'lucide-react';

export default function AdminAISEOOptimizer() {
  const [content, setContent] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState(null);

  const analyzeSEO = async () => {
    if (!content) return alert('Please enter content to analyze');

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform comprehensive SEO analysis on this content:

${content}

${targetKeyword ? `Target Keyword: ${targetKeyword}` : ''}

Analyze and provide:
1. Overall SEO score (0-100)
2. Keyword density and optimization
3. Content structure analysis
4. Meta tags evaluation
5. Readability assessment
6. Internal linking opportunities
7. Specific recommendations (10-15 actionable items)
8. Competitor analysis insights
9. Content gaps to address`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number' },
            scores: {
              type: 'object',
              properties: {
                keyword_optimization: { type: 'number' },
                content_structure: { type: 'number' },
                meta_tags: { type: 'number' },
                readability: { type: 'number' },
                internal_linking: { type: 'number' },
                mobile_optimization: { type: 'number' }
              }
            },
            keyword_analysis: {
              type: 'object',
              properties: {
                primary_keyword_density: { type: 'number' },
                keyword_placement: { type: 'string' },
                related_keywords: { type: 'array', items: { type: 'string' } }
              }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string' },
                  category: { type: 'string' },
                  recommendation: { type: 'string' },
                  impact: { type: 'string' }
                }
              }
            },
            content_gaps: { type: 'array', items: { type: 'string' } },
            suggested_headings: { type: 'array', items: { type: 'string' } },
            internal_link_suggestions: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setSeoAnalysis(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI SEO Optimizer"
        subtitle="Comprehensive SEO analysis and recommendations"
        icon={Search}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Content to Analyze *</label>
              <Textarea
                placeholder="Paste your blog post, article, or page content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-64"
              />
              <p className="text-slate-500 text-xs mt-1">
                {content.split(' ').filter(w => w).length} words
              </p>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Target Keyword (optional)</label>
              <Input
                placeholder="e.g., digital marketing strategies"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={analyzeSEO}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 font-bold h-12"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Search className="w-5 h-5 mr-2" />Analyze SEO</>
              )}
            </Button>

            {seoAnalysis && (
              <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
                <CardContent className="p-4 text-center">
                  <p className={`text-5xl font-black mb-2 ${getScoreColor(seoAnalysis.overall_score)}`}>
                    {seoAnalysis.overall_score}
                  </p>
                  <p className="text-amber-300 font-bold text-sm mb-2">Overall SEO Score</p>
                  <Progress value={seoAnalysis.overall_score} className="h-3" />
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {seoAnalysis ? (
            <Tabs defaultValue="scores">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="scores" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(seoAnalysis.scores || {}).map(([key, value]) => (
                    <Card key={key} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white font-bold text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className={`text-2xl font-black ${getScoreColor(value)}`}>{value}</p>
                        </div>
                        <Progress value={value} className="h-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-4">
                <div className="space-y-3">
                  {seoAnalysis.recommendations?.map((rec, i) => (
                    <Card key={i} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-2">
                            <Badge className={getPriorityBadge(rec.priority)}>
                              {rec.priority?.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-800 text-xs">
                              {rec.category}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold mb-2">{rec.recommendation}</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-green-400" />
                              <p className="text-green-400 text-xs font-bold">Impact: {rec.impact}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="keywords" className="mt-4">
                <div className="space-y-4">
                  <Card className="bg-blue-900/20 border-blue-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Hash className="w-6 h-6 text-blue-400" />
                        <div>
                          <h4 className="text-blue-300 font-bold">Keyword Analysis</h4>
                          <p className="text-blue-200 text-xs">Density: {seoAnalysis.keyword_analysis?.primary_keyword_density}%</p>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded">
                        <p className="text-slate-300 text-sm">{seoAnalysis.keyword_analysis?.keyword_placement}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-900/20 border-purple-500/30">
                    <CardContent className="p-6">
                      <h4 className="text-purple-300 font-bold mb-3">Related Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {seoAnalysis.keyword_analysis?.related_keywords?.map((kw, i) => (
                          <Badge key={i} className="bg-purple-500">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-900/20 border-amber-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <h4 className="text-amber-300 font-bold">Content Gaps</h4>
                      </div>
                      <ul className="space-y-2">
                        {seoAnalysis.content_gaps?.map((gap, i) => (
                          <li key={i} className="text-amber-200 text-sm">• {gap}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-cyan-900/20 border-cyan-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-cyan-300 font-bold">Suggested Headings</h4>
                      </div>
                      <ul className="space-y-2">
                        {seoAnalysis.suggested_headings?.map((heading, i) => (
                          <li key={i} className="text-cyan-200 text-sm p-2 bg-slate-900/50 rounded">
                            {heading}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-900/20 border-green-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-5 h-5 text-green-400" />
                        <h4 className="text-green-300 font-bold">Internal Link Suggestions</h4>
                      </div>
                      <ul className="space-y-2">
                        {seoAnalysis.internal_link_suggestions?.map((link, i) => (
                          <li key={i} className="text-green-200 text-sm p-2 bg-slate-900/50 rounded">
                            {link}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Search className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Optimize</p>
                <p className="text-slate-400 mb-4">AI will analyze your content and provide detailed SEO recommendations</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge className="bg-slate-700">✓ Keyword Analysis</Badge>
                  <Badge className="bg-slate-700">✓ Content Structure</Badge>
                  <Badge className="bg-slate-700">✓ Meta Tags</Badge>
                  <Badge className="bg-slate-700">✓ Readability</Badge>
                  <Badge className="bg-slate-700">✓ Link Opportunities</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}