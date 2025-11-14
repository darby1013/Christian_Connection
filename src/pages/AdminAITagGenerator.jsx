import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Hash, Sparkles, Loader2, Copy } from 'lucide-react';

export default function AdminAITagGenerator() {
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const generateMetadata = async () => {
    if (!content) return alert('Please enter content');

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this content and generate SEO metadata:

${content}

Generate:
1. SEO-optimized title (50-60 characters)
2. Meta description (150-160 characters)
3. Primary keywords (5-7)
4. Related tags (10-15)
5. Focus keyphrase
6. Category suggestions`,
        response_json_schema: {
          type: 'object',
          properties: {
            seo_title: { type: 'string' },
            meta_description: { type: 'string' },
            primary_keywords: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            focus_keyphrase: { type: 'string' },
            categories: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setMetadata(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Tag & Metadata Generator"
        subtitle="Auto-generate SEO tags and metadata"
        icon={Hash}
        badge="AI"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold mb-2 block">Content *</label>
              <Textarea
                placeholder="Paste your blog post, article, or content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-80"
              />
            </div>

            <Button
              onClick={generateMetadata}
              disabled={generating}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Metadata</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {metadata ? (
            <>
              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-blue-300 font-bold">SEO Title</h4>
                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(metadata.seo_title)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-blue-200 font-semibold">{metadata.seo_title}</p>
                  <p className="text-blue-300 text-xs mt-1">{metadata.seo_title.length} characters</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardContent className="p-6">
                  <h4 className="text-purple-300 font-bold mb-2">Meta Description</h4>
                  <p className="text-purple-200 text-sm">{metadata.meta_description}</p>
                  <p className="text-purple-300 text-xs mt-1">{metadata.meta_description.length} characters</p>
                </CardContent>
              </Card>

              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-6">
                  <h4 className="text-green-300 font-bold mb-3">Primary Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {metadata.primary_keywords?.map((kw, i) => (
                      <Badge key={i} className="bg-green-500">{kw}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-cyan-900/20 border-cyan-500/30">
                <CardContent className="p-6">
                  <h4 className="text-cyan-300 font-bold mb-3">Suggested Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {metadata.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-800 text-cyan-400 border border-cyan-500/30">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Hash className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Generate</p>
                <p className="text-slate-400">AI will create SEO-optimized tags and metadata</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}