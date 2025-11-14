import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Sparkles, Loader2, FileText, Twitter, Mail, Video, Scissors, Image as ImageIcon, Download, Play, Copy } from 'lucide-react';

export default function AdminAIPodcastRepurposing() {
  const [transcript, setTranscript] = useState('');
  const [formats, setFormats] = useState(['blog', 'twitter', 'newsletter']);
  const [generating, setGenerating] = useState(false);
  const [repurposedContent, setRepurposedContent] = useState(null);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [generatingAudiograms, setGeneratingAudiograms] = useState(false);
  const [audiograms, setAudiograms] = useState([]);
  const [quoteImages, setQuoteImages] = useState([]);

  const formatOptions = [
    { id: 'blog', name: 'Blog Post', icon: FileText },
    { id: 'twitter', name: 'Twitter Thread', icon: Twitter },
    { id: 'newsletter', name: 'Newsletter', icon: Mail },
    { id: 'quotes', name: 'Quote Graphics', icon: Sparkles },
    { id: 'clips', name: 'Video Clips Script', icon: Video }
  ];

  // Parse transcript into segments when pasted
  const handleTranscriptChange = (value) => {
    setTranscript(value);
    if (value) {
      // Split transcript into logical segments (paragraphs or time markers)
      const segments = value.split('\n\n').filter(s => s.trim()).map((text, i) => ({
        id: `seg-${i}`,
        text: text.trim(),
        selected: false,
        startTime: `${Math.floor(i * 2)}:${(i * 30) % 60}`.padStart(4, '0')
      }));
      setTranscriptSegments(segments);
    }
  };

  const toggleSegment = (segmentId) => {
    setTranscriptSegments(prev => prev.map(seg => 
      seg.id === segmentId ? { ...seg, selected: !seg.selected } : seg
    ));
  };

  const repurpose = async () => {
    const selectedSegs = transcriptSegments.filter(s => s.selected);
    const contentToRepurpose = selectedSegs.length > 0 
      ? selectedSegs.map(s => s.text).join('\n\n')
      : transcript;

    if (!contentToRepurpose) return alert('Please enter transcript or select segments');

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Repurpose this podcast ${selectedSegs.length > 0 ? 'segment' : 'transcript'} into multiple content formats:

${contentToRepurpose}

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

  const generateAudiograms = async () => {
    const selectedSegs = transcriptSegments.filter(s => s.selected);
    if (selectedSegs.length === 0) return alert('Please select segments for audiograms');

    setGeneratingAudiograms(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create audiogram specifications for these podcast clips:

${selectedSegs.map((s, i) => `Clip ${i + 1} (${s.startTime}): ${s.text}`).join('\n\n')}

For each clip, generate:
- Catchy title (5-8 words)
- Visual description for waveform animation
- Background color scheme
- Text overlay positioning
- Optimal duration (15-60 seconds)
- Engagement hooks`,
        response_json_schema: {
          type: 'object',
          properties: {
            audiograms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  text: { type: 'string' },
                  duration: { type: 'string' },
                  background_color: { type: 'string' },
                  waveform_style: { type: 'string' },
                  text_position: { type: 'string' },
                  engagement_hook: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setAudiograms(result.audiograms || []);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingAudiograms(false);
    }
  };

  const generateQuoteImages = async () => {
    const selectedSegs = transcriptSegments.filter(s => s.selected);
    const contentForQuotes = selectedSegs.length > 0 
      ? selectedSegs.map(s => s.text).join('\n\n')
      : transcript;

    if (!contentForQuotes) return alert('Please enter content for quote images');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract 6-8 powerful, shareable quotes from this podcast content:

${contentForQuotes}

For each quote, provide:
- The quote text (15-40 words, impactful)
- Visual theme suggestion (colors, style)
- Background image description
- Font style recommendation
- Social media platform optimization (Instagram, LinkedIn, Twitter)`,
        response_json_schema: {
          type: 'object',
          properties: {
            quotes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  quote: { type: 'string' },
                  author: { type: 'string' },
                  theme: { type: 'string' },
                  background_suggestion: { type: 'string' },
                  font_style: { type: 'string' },
                  platform: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setQuoteImages(result.quotes || []);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Podcast Repurposing Studio"
        subtitle="Transform episodes into multiple formats with segment selection & audiograms"
        icon={Sparkles}
        badge="AI PRO"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Podcast Transcript *</label>
              <Textarea
                placeholder="Paste episode transcript here..."
                value={transcript}
                onChange={(e) => handleTranscriptChange(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-48"
              />
            </div>

            {transcriptSegments.length > 0 && (
              <div>
                <label className="text-white font-bold text-sm mb-2 block">
                  Select Segments ({transcriptSegments.filter(s => s.selected).length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-700">
                  {transcriptSegments.map(seg => (
                    <label key={seg.id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-slate-800 rounded">
                      <Checkbox 
                        checked={seg.selected}
                        onCheckedChange={() => toggleSegment(seg.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs mb-1">
                          {seg.startTime}
                        </Badge>
                        <p className="text-slate-300 text-sm line-clamp-2">{seg.text}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

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

            <div className="space-y-2">
              <Button
                onClick={repurpose}
                disabled={generating}
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 font-bold h-12"
              >
                {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Repurposing...</> : <><Sparkles className="w-5 h-5 mr-2" />Repurpose Content</>}
              </Button>

              <Button
                onClick={generateAudiograms}
                disabled={generatingAudiograms || transcriptSegments.filter(s => s.selected).length === 0}
                variant="outline"
                className="w-full border-purple-600 text-purple-300 hover:bg-purple-900/20"
              >
                {generatingAudiograms ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /></> : <><Play className="w-4 h-4 mr-2" /></>}
                Generate Audiograms
              </Button>

              <Button
                onClick={generateQuoteImages}
                variant="outline"
                className="w-full border-pink-600 text-pink-300 hover:bg-pink-900/20"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Quote Graphics
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {(repurposedContent || audiograms.length > 0 || quoteImages.length > 0) ? (
            <Tabs defaultValue={repurposedContent ? "content" : audiograms.length > 0 ? "audiograms" : "quotes"}>
              <TabsList className="bg-slate-800 border-slate-700">
                {repurposedContent && <TabsTrigger value="content">Content</TabsTrigger>}
                {audiograms.length > 0 && <TabsTrigger value="audiograms">Audiograms ({audiograms.length})</TabsTrigger>}
                {quoteImages.length > 0 && <TabsTrigger value="quotes">Quotes ({quoteImages.length})</TabsTrigger>}
              </TabsList>

              {repurposedContent && (
                <>
                  <TabsContent value="content">
                    <Tabs defaultValue="blog">
                      <TabsList className="bg-slate-900 border-slate-700">
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
                  </TabsContent>
                </>
              )}

              {audiograms.length > 0 && (
                <TabsContent value="audiograms" className="mt-4">
                  <div className="space-y-4">
                    {audiograms.map((audiogram, i) => (
                      <Card key={i} className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Badge className="bg-purple-500 mb-2">Audiogram {i + 1}</Badge>
                              <h3 className="text-white font-bold text-xl">{audiogram.title}</h3>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-purple-600">
                                <Download className="w-3 h-3 mr-1" />Export
                              </Button>
                              <Button size="sm" variant="outline" className="border-purple-600">
                                <Copy className="w-3 h-3 mr-1" />Copy
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-900/50 p-4 rounded-lg">
                              <p className="text-purple-300 font-bold text-xs mb-2">VISUAL SPECS</p>
                              <div className="space-y-2 text-sm">
                                <p className="text-slate-300"><span className="text-purple-400">Duration:</span> {audiogram.duration}</p>
                                <p className="text-slate-300"><span className="text-purple-400">Background:</span> {audiogram.background_color}</p>
                                <p className="text-slate-300"><span className="text-purple-400">Waveform:</span> {audiogram.waveform_style}</p>
                                <p className="text-slate-300"><span className="text-purple-400">Text Position:</span> {audiogram.text_position}</p>
                              </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 rounded-lg">
                              <p className="text-purple-300 font-bold text-xs mb-2">CONTENT</p>
                              <p className="text-slate-300 text-sm leading-relaxed">{audiogram.text}</p>
                            </div>
                          </div>

                          <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
                            <p className="text-purple-300 font-bold text-xs mb-1">💡 ENGAGEMENT HOOK</p>
                            <p className="text-purple-200 text-sm">{audiogram.engagement_hook}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              {quoteImages.length > 0 && (
                <TabsContent value="quotes" className="mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {quoteImages.map((quote, i) => (
                      <Card key={i} className="bg-gradient-to-br from-pink-900/20 to-rose-900/20 border-pink-500/30">
                        <CardContent className="p-6">
                          <Badge className="bg-pink-500 mb-3">Quote {i + 1}</Badge>
                          
                          <div className="bg-slate-900/70 p-6 rounded-lg mb-4 border-l-4 border-pink-500">
                            <p className="text-white text-lg font-semibold leading-relaxed mb-3">"{quote.quote}"</p>
                            <p className="text-pink-300 text-sm">— {quote.author}</p>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-pink-500 text-pink-400">{quote.platform}</Badge>
                              <span className="text-slate-400">Optimized for</span>
                            </div>
                            <p className="text-slate-300"><span className="text-pink-400 font-bold">Theme:</span> {quote.theme}</p>
                            <p className="text-slate-300"><span className="text-pink-400 font-bold">Font:</span> {quote.font_style}</p>
                            <p className="text-slate-300"><span className="text-pink-400 font-bold">Background:</span> {quote.background_suggestion}</p>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600">
                              <ImageIcon className="w-3 h-3 mr-1" />Generate Image
                            </Button>
                            <Button size="sm" variant="outline" className="border-pink-600">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Sparkles className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Advanced Repurposing Studio</p>
                <p className="text-slate-400 mb-4">Select segments, generate audiograms, and create quote graphics</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge className="bg-slate-700">✓ Segment Selection</Badge>
                  <Badge className="bg-slate-700">✓ Audiogram Generation</Badge>
                  <Badge className="bg-slate-700">✓ Quote Graphics</Badge>
                  <Badge className="bg-slate-700">✓ Multi-format Export</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}