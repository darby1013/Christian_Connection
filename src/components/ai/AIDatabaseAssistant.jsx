import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Bot, Zap, TrendingUp, Database, CheckCircle,
  AlertCircle, Settings, Activity, Brain, Lightbulb
} from "lucide-react";

export default function AIDatabaseAssistant({ context }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [autoApply, setAutoApply] = useState(false);

  const analyzeDatabase = async () => {
    setAnalyzing(true);

    try {
      const prompt = `You are an expert database administrator and performance optimization specialist. Analyze the following database metrics and provide actionable recommendations:

Context:
${JSON.stringify(context, null, 2)}

Provide comprehensive analysis on:

1. QUERY PERFORMANCE:
   - Identify slow queries
   - Suggest query optimizations
   - Recommend missing indexes

2. INDEX OPTIMIZATION:
   - Identify unused indexes (waste resources)
   - Suggest new composite indexes
   - Recommend index deletions

3. COST OPTIMIZATION:
   - Identify expensive operations
   - Suggest data archiving opportunities
   - Recommend resource right-sizing

4. SCHEMA IMPROVEMENTS:
   - Denormalization opportunities
   - Partitioning suggestions
   - Data type optimizations

5. MAINTENANCE TASKS:
   - Cleanup operations needed
   - Statistics update recommendations
   - Fragmentation fixes

For each recommendation, provide:
- category (query, index, cost, schema, maintenance)
- priority (critical, high, medium, low)
- action (specific SQL or action to take)
- expected_impact (e.g., "30% faster queries", "$50/month savings")
- confidence_score (0-100)
- auto_appliable (true/false - can this be safely automated?)
- risks (any potential downsides)

Sort recommendations by priority and confidence score.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            health_score: { type: "number" },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  priority: { type: "string" },
                  title: { type: "string" },
                  action: { type: "string" },
                  expected_impact: { type: "string" },
                  confidence_score: { type: "number" },
                  auto_appliable: { type: "boolean" },
                  risks: { type: "string" }
                }
              }
            },
            quick_wins: {
              type: "array",
              items: { type: "string" }
            },
            long_term_strategy: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setRecommendations(result);
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('Analysis failed: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyRecommendation = async (recommendation) => {
    if (recommendation.confidence_score < confidenceThreshold) {
      alert('⚠️ This recommendation is below your confidence threshold. Increase threshold or review manually.');
      return;
    }

    if (!confirm(`Apply this optimization?\n\n${recommendation.title}\n\nAction: ${recommendation.action}\n\nRisks: ${recommendation.risks}`)) {
      return;
    }

    alert('✅ Recommendation applied! (In production, this would execute the action)');
  };

  const getCategoryIcon = (category) => {
    switch(category?.toLowerCase()) {
      case 'query': return <Activity className="w-4 h-4" />;
      case 'index': return <Zap className="w-4 h-4" />;
      case 'cost': return <TrendingUp className="w-4 h-4" />;
      case 'schema': return <Database className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
      <CardHeader className="border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 font-bold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Database Assistant
          </CardTitle>
          <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="text-purple-200 text-sm">
            Get intelligent, context-aware recommendations for query optimization, index management,
            and cost reduction based on real-time analysis.
          </p>

          {/* Configuration */}
          <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg">
            <div>
              <Label className="text-white font-bold mb-2 block">
                Auto-Apply Confidence Threshold: {confidenceThreshold}%
              </Label>
              <Slider
                value={[confidenceThreshold]}
                max={100}
                step={5}
                onValueChange={([value]) => setConfidenceThreshold(value)}
              />
              <p className="text-slate-400 text-xs mt-1">
                Only recommendations with {confidenceThreshold}%+ confidence can be auto-applied
              </p>
            </div>
          </div>

          {/* Analysis Results */}
          {recommendations && (
            <div className="space-y-4">
              {/* Overall Assessment */}
              <Card className="bg-slate-900/50 border-cyan-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-300 font-bold">Overall Database Health</span>
                    <Badge className={
                      recommendations.health_score >= 90 ? 'bg-green-500' :
                      recommendations.health_score >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }>
                      {recommendations.health_score}%
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm">{recommendations.overall_assessment}</p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {recommendations.recommendations && recommendations.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    AI Recommendations ({recommendations.recommendations.length})
                  </h4>
                  {recommendations.recommendations.map((rec, idx) => (
                    <Card key={idx} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                              {getCategoryIcon(rec.category)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-white font-bold text-sm">{rec.title}</h5>
                                <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                              </div>
                              <p className="text-slate-400 text-xs">{rec.category}</p>
                            </div>
                          </div>
                          <Badge className="bg-cyan-500">{rec.confidence_score}%</Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-slate-800 rounded">
                            <p className="text-green-400 font-mono text-xs">{rec.action}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <p className="text-green-300"><strong>Impact:</strong> {rec.expected_impact}</p>
                          </div>
                          {rec.risks && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                              <p className="text-orange-300"><strong>Risks:</strong> {rec.risks}</p>
                            </div>
                          )}
                        </div>

                        {rec.auto_appliable && rec.confidence_score >= confidenceThreshold && (
                          <Button
                            size="sm"
                            onClick={() => applyRecommendation(rec)}
                            className="mt-3 bg-green-500 hover:bg-green-600 w-full"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Apply Automatically
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Quick Wins */}
              {recommendations.quick_wins && recommendations.quick_wins.length > 0 && (
                <div>
                  <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Wins
                  </h4>
                  <div className="space-y-1">
                    {recommendations.quick_wins.map((win, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-green-900/20 rounded">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-green-200 text-xs">{win}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long-term Strategy */}
              {recommendations.long_term_strategy && recommendations.long_term_strategy.length > 0 && (
                <div>
                  <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Long-term Strategy
                  </h4>
                  <div className="space-y-1">
                    {recommendations.long_term_strategy.map((strategy, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-blue-900/20 rounded">
                        <Activity className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-blue-200 text-xs">{strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={analyzeDatabase}
            disabled={analyzing}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 h-12"
          >
            {analyzing ? (
              <><Sparkles className="w-5 h-5 mr-2 animate-pulse" />AI Analyzing Database...</>
            ) : (
              <><Brain className="w-5 h-5 mr-2" />Get AI Optimization Recommendations</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}