import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { Share2, Sparkles, Loader2, Copy, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

export default function AdminAISocialMediaGenerator() {
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [platforms, setPlatforms] = useState(['twitter', 'facebook', 'instagram']);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState(null);

  const platformsList = [
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, charLimit: '280 chars' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, charLimit: 'No limit' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, charLimit: '2200 chars' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, charLimit: '3000 chars' }
  ];

  const generatePosts = async () => {
    if (!episodeTitle) return alert('Please enter episode title');

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create engaging social media posts for podcast episode: "${episodeTitle}"

Generate posts for: ${platforms.join(', ')}

For each platform:
- Optimized post text (respect character limits)
- Relevant hashtags (3-5)
- Emoji usage (platform-appropriate)
- Call-to-action
- Best posting time suggestion

Make posts engaging, shareable, and platform-specific.`,
        response_json_schema: {
          type: 'object',
          properties: {
            posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  post_text: { type: 'string' },
                  hashtags: { type: 'array', items: { type: 'string' } },
                  best_time: { type: 'string' },
                  engagement_tip: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setPosts(result);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const togglePlatform = (id) => {
    if (platforms.includes(id)) {
      setPlatforms(platforms.filter(p => p !== id));
    } else {
      setPlatforms([...platforms, id]);
    }
  };

  const getPlatformIcon = (platformName) => {
    const platform = platformsList.find(p => p.id === platformName.toLowerCase());
    return platform?.icon || Share2;
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Social Media Generator"
        subtitle="Create platform-optimized promotional content"
        icon={Share2}
        badge="AI"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Episode Title *</label>
              <Input
                placeholder="e.g., Building Habits That Last"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-white font-bold text-sm mb-3 block">Target Platforms</label>
              <div className="space-y-2">
                {platformsList.map(platform => {
                  const Icon = platform.icon;
                  return (
                    <label key={platform.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-800/50">
                      <Checkbox 
                        checked={platforms.includes(platform.id)} 
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{platform.name}</p>
                        <p className="text-slate-500 text-xs">{platform.charLimit}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={generatePosts}
              disabled={generating || platforms.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 font-bold h-12"
            >
              {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Posts</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {posts ? (
            <div className="space-y-4">
              {posts.posts?.map((post, i) => {
                const Icon = getPlatformIcon(post.platform);
                return (
                  <Card key={i} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <h4 className="text-white font-bold">{post.platform}</h4>
                        </div>
                        <Button size="sm" onClick={() => navigator.clipboard.writeText(post.post_text)}>
                          <Copy className="w-3 h-3 mr-1" />Copy
                        </Button>
                      </div>

                      <div className="bg-slate-900/50 p-4 rounded-lg mb-3">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{post.post_text}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.hashtags?.map((tag, j) => (
                          <Badge key={j} variant="secondary" className="bg-cyan-900/30 text-cyan-400 border border-cyan-500/30">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <p className="text-slate-500">Best time: {post.best_time}</p>
                        <p className="text-purple-400">{post.engagement_tip}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50">
              <CardContent className="p-16 text-center">
                <Share2 className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-bold text-xl mb-2">Ready to Promote</p>
                <p className="text-slate-400">AI will create platform-optimized posts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}