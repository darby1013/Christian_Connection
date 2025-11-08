import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Copy, Download, RefreshCw } from "lucide-react";

export default function AIContentGenerator({ contentType = "blog", onGenerated }) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [targetLength, setTargetLength] = useState("medium");
  const [tone, setTone] = useState("inspirational");
  const [generatedContent, setGeneratedContent] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);

  const generateMutation = useMutation({
    mutationFn: async (params) => {
      const prompt = `Generate a ${contentType} post about "${params.topic}".
      
      ${params.keywords ? `Include these keywords: ${params.keywords}` : ''}
      
      Length: ${params.targetLength === 'short' ? '300-500 words' : params.targetLength === 'medium' ? '700-1000 words' : '1500-2000 words'}
      Tone: ${params.tone}
      
      ${contentType === 'blog' ? 'Format as a blog post with engaging introduction, main content sections with subheadings, and conclusion.' : ''}
      ${contentType === 'forum' ? 'Format as a forum discussion starter with clear question or topic, context, and invitation for responses.' : ''}
      ${contentType === 'sermon' ? 'Format as a sermon outline with introduction, 3-5 main points with scripture references, illustrations, and conclusion with call to action.' : ''}
      
      Make it engaging, authentic, and appropriate for a Christian community platform.
      
      Also suggest 5-7 relevant tags for this content.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            title: { type: "string" }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setSuggestedTags(data.tags || []);
      if (onGenerated) {
        onGenerated({
          content: data.content,
          tags: data.tags,
          title: data.title
        });
      }
    }
  });

  const summarizeMutation = useMutation({
    mutationFn: async (text) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize the following text in 2-3 concise paragraphs, maintaining the key points and tone:\n\n${text}`,
      });
      return result;
    },
    onSuccess: (summary) => {
      setGeneratedContent(summary);
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      topic,
      keywords,
      targetLength,
      tone
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    alert('Content copied to clipboard!');
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-black flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-white font-bold mb-2 block">Topic</Label>
          <Input
            placeholder="Enter your topic or title..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        <div>
          <Label className="text-white font-bold mb-2 block">Keywords (optional)</Label>
          <Input
            placeholder="faith, hope, love, community..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white font-bold mb-2 block">Length</Label>
            <Select value={targetLength} onValueChange={setTargetLength}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="short" className="text-white">Short (300-500 words)</SelectItem>
                <SelectItem value="medium" className="text-white">Medium (700-1000 words)</SelectItem>
                <SelectItem value="long" className="text-white">Long (1500-2000 words)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white font-bold mb-2 block">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="inspirational" className="text-white">Inspirational</SelectItem>
                <SelectItem value="educational" className="text-white">Educational</SelectItem>
                <SelectItem value="conversational" className="text-white">Conversational</SelectItem>
                <SelectItem value="formal" className="text-white">Formal</SelectItem>
                <SelectItem value="encouraging" className="text-white">Encouraging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!topic || generateMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
        >
          {generateMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <Label className="text-white font-bold">Generated Content</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([generatedContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'generated-content.txt';
                    a.click();
                  }}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white font-mono text-sm h-64"
            />

            {suggestedTags.length > 0 && (
              <div>
                <Label className="text-white font-bold mb-2 block">Suggested Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, idx) => (
                    <Badge key={idx} className="bg-purple-500">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}