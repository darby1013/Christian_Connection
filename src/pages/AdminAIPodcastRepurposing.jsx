import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Sparkles, Loader2, FileText, Twitter, Mail, Video } from 'lucide-react';

export default function AdminAIPodcastRepurposing() {
  const [transcript, setTranscript] = useState('');
  const [formats, setFormats] = useState(['blog', 'twitter', 'newsletter']);
  const [generating, setGenerating] = useState(false);
  const [repurposedContent, setRepurposedContent] = useState(null);

  const formatOptions = [
    { id: 'blog', name: 'Blog Post', icon: FileText },
    { id: 'twitter', name: 'Twitter Thread', icon: Twitter },
    { id: 'newsletter', name: 'Newsletter', icon: Mail },
    { id: 'quotes', name: 'Quote Graphics', icon: Sparkles },
    { id: 'clips', name: 'Video Clips Script', icon: Video }
  ];

  const repurpose = async () => {
    if (!transcript) return alert('Please enter transcript');

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Repurpose this podcast transcript into multiple content formats:

${transcript}

Create ${formats.join(', ')} versions. For each format, optimize for that platform's best practices.`,
        response_json_schema: {
          type: 'object',
          properties: {
            blog_post: { type: 'string' },
            twitter_thread: { type: 'array', items: { type: 'string' } },
            newsletter: { type: 'string' },
            quote_graphics: { type: 'array', items: { type: 'string' } },
            video_clips: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  duration: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setRepurposedContent(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Podcast Repurposing"
        subtitle="Transform episodes into multiple content formats"
        icon={Sparkles}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Podcast Transcript *</label>
              <Textarea
                placeholder="Paste episode transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-48"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-3 block">Output Formats</label>
              <div className="space-y-2">
                {formatOptions.map(format => {
                  const Icon = format.icon;
                  return (
                    <label key={format.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={formats.includes(format.id)} 
                        onCheckedChange={() => {
                          if (formats.includes(format.id)) {
                            setFormats(formats.filter(f => f !== format.id));
                          } else {
                            setFormats([...formats, format.id]);
                          }
                        }}
                      />
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300 text-sm">{format.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={repurpose}
              disabled={generating}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Repurposing...</> : <><Sparkles className="w-5 h-5 mr-2" />Repurpose Content</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {repurposedContent ? (
            <Tabs defaultValue="blog">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="blog">Blog</TabsTrigger>
                <TabsTrigger value="twitter">Twitter</TabsTrigger>
                <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
              </TabsList>

              <TabsContent value="blog" className="mt-4">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{repurposedContent.blog_post}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="twitter" className="mt-4">
                <div className="space-y-3">
                  {repurposedContent.twitter_thread?.map((tweet, i) => (
                    <Card key={i} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <Badge className="bg-cyan-500 mb-2">Tweet {i + 1}</Badge>
                        <p className="text-slate-300">{tweet}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="newsletter" className="mt-4">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{repurposedContent.newsletter}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Sparkles className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Repurpose</p>
                <p className="text-slate-400">AI will transform your episode into multiple formats</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}