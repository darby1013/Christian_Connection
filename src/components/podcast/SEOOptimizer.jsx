import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  Search, TrendingUp, Tag, FileText, Copy, RefreshCw,
  CheckCircle, Sparkles, Target, BarChart3, Globe, Zap,
  Award, Hash, Brain
} from "lucide-react";

export default function SEOOptimizer({ podcast, onUpdate }) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState(null);
  const [activeTab, setActiveTab] = useState('title');

  const generateSEOOptimization = async () => {
    if (!podcast) return;

    setOptimizing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an SEO expert specializing in podcast discovery and Apple Podcasts/Spotify optimization.

PODCAST TO OPTIMIZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${podcast.title}
Description: ${podcast.description}
Host: ${podcast.host_name}
Category: ${podcast.category || 'General'}
Current Tags: ${podcast.tags?.join(', ') || 'None'}
Duration: ${Math.floor((podcast.duration || 0) / 60)} minutes
Episode: S${podcast.season}E${podcast.episode_number}

OPTIMIZATION GOALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Maximize discoverability on podcast platforms
2. Rank higher in search results
3. Increase click-through rate (CTR)
4. Appeal to target audience
5. Follow SEO best practices

DELIVERABLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **OPTIMIZED TITLE** (3 variations):
   - 60 characters max
   - Include primary keyword
   - Clear value proposition
   - Emotional hook
   - Episode number format: S${podcast.season}E${podcast.episode_number}

2. **OPTIMIZED DESCRIPTION** (2 variations):
   - 150-200 words
   - First 2 sentences are hooks (160 chars - appears in previews)
   - Include 5-7 primary keywords naturally
   - What listeners will learn (bullet points)
   - Call to action
   - SEO-friendly structure

3. **KEYWORD-RICH TAGS** (20-25 tags):
   - Primary keywords (3-5)
   - Secondary keywords (5-7)
   - Long-tail keywords (7-10)
   - Trending topics (3-5)
   - Niche-specific terms
   - Mix of broad and specific

4. **SEO IMPROVEMENTS** (8-12 recommendations):
   - Content structure improvements
   - Keyword density suggestions
   - Title optimization tips
   - Description enhancements
   - Cross-promotion strategies
   - Link building ideas
   - Social media hashtag strategy
   - Podcast platform-specific tips

5. **METADATA OPTIMIZATION**:
   - Suggested show notes format
   - Timestamp structure for chapters
   - Guest bio format (if applicable)
   - Link structure
   - Episode number optimization

6. **DISCOVERABILITY SCORE** (0-100):
   - Current score estimate
   - Optimized score prediction
   - Improvement percentage

Analyze industry trends and competitor strategies for maximum impact.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            optimized_titles: {
              type: "array",
              items: { type: "string" }
            },
            optimized_descriptions: {
              type: "array",
              items: { type: "string" }
            },
            seo_tags: {
              type: "array",
              items: { type: "string" }
            },
            primary_keywords: {
              type: "array",
              items: { type: "string" }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  suggestion: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            current_score: { type: "number" },
            optimized_score: { type: "number" },
            suggested_hashtags: {
              type: "array",
              items: { type: "string" }
            },
            competitor_insights: { type: "string" },
            show_notes_template: { type: "string" }
          }
        }
      });

      setOptimizedData(result);
      alert(`✅ SEO Optimization Complete!\n\nDiscoverability: ${result.current_score} → ${result.optimized_score} (+${result.optimized_score - result.current_score} points)`);

    } catch (error) {
      alert('Error generating SEO optimization: ' + error.message);
    } finally {
      setOptimizing(false);
    }
  };

  const applyOptimization = async (field, value) => {
    if (!onUpdate) return;

    try {
      await onUpdate({ [field]: value });
      alert(`✅ ${field} updated!`);
    } catch (error) {
      alert('Error updating: ' + error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white font-black text-xl flex items-center gap-3">
            <Brain className="w-8 h-8 text-green-400" />
            AI-Powered SEO Optimization Suite
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">Expert Analysis</Badge>
          </CardTitle>
          <p className="text-slate-300 mt-2">
            Maximize podcast discoverability with AI-driven SEO strategies
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!optimizedData ? (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                  <Search className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-sm">Title Optimization</p>
                  <p className="text-blue-200 text-xs">3 variations</p>
                </div>
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                  <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-sm">Description Enhancement</p>
                  <p className="text-purple-200 text-xs">SEO-rich copy</p>
                </div>
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center">
                  <Tag className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-sm">Smart Tagging</p>
                  <p className="text-cyan-200 text-xs">20-25 keywords</p>
                </div>
              </div>

              <Button
                onClick={generateSEOOptimization}
                disabled={optimizing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold text-lg h-14"
              >
                {optimizing ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Analyzing SEO...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" />Generate SEO Optimization</>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              {/* SEO Score Improvement */}
              <Card className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-amber-300 text-xs mb-1 block">DISCOVERABILITY SCORE</Label>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-red-300 text-sm">Current</p>
                          <p className="text-white font-black text-3xl">{optimizedData.current_score}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-400" />
                        <div className="text-center">
                          <p className="text-green-300 text-sm">Optimized</p>
                          <p className="text-white font-black text-3xl">{optimizedData.optimized_score}</p>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-lg px-4 py-2">
                      +{optimizedData.optimized_score - optimizedData.current_score} Points
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Optimized Titles */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400" />
                    Optimized Titles
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {optimizedData.optimized_titles.map((title, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/30 border border-slate-700 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Badge className="bg-blue-500 text-xs mb-2">Option {idx + 1}</Badge>
                          <p className="text-white font-semibold">{title}</p>
                          <p className="text-slate-400 text-xs mt-1">{title.length} characters</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(title)}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => applyOptimization('title', title)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Optimized Descriptions */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Optimized Descriptions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {optimizedData.optimized_descriptions.map((desc, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/30 border border-slate-700 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Badge className="bg-purple-500 text-xs mb-2">Version {idx + 1}</Badge>
                          <Textarea
                            value={desc}
                            readOnly
                            className="bg-slate-900 border-slate-700 text-white h-32 text-sm mb-2"
                          />
                          <p className="text-slate-400 text-xs">{desc.length} characters</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(desc)}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => applyOptimization('description', desc)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* SEO Tags */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white font-bold flex items-center gap-2">
                      <Tag className="w-5 h-5 text-cyan-400" />
                      Keyword-Rich Tags ({optimizedData.seo_tags.length})
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => applyOptimization('tags', optimizedData.seo_tags)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Apply All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-cyan-300 text-xs mb-2 block">PRIMARY KEYWORDS</Label>
                    <div className="flex flex-wrap gap-2">
                      {optimizedData.primary_keywords.map((kw, idx) => (
                        <Badge key={idx} className="bg-cyan-500 cursor-pointer" onClick={() => copyToClipboard(kw)}>
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-purple-300 text-xs mb-2 block">ALL SEO TAGS</Label>
                    <div className="flex flex-wrap gap-2">
                      {optimizedData.seo_tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          className={
                            optimizedData.primary_keywords.includes(tag)
                              ? 'bg-cyan-500'
                              : 'bg-purple-500'
                          }
                          onClick={() => copyToClipboard(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {optimizedData.suggested_hashtags && (
                    <div>
                      <Label className="text-green-300 text-xs mb-2 block">SOCIAL MEDIA HASHTAGS</Label>
                      <div className="flex flex-wrap gap-2">
                        {optimizedData.suggested_hashtags.map((tag, idx) => (
                          <Badge key={idx} className="bg-green-500" onClick={() => copyToClipboard(`#${tag}`)}>
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => copyToClipboard(optimizedData.seo_tags.join(', '))}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Tags
                  </Button>
                </CardContent>
              </Card>

              {/* Improvement Recommendations */}
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    SEO Improvement Recommendations ({optimizedData.improvements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {optimizedData.improvements.map((improvement, idx) => (
                    <Card key={idx} className="bg-slate-900/30 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-amber-500 text-xs">{improvement.category}</Badge>
                              <Badge className={`text-xs ${
                                improvement.impact === 'High' ? 'bg-red-500' :
                                improvement.impact === 'Medium' ? 'bg-amber-500' :
                                'bg-green-500'
                              }`}>
                                {improvement.impact} Impact
                              </Badge>
                            </div>
                            <p className="text-white text-sm">{improvement.suggestion}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Competitor Insights */}
              {optimizedData.competitor_insights && (
                <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/30">
                  <CardHeader className="border-b border-blue-500/30">
                    <CardTitle className="text-white font-bold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      Competitive Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-blue-100 text-sm">{optimizedData.competitor_insights}</p>
                  </CardContent>
                </Card>
              )}

              {/* Show Notes Template */}
              {optimizedData.show_notes_template && (
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-400" />
                        SEO-Optimized Show Notes Template
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(optimizedData.show_notes_template)}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={optimizedData.show_notes_template}
                      readOnly
                      className="bg-slate-900 border-slate-700 text-white h-48 font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setOptimizedData(null)}
                  variant="outline"
                  className="flex-1 border-slate-700"
                >
                  Start Over
                </Button>
                <Button
                  onClick={generateSEOOptimization}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}