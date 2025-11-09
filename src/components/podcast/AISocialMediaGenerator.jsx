import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Wand2, RefreshCw, Share2, Copy, CheckCircle, Twitter, Facebook, Instagram
} from "lucide-react";

export default function AISocialMediaGenerator({ podcast }) {
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!podcast) return;

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media marketing expert for faith-based podcasts. Create engaging promotional posts for this episode:

Title: "${podcast.title}"
Host: ${podcast.host_name}
Episode: S${podcast.season}E${podcast.episode_number}
Description: ${podcast.description || 'New podcast episode'}
Duration: ${Math.floor(podcast.duration / 60)} minutes
Category: ${podcast.category || 'Faith & Inspiration'}

Create platform-optimized posts:

1. **TWITTER/X POST** (280 characters max):
   - Hook in first line
   - Key takeaway or question
   - 2-3 relevant hashtags
   - CTA to listen

2. **FACEBOOK POST** (longer form):
   - Engaging story or question
   - 3-4 key topics covered
   - Personal connection
   - Clear CTA
   - 3-5 hashtags

3. **INSTAGRAM CAPTION**:
   - Visual description (what image would show)
   - Emojis for visual appeal
   - Storytelling hook
   - Line breaks for readability
   - 8-12 hashtags (mix of popular and niche)

4. **LINKEDIN POST** (professional):
   - Professional insight or lesson
   - Business/leadership angle
   - Thought-provoking question
   - 2-3 professional hashtags

5. **HASHTAG SUGGESTIONS**:
   - 10-15 relevant hashtags
   - Mix of broad and niche
   - Faith-based and topic-specific

Make posts compelling, authentic, and shareable!`,
        response_json_schema: {
          type: "object",
          properties: {
            twitter: {
              type: "object",
              properties: {
                text: { type: "string" },
                hashtags: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            facebook: {
              type: "object",
              properties: {
                text: { type: "string" },
                hashtags: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            instagram: {
              type: "object",
              properties: {
                caption: { type: "string" },
                hashtags: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            linkedin: {
              type: "object",
              properties: {
                text: { type: "string" },
                hashtags: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            general_hashtags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setGeneratedPosts(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text, platform) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Share2 className="w-6 h-6 text-cyan-400" />
          AI Social Media Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedPosts ? (
          <>
            <p className="text-slate-300 text-sm">
              Generate platform-optimized social media posts with hashtags for promoting this episode.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Social Posts</>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="twitter" className="w-full">
              <TabsList className="w-full bg-slate-900/50 border border-slate-700 grid grid-cols-4">
                <TabsTrigger value="twitter" className="data-[state=active]:bg-blue-500">
                  <Twitter className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="facebook" className="data-[state=active]:bg-blue-600">
                  <Facebook className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="instagram" className="data-[state=active]:bg-pink-500">
                  <Instagram className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="linkedin" className="data-[state=active]:bg-blue-700">
                  LinkedIn
                </TabsTrigger>
              </TabsList>

              <TabsContent value="twitter" className="mt-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-blue-500">
                      <Twitter className="w-3 h-3 mr-1" />
                      Twitter/X
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${generatedPosts.twitter.text}\n\n${generatedPosts.twitter.hashtags.join(' ')}`,
                        'twitter'
                      )}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {copied === 'twitter' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                      )}
                    </Button>
                  </div>
                  <p className="text-white mb-3">{generatedPosts.twitter.text}</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPosts.twitter.hashtags.map(tag => (
                      <Badge key={tag} className="bg-blue-500/20 text-blue-400 text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="facebook" className="mt-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-blue-600">
                      <Facebook className="w-3 h-3 mr-1" />
                      Facebook
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${generatedPosts.facebook.text}\n\n${generatedPosts.facebook.hashtags.join(' ')}`,
                        'facebook'
                      )}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {copied === 'facebook' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                      )}
                    </Button>
                  </div>
                  <p className="text-white mb-3 whitespace-pre-wrap">{generatedPosts.facebook.text}</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPosts.facebook.hashtags.map(tag => (
                      <Badge key={tag} className="bg-blue-600/20 text-blue-400 text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="instagram" className="mt-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-pink-500">
                      <Instagram className="w-3 h-3 mr-1" />
                      Instagram
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${generatedPosts.instagram.caption}\n\n${generatedPosts.instagram.hashtags.join(' ')}`,
                        'instagram'
                      )}
                      className="bg-pink-500 hover:bg-pink-600"
                    >
                      {copied === 'instagram' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                      )}
                    </Button>
                  </div>
                  <p className="text-white mb-3 whitespace-pre-wrap">{generatedPosts.instagram.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPosts.instagram.hashtags.map(tag => (
                      <Badge key={tag} className="bg-pink-500/20 text-pink-400 text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="linkedin" className="mt-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-blue-700">LinkedIn</Badge>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `${generatedPosts.linkedin.text}\n\n${generatedPosts.linkedin.hashtags.join(' ')}`,
                        'linkedin'
                      )}
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      {copied === 'linkedin' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                      )}
                    </Button>
                  </div>
                  <p className="text-white mb-3 whitespace-pre-wrap">{generatedPosts.linkedin.text}</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPosts.linkedin.hashtags.map(tag => (
                      <Badge key={tag} className="bg-blue-700/20 text-blue-400 text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
              <h5 className="text-white font-semibold mb-2 text-sm">All Hashtag Suggestions:</h5>
              <div className="flex flex-wrap gap-1">
                {generatedPosts.general_hashtags?.map(tag => (
                  <Badge key={tag} className="bg-slate-700 text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setGeneratedPosts(null)}
              variant="outline"
              className="w-full border-slate-700"
            >
              Generate New Posts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}