import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, AlertTriangle, TrendingUp, Activity, Shield,
  Eye, CheckCircle, XCircle, Zap, Brain
} from "lucide-react";

export default function AIAnomalyDetector({ data, dataType = "audit" }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [anomalies, setAnomalies] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const detectAnomalies = async () => {
    setAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Prepare data summary for AI
      const dataSummary = dataType === "audit" 
        ? {
            total_entries: data?.length || 0,
            time_range: data?.length > 0 ? `${data[0].created_date} to ${data[data.length - 1].created_date}` : 'N/A',
            action_types: [...new Set(data?.map(d => d.action_type) || [])],
            users: [...new Set(data?.map(d => d.user_email) || [])].length,
            failed_actions: data?.filter(d => d.status === 'failure').length || 0,
            sample_entries: data?.slice(0, 20) || []
          }
        : {
            total_rules: data?.length || 0,
            violations: data?.reduce((sum, r) => sum + (r.violations_count || 0), 0) || 0,
            entities: [...new Set(data?.map(d => d.entity_name) || [])],
            sample_rules: data?.slice(0, 10) || []
          };

      setAnalysisProgress(30);

      const prompt = dataType === "audit" 
        ? `Analyze this audit log data and identify potential security threats, unusual patterns, or anomalies:

Data Summary:
${JSON.stringify(dataSummary, null, 2)}

Identify:
1. Unusual access patterns (e.g., multiple failed logins, unusual times)
2. Potential security breaches (e.g., unauthorized access attempts)
3. Data manipulation anomalies (e.g., bulk deletions, unusual updates)
4. Suspicious user behavior (e.g., privilege escalation attempts)
5. System health concerns (e.g., high error rates)

For each anomaly found, provide:
- severity (critical, high, medium, low)
- type (security, data, performance, compliance)
- description (what was detected)
- affected_entities (list of affected items)
- recommendation (how to address it)
- confidence_score (0-100)

If no significant anomalies are found, return an empty anomalies array.`
        : `Analyze this data integrity check data and identify data quality issues, inconsistencies, or potential problems:

Data Summary:
${JSON.stringify(dataSummary, null, 2)}

Identify:
1. Data quality issues (duplicates, null values, format issues)
2. Referential integrity problems
3. Business rule violations
4. Data inconsistencies across tables
5. Potential data corruption

For each anomaly found, provide:
- severity (critical, high, medium, low)
- type (quality, integrity, consistency, corruption)
- description (what was detected)
- affected_entities (list of affected items)
- recommendation (how to fix it)
- confidence_score (0-100)

If no significant anomalies are found, return an empty anomalies array.`;

      setAnalysisProgress(60);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            overall_health_score: { type: "number" },
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  affected_entities: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" },
                  confidence_score: { type: "number" }
                }
              }
            },
            insights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAnalysisProgress(100);
      setAnomalies(result);
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('Analysis failed: ' + error.message);
    } finally {
      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisProgress(0);
      }, 500);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
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
            <Brain className="w-5 h-5" />
            AI Anomaly Detection
          </CardTitle>
          <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="text-purple-200 text-sm">
            Advanced AI analysis to detect unusual patterns, security threats, and data inconsistencies
            that traditional rules might miss.
          </p>

          {analyzing && (
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI analyzing {data?.length || 0} records...
                </span>
                <span className="text-cyan-200">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}

          {anomalies && (
            <div className="space-y-4">
              {/* Overall Health */}
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Overall Health Score</p>
                    <p className="text-white font-black text-3xl">{anomalies.overall_health_score}%</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    anomalies.overall_health_score >= 90 ? 'bg-green-500' :
                    anomalies.overall_health_score >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-slate-300 text-sm mt-2">{anomalies.summary}</p>
              </div>

              {/* Anomalies Found */}
              {anomalies.anomalies && anomalies.anomalies.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Detected Anomalies ({anomalies.anomalies.length})
                  </h4>
                  {anomalies.anomalies.map((anomaly, idx) => (
                    <Card key={idx} className="bg-slate-900/50 border-red-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity}
                            </Badge>
                            <Badge className="bg-slate-700">{anomaly.type}</Badge>
                            <Badge className="bg-cyan-500">{anomaly.confidence_score}% confidence</Badge>
                          </div>
                        </div>
                        <p className="text-white font-bold mb-2">{anomaly.description}</p>
                        <p className="text-slate-400 text-sm mb-2">
                          <strong className="text-orange-300">Recommendation:</strong> {anomaly.recommendation}
                        </p>
                        {anomaly.affected_entities && anomaly.affected_entities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {anomaly.affected_entities.slice(0, 5).map((entity, i) => (
                              <Badge key={i} className="bg-red-500/20 text-red-300 text-xs">
                                {entity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : anomalies.anomalies ? (
                <Card className="bg-green-900/20 border-green-500/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-green-300 font-bold">No Anomalies Detected</p>
                      <p className="text-green-200 text-sm">Your system looks healthy!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* AI Insights */}
              {anomalies.insights && anomalies.insights.length > 0 && (
                <div>
                  <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Insights
                  </h4>
                  <div className="space-y-2">
                    {anomalies.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-cyan-900/20 rounded-lg">
                        <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-cyan-200 text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={detectAnomalies}
            disabled={analyzing || !data || data.length === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 h-12"
          >
            {analyzing ? (
              <><Sparkles className="w-5 h-5 mr-2 animate-pulse" />Analyzing with AI...</>
            ) : (
              <><Brain className="w-5 h-5 mr-2" />Run AI Anomaly Detection</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}