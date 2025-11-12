import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp, RefreshCw, CheckCircle, AlertCircle, Copy,
  Search, Tag, Link2, BarChart3, Sparkles, Save, Eye,
  Target, Zap, Globe, Award
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminAISEOOptimizer() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState(null);
  const [optimizedContent, setOptimizedContent] = useState(null);

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('✅ SEO optimizations applied!');
    },
  });

  const analyzeProductSEO = async () => {
    if (!selectedProduct) return;

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform comprehensive SEO analysis and optimization for this product:

**Product Details:**
Name: ${selectedProduct.name}
Current Description: ${selectedProduct.description || 'No description'}
Category: ${selectedProduct.category}
Price: $${selectedProduct.price}
Brand: ${selectedProduct.brand || 'Glory Wave'}
Current SEO Title: ${selectedProduct.seo_title || 'Not set'}
Current Meta Description: ${selectedProduct.seo_description || 'Not set'}
Current Keywords: ${selectedProduct.seo_keywords?.join(', ') || 'None'}

**Analysis Tasks:**

1. **CURRENT SEO AUDIT** (Score 0-100):
   - Title optimization score
   - Meta description quality
   - Keyword density and relevance
   - Content readability
   - Missing elements
   - Issues found

2. **OPTIMIZED SEO TITLE** (50-60 characters):
   - Include primary keyword
   - Brand name
   - Compelling benefit
   - Natural, not keyword-stuffed
   - Click-worthy

3. **OPTIMIZED META DESCRIPTION** (150-160 characters):
   - Primary + secondary keywords
   - Clear value proposition
   - Call to action
   - Emotional appeal
   - Natural language

4. **KEYWORD STRATEGY** (20-30 keywords):
   - Primary keywords (3-5) - high volume, high intent
   - Secondary keywords (5-10) - medium volume, specific
   - Long-tail keywords (10-15) - low competition, specific intent
   - LSI keywords (Latent Semantic Indexing)

5. **CONTENT IMPROVEMENTS**:
   - Specific suggestions for description
   - Header recommendations (H1, H2, H3 structure)
   - Internal linking opportunities
   - Content length recommendation

6. **CATEGORY CROSS-LINKING**:
   - Related categories to link to
   - Related products for internal links
   - Anchor text suggestions
   - Link building strategy

7. **COMPETITIVE ANALYSIS**:
   - What's ranking for similar products
   - Keyword gap analysis
   - Opportunities identified

8. **ACTION ITEMS** (Prioritized list):
   - Quick wins (immediate impact)
   - Medium-term improvements
   - Long-term strategy

Provide detailed, actionable SEO recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            audit: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                title_score: { type: "number" },
                description_score: { type: "number" },
                keyword_score: { type: "number" },
                content_score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }
              }
            },
            optimized_title: { type: "string" },
            optimized_description: { type: "string" },
            keywords: {
              type: "object",
              properties: {
                primary: { type: "array", items: { type: "string" } },
                secondary: { type: "array", items: { type: "string" } },
                long_tail: { type: "array", items: { type: "string" } },
                lsi: { type: "array", items: { type: "string" } }
              }
            },
            content_improvements: {
              type: "array",
              items: { type: "string" }
            },
            cross_linking: {
              type: "object",
              properties: {
                related_categories: { type: "array", items: { type: "string" } },
                anchor_texts: { type: "array", items: { type: "string" } },
                link_strategy: { type: "string" }
              }
            },
            competitive_insights: {
              type: "array",
              items: { type: "string" }
            },
            action_items: {
              type: "object",
              properties: {
                quick_wins: { type: "array", items: { type: "string" } },
                medium_term: { type: "array", items: { type: "string" } },
                long_term: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setSeoAnalysis(result);
      setOptimizedContent({
        seo_title: result.optimized_title,
        seo_description: result.optimized_description,
        seo_keywords: [
          ...result.keywords.primary,
          ...result.keywords.secondary,
          ...result.keywords.long_tail
        ]
      });

    } catch (error) {
      alert('Error analyzing SEO: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyOptimizations = async () => {
    if (!selectedProduct || !optimizedContent) return;

    await updateProductMutation.mutateAsync({
      id: selectedProduct.id,
      data: optimizedContent
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">AI SEO Optimizer</h2>
          <p className="text-slate-400 font-semibold">Analyze and optimize product SEO with AI</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          AI-Powered Analysis
        </Badge>
      </div>

      {/* Product Selection */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Select Product to Analyze</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Select onValueChange={(id) => setSelectedProduct(products.find(p => p.id === id))}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Choose a product" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
              {products.map(product => (
                <SelectItem key={product.id} value={product.id} className="text-white">
                  {product.name} - {product.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProduct && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <h3 className="text-white font-bold mb-2">{selectedProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Category:</p>
                    <p className="text-white font-semibold">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Price:</p>
                    <p className="text-cyan-400 font-bold">${selectedProduct.price}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Current SEO Title:</p>
                    <p className="text-white text-xs">{selectedProduct.seo_title || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Keywords:</p>
                    <p className="text-white text-xs">{selectedProduct.seo_keywords?.length || 0} keywords</p>
                  </div>
                </div>
                <Button
                  onClick={analyzeProductSEO}
                  disabled={analyzing}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold"
                >
                  {analyzing ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing SEO...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Analyze SEO</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* SEO Analysis Results */}
      {seoAnalysis && (
        <div className="space-y-6">
          {/* Audit Scores */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                SEO Audit Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <div className={`text-4xl font-black mb-2 ${getScoreColor(seoAnalysis.audit.overall_score)}`}>
                    {seoAnalysis.audit.overall_score}
                  </div>
                  <p className="text-slate-400 text-sm">Overall</p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <div className={`text-3xl font-black mb-2 ${getScoreColor(seoAnalysis.audit.title_score)}`}>
                    {seoAnalysis.audit.title_score}
                  </div>
                  <p className="text-slate-400 text-sm">Title</p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <div className={`text-3xl font-black mb-2 ${getScoreColor(seoAnalysis.audit.description_score)}`}>
                    {seoAnalysis.audit.description_score}
                  </div>
                  <p className="text-slate-400 text-sm">Description</p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <div className={`text-3xl font-black mb-2 ${getScoreColor(seoAnalysis.audit.keyword_score)}`}>
                    {seoAnalysis.audit.keyword_score}
                  </div>
                  <p className="text-slate-400 text-sm">Keywords</p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <div className={`text-3xl font-black mb-2 ${getScoreColor(seoAnalysis.audit.content_score)}`}>
                    {seoAnalysis.audit.content_score}
                  </div>
                  <p className="text-slate-400 text-sm">Content</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {seoAnalysis.audit.issues?.length > 0 && (
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h4 className="text-red-300 font-bold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Issues Found ({seoAnalysis.audit.issues.length})
                    </h4>
                    <ul className="space-y-2">
                      {seoAnalysis.audit.issues.map((issue, idx) => (
                        <li key={idx} className="text-red-200 text-sm flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {seoAnalysis.audit.strengths?.length > 0 && (
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <h4 className="text-green-300 font-bold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Strengths ({seoAnalysis.audit.strengths.length})
                    </h4>
                    <ul className="space-y-2">
                      {seoAnalysis.audit.strengths.map((strength, idx) => (
                        <li key={idx} className="text-green-200 text-sm flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Optimized Content */}
          <Card className="bg-[#1a1f3a] border-green-500/30">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  AI-Optimized SEO Content
                </CardTitle>
                <Button
                  onClick={applyOptimizations}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Apply All to Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* SEO Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white font-bold">Optimized SEO Title</Label>
                  <div className="flex gap-1">
                    <Badge className="bg-cyan-500">{seoAnalysis.optimized_title?.length || 0} chars</Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(seoAnalysis.optimized_title);
                        alert('Copied!');
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 h-7"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={optimizedContent?.seo_title || seoAnalysis.optimized_title}
                  onChange={(e) => setOptimizedContent({...optimizedContent, seo_title: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white font-semibold"
                />
                <p className="text-slate-400 text-xs mt-1">
                  {seoAnalysis.optimized_title?.length > 60 && '⚠️ Too long (max 60 chars recommended)'}
                  {seoAnalysis.optimized_title?.length < 50 && '⚠️ Consider longer title (50-60 chars optimal)'}
                  {seoAnalysis.optimized_title?.length >= 50 && seoAnalysis.optimized_title?.length <= 60 && '✓ Optimal length'}
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white font-bold">Optimized Meta Description</Label>
                  <div className="flex gap-1">
                    <Badge className="bg-purple-500">{seoAnalysis.optimized_description?.length || 0} chars</Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(seoAnalysis.optimized_description);
                        alert('Copied!');
                      }}
                      className="bg-purple-500 hover:bg-purple-600 h-7"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={optimizedContent?.seo_description || seoAnalysis.optimized_description}
                  onChange={(e) => setOptimizedContent({...optimizedContent, seo_description: e.target.value})}
                  className="bg-slate-900 border-slate-700 text-white h-24"
                />
                <p className="text-slate-400 text-xs mt-1">
                  {seoAnalysis.optimized_description?.length > 160 && '⚠️ Too long (max 160 chars)'}
                  {seoAnalysis.optimized_description?.length < 140 && '⚠️ Consider longer (150-160 chars optimal)'}
                  {seoAnalysis.optimized_description?.length >= 140 && seoAnalysis.optimized_description?.length <= 160 && '✓ Optimal length'}
                </p>
              </div>

              {/* Keywords */}
              <div>
                <Label className="text-white font-bold mb-3 block">Keyword Strategy</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <h5 className="text-green-300 font-bold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Primary Keywords
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {seoAnalysis.keywords.primary?.map((kw, idx) => (
                        <Badge key={idx} className="bg-green-500">{kw}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <h5 className="text-cyan-300 font-bold mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Secondary Keywords
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {seoAnalysis.keywords.secondary?.map((kw, idx) => (
                        <Badge key={idx} className="bg-cyan-500">{kw}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <h5 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Long-Tail Keywords
                    </h5>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {seoAnalysis.keywords.long_tail?.map((kw, idx) => (
                        <Badge key={idx} className="bg-purple-500 text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <h5 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      LSI Keywords
                    </h5>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {seoAnalysis.keywords.lsi?.map((kw, idx) => (
                        <Badge key={idx} className="bg-blue-500 text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cross-Linking Strategy */}
              <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
                <CardHeader className="border-b border-amber-500/30 py-3 px-4">
                  <CardTitle className="text-amber-300 font-bold text-base flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Cross-Linking Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-amber-300 text-sm mb-2 block">Related Categories to Link:</Label>
                    <div className="flex flex-wrap gap-1">
                      {seoAnalysis.cross_linking?.related_categories?.map((cat, idx) => (
                        <Badge key={idx} className="bg-amber-500">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-amber-300 text-sm mb-2 block">Anchor Text Suggestions:</Label>
                    <div className="flex flex-wrap gap-1">
                      {seoAnalysis.cross_linking?.anchor_texts?.map((text, idx) => (
                        <Badge key={idx} className="bg-orange-500 text-xs">{text}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded">
                    <p className="text-amber-200 text-sm">{seoAnalysis.cross_linking?.link_strategy}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Content Improvements */}
              <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/30">
                <CardHeader className="border-b border-blue-500/30">
                  <CardTitle className="text-blue-300 font-bold">Content Improvement Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {seoAnalysis.content_improvements?.map((improvement, idx) => (
                      <li key={idx} className="text-blue-200 text-sm flex items-start gap-2 p-2 bg-blue-900/20 rounded">
                        <Award className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                <CardHeader className="border-b border-green-500/30">
                  <CardTitle className="text-green-300 font-bold">Action Items (Prioritized)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h5 className="text-green-300 font-bold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Quick Wins (Do Now)
                    </h5>
                    <ul className="space-y-1">
                      {seoAnalysis.action_items?.quick_wins?.map((item, idx) => (
                        <li key={idx} className="text-green-200 text-sm flex items-start gap-2">
                          <span className="text-green-400">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-cyan-300 font-bold mb-2">Medium-Term (This Week)</h5>
                    <ul className="space-y-1">
                      {seoAnalysis.action_items?.medium_term?.map((item, idx) => (
                        <li key={idx} className="text-cyan-200 text-sm flex items-start gap-2">
                          <span className="text-cyan-400">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-purple-300 font-bold mb-2">Long-Term Strategy (This Month)</h5>
                    <ul className="space-y-1">
                      {seoAnalysis.action_items?.long_term?.map((item, idx) => (
                        <li key={idx} className="text-purple-200 text-sm flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Insights */}
              {seoAnalysis.competitive_insights?.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                  <CardHeader className="border-b border-purple-500/30">
                    <CardTitle className="text-purple-300 font-bold">Competitive Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-2">
                      {seoAnalysis.competitive_insights.map((insight, idx) => (
                        <li key={idx} className="text-purple-200 text-sm p-2 bg-purple-900/20 rounded">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}