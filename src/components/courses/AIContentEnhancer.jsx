import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wand2, RefreshCw, Sparkles, BookOpen } from "lucide-react";

export default function AIContentEnhancer({ courses }) {
  const [enhancing, setEnhancing] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [enhancementType, setEnhancementType] = useState('add_scripture');
  const [enhanced, setEnhanced] = useState(null);

  const handleEnhance = async () => {
    if (!contentInput) return;

    setEnhancing(true);
    try {
      const prompts = {
        add_scripture: `Add relevant, contextual scripture references to this course content: "${contentInput}". Include verse references and brief explanations of their relevance.`,
        improve_clarity: `Improve the clarity and readability of this course content while maintaining theological accuracy: "${contentInput}"`,
        add_examples: `Add real-life examples, testimonies, and practical illustrations to this content: "${contentInput}"`,
        deepen_theology: `Deepen the theological richness of this content with historical context and doctrinal insights: "${contentInput}"`
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD. ${prompts[enhancementType]}

Provide enhanced content that is:
1. Theologically sound and biblically grounded
2. Academically rigorous yet accessible
3. Practically applicable to Christian life
4. Engaging and transformative

Return the enhanced content with clear formatting.`,
        response_json_schema: {
          type: "object",
          properties: {
            enhanced_content: { type: "string" },
            improvements_made: {
              type: "array",
              items: { type: "string" }
            },
            scripture_added: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: { type: "string" }
          }
        }
      });

      setEnhanced(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          AI Content Enhancer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enhanced ? (
          <>
            <div>
              <Label className="text-white mb-2 block">Course Content to Enhance</Label>
              <Textarea
                placeholder="Paste your course content here..."
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white h-40"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Enhancement Type</Label>
              <select
                value={enhancementType}
                onChange={(e) => setEnhancementType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="add_scripture">Add Scripture References</option>
                <option value="improve_clarity">Improve Clarity & Readability</option>
                <option value="add_examples">Add Real-Life Examples</option>
                <option value="deepen_theology">Deepen Theological Richness</option>
              </select>
            </div>

            <Button
              onClick={handleEnhance}
              disabled={enhancing || !contentInput}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {enhancing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Enhancing...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Enhance Content</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Enhanced Content
              </h4>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-200 whitespace-pre-wrap">{enhanced.enhanced_content}</p>
              </div>
            </div>

            {enhanced.improvements_made && enhanced.improvements_made.length > 0 && (
              <div>
                <h5 className="text-white font-semibold mb-2">Improvements Made:</h5>
                <ul className="space-y-1">
                  {enhanced.improvements_made.map((imp, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <Badge className="bg-green-500">✓</Badge>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {enhanced.scripture_added && enhanced.scripture_added.length > 0 && (
              <div>
                <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Scripture References Added:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {enhanced.scripture_added.map((ref, idx) => (
                    <Badge key={idx} className="bg-cyan-500">{ref}</Badge>
                  ))}
                </div>
              </div>
            )}

            {enhanced.suggestions && (
              <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <h5 className="text-white font-semibold mb-2">Additional Suggestions:</h5>
                <p className="text-slate-300 text-sm">{enhanced.suggestions}</p>
              </div>
            )}

            <Button
              onClick={() => setEnhanced(null)}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              Enhance More Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}