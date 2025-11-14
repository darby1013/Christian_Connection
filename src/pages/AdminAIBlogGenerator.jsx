import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { PenTool, Sparkles, Loader2, Save, Eye } from 'lucide-react';

export default function AdminAIBlogGenerator() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [blogPost, setBlogPost] = useState(null);

  const queryClient = useQueryClient();

  const saveBlogMutation = useMutation({
    mutationFn: (postData) => base44.entities.BlogPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      alert('✅ Blog post saved successfully!');
    }
  });

  const generateBlog = async () => {
    if (!prompt) {
      alert('Please enter a topic or prompt');
      return;
    }

    setGenerating(true);
    try {
      const wordCount = length === 'short' ? '500-800' : length === 'medium' ? '1000-1500' : '2000-3000';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a complete, SEO-optimized blog post:

Topic/Prompt: ${prompt}
Tone: ${tone}
Length: ${wordCount} words
Keywords to include: ${keywords || 'auto-generate relevant keywords'}

Create a blog post with:
1. Engaging title (SEO optimized)
2. Meta description (150-160 characters)
3. Introduction (hook the reader)
4. Main content (well-structured with H2/H3 headings)
5. Conclusion with call-to-action
6. Suggested tags (5-7)
7. Suggested featured image description`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            meta_description: { type: 'string' },
            content: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            featured_image_description: { type: 'string' },
            estimated_read_time: { type: 'string' }
          }
        }
      });

      setBlogPost(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveBlog = () => {
    if (!blogPost) return;

    saveBlogMutation.mutate({
      title: blogPost.title,
      content: blogPost.content,
      status: 'draft',
      author_name: 'AI Generator',
      meta_description: blogPost.meta_description,
      featured_image_description: blogPost.featured_image_description
    });
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Blog Post Generator"
        subtitle="Generate SEO-optimized blog content with AI"
        icon={PenTool}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Topic / Prompt *</label>
              <Textarea
                placeholder="e.g., 10 ways to improve your morning routine"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-24"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Length</label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="short">Short (500-800 words)</SelectItem>
                  <SelectItem value="medium">Medium (1000-1500 words)</SelectItem>
                  <SelectItem value="long">Long (2000+ words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-2 block">Keywords (optional)</label>
              <Input
                placeholder="e.g., productivity, wellness, habits"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={generateBlog}
              disabled={generating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Blog Post</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {blogPost ? (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">{blogPost.title}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-slate-600">
                      <Eye className="w-3 h-3 mr-1" />Preview
                    </Button>
                    <Button size="sm" onClick={saveBlog} className="bg-green-500">
                      <Save className="w-3 h-3 mr-1" />Save Draft
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                  <p className="text-blue-300 font-bold text-xs mb-1">Meta Description:</p>
                  <p className="text-blue-200 text-sm">{blogPost.meta_description}</p>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {blogPost.content}
                  </div>
                </div>

                <div>
                  <p className="text-white font-bold mb-2 text-sm">Suggested Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {blogPost.tags?.map((tag, i) => (
                      <Badge key={i} className="bg-cyan-500">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-400">Estimated read time: {blogPost.estimated_read_time}</p>
                  <Badge className="bg-green-500">SEO Optimized</Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <PenTool className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Write</p>
                <p className="text-slate-400">Enter your topic and AI will create a complete blog post</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}