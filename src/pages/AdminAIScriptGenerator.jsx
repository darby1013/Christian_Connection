import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Copy, Download, RefreshCw, Save, Book, Video, FileText } from "lucide-react";

export default function AdminAIScriptGenerator() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("sermon");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  // Sermon Generator State
  const [sermonForm, setSermonForm] = useState({
    topic: "",
    duration: 30,
    scripture: "",
    audience: "general",
    style: "expository"
  });
  const [sermonOutput, setSermonOutput] = useState(null);

  // Live Stream Script State
  const [streamForm, setStreamForm] = useState({
    topic: "",
    duration: 45,
    format: "teaching",
    tone: "conversational"
  });
  const [streamOutput, setStreamOutput] = useState(null);

  // Video Script State
  const [videoForm, setVideoForm] = useState({
    topic: "",
    duration: 10,
    style: "documentary",
    platform: "youtube"
  });
  const [videoOutput, setVideoOutput] = useState(null);

  // Sermon Generator
  const generateSermonMutation = useMutation({
    mutationFn: async (params) => {
      const prompt = `Create a comprehensive sermon outline on "${params.topic}" for a ${params.duration}-minute sermon.

Style: ${params.style}
Audience: ${params.audience}
${params.scripture ? `Key Scripture: ${params.scripture}` : ''}

Structure the sermon with:
1. Opening Prayer (1-2 minutes)
2. Introduction with Hook (3-5 minutes)
3. Main Points (3-5 points with scripture references, illustrations, and applications)
4. Practical Application
5. Conclusion with Call to Action
6. Closing Prayer

Include:
- Specific scripture references (book, chapter, verse)
- Illustrations and real-life examples
- Discussion questions
- Key takeaways
- Suggested worship songs

Make it authentic, biblically sound, and engaging for a Christian community.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            scripture_references: { type: "array", items: { type: "string" } },
            opening_prayer: { type: "string" },
            introduction: { type: "string" },
            main_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  scripture: { type: "string" },
                  content: { type: "string" },
                  illustration: { type: "string" },
                  application: { type: "string" }
                }
              }
            },
            practical_application: { type: "string" },
            conclusion: { type: "string" },
            closing_prayer: { type: "string" },
            discussion_questions: { type: "array", items: { type: "string" } },
            key_takeaways: { type: "array", items: { type: "string" } },
            worship_songs: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setSermonOutput(data);
    }
  });

  // Live Stream Script Generator
  const generateStreamScriptMutation = useMutation({
    mutationFn: async (params) => {
      const prompt = `Create a professional ${params.duration}-minute live stream host script on "${params.topic}".

Format: ${params.format}
Tone: ${params.tone}

Structure the script with time markers for a ${params.duration}-minute broadcast:

1. Opening Segment (3-5 min)
   - Welcome and introduction
   - Today's topic overview
   - Engage viewers

2. Main Content Segments (divided into 3-4 parts)
   - Each segment 8-12 minutes
   - Include talking points
   - Viewer interaction prompts
   - Visual/graphic cues

3. Mid-Stream Break (2-3 min)
   - Recap key points
   - Respond to live chat
   - Transition to next segment

4. Closing Segment (3-5 min)
   - Summary of key takeaways
   - Call to action
   - Next stream preview
   - Thank viewers

Include:
- Time stamps for each segment
- Viewer interaction prompts
- Visual cue suggestions
- Ad-lib notes
- Emergency topic pivots

Make it natural, engaging, and suitable for Christian live streaming.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            total_duration: { type: "number" },
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  duration: { type: "number" },
                  time_stamp: { type: "string" },
                  content: { type: "string" },
                  talking_points: { type: "array", items: { type: "string" } },
                  interaction_prompts: { type: "array", items: { type: "string" } },
                  visual_cues: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            key_messages: { type: "array", items: { type: "string" } },
            call_to_action: { type: "string" }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setStreamOutput(data);
    }
  });

  // Video Script Generator
  const generateVideoScriptMutation = useMutation({
    mutationFn: async (params) => {
      const prompt = `Create a professional ${params.duration}-minute video script on "${params.topic}".

Style: ${params.style}
Platform: ${params.platform}

Structure as a professional video script:

1. COLD OPEN (15-30 seconds)
   - Hook that grabs attention
   - Visual description

2. INTRODUCTION (30-60 seconds)
   - Host introduces topic
   - What viewers will learn
   - Subscribe/like prompt

3. MAIN CONTENT
   - Broken into clear sections
   - B-roll suggestions
   - Graphics/text overlay notes
   - Music cues

4. CONCLUSION (30-45 seconds)
   - Recap key points
   - Strong call to action
   - Next video teaser

Include:
- Shot descriptions [WIDE SHOT], [CLOSE UP], [B-ROLL]
- On-screen text suggestions [TEXT: "..."]
- Music/sound cues [MUSIC: Upbeat]
- Timing for each section
- Alternative lines for retakes

Format for professional video production.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scene_number: { type: "number" },
                  duration: { type: "string" },
                  shot_type: { type: "string" },
                  dialogue: { type: "string" },
                  visual_description: { type: "string" },
                  on_screen_text: { type: "string" },
                  music_sfx: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            estimated_duration: { type: "string" },
            production_notes: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setVideoOutput(data);
    }
  });

  // Save Script to Database
  const saveScriptMutation = useMutation({
    mutationFn: async ({ scriptData, type }) => {
      let content = "";
      let segments = [];
      let bible_references = [];
      let key_points = [];

      if (type === "sermon" && sermonOutput) {
        content = `${sermonOutput.opening_prayer}\n\n${sermonOutput.introduction}\n\n`;
        sermonOutput.main_points.forEach((point, idx) => {
          content += `## Point ${idx + 1}: ${point.title}\n${point.content}\n\n`;
          segments.push({
            title: point.title,
            duration: Math.floor(scriptData.duration / sermonOutput.main_points.length),
            content: point.content,
            notes: point.illustration
          });
        });
        content += `\n\n${sermonOutput.conclusion}\n\n${sermonOutput.closing_prayer}`;
        bible_references = sermonOutput.scripture_references || [];
        key_points = sermonOutput.key_takeaways || [];
      } else if (type === "stream" && streamOutput) {
        streamOutput.segments.forEach(segment => {
          content += `[${segment.time_stamp}] ${segment.title}\n${segment.content}\n\n`;
        });
        segments = streamOutput.segments;
        key_points = streamOutput.key_messages || [];
      } else if (type === "video" && videoOutput) {
        videoOutput.scenes.forEach(scene => {
          content += `SCENE ${scene.scene_number} [${scene.duration}]\n${scene.shot_type}\n${scene.dialogue}\n\n`;
        });
      }

      return base44.entities.StreamScript.create({
        title: scriptData.title,
        topic: scriptData.topic,
        script_type: type,
        duration: scriptData.duration,
        content,
        segments,
        bible_references,
        key_points,
        author_id: user.id,
        author_name: user.full_name,
        is_ai_generated: true,
        tags: [scriptData.topic.toLowerCase(), type]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamScripts'] });
      alert('Script saved successfully! You can now use it in your broadcasts.');
    }
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">AI Script Generator</h2>
        <p className="text-slate-400 font-semibold">Generate professional scripts powered by AI</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="sermon" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            <Book className="w-4 h-4 mr-2" />
            Sermon Outline
          </TabsTrigger>
          <TabsTrigger value="stream" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            <Video className="w-4 h-4 mr-2" />
            Live Stream Script
          </TabsTrigger>
          <TabsTrigger value="video" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Video Script
          </TabsTrigger>
        </TabsList>

        {/* Sermon Tab */}
        <TabsContent value="sermon" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Sermon Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white font-bold">Topic</Label>
                  <Input
                    placeholder="e.g., The Power of Faith, God's Grace"
                    value={sermonForm.topic}
                    onChange={(e) => setSermonForm({...sermonForm, topic: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={sermonForm.duration}
                    onChange={(e) => setSermonForm({...sermonForm, duration: parseInt(e.target.value)})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold">Key Scripture (optional)</Label>
                  <Input
                    placeholder="e.g., John 3:16, Romans 8:28"
                    value={sermonForm.scripture}
                    onChange={(e) => setSermonForm({...sermonForm, scripture: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold">Style</Label>
                    <Select value={sermonForm.style} onValueChange={(value) => setSermonForm({...sermonForm, style: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="expository" className="text-white">Expository</SelectItem>
                        <SelectItem value="topical" className="text-white">Topical</SelectItem>
                        <SelectItem value="narrative" className="text-white">Narrative</SelectItem>
                        <SelectItem value="textual" className="text-white">Textual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-bold">Audience</Label>
                    <Select value={sermonForm.audience} onValueChange={(value) => setSermonForm({...sermonForm, audience: value})}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="general" className="text-white">General</SelectItem>
                        <SelectItem value="youth" className="text-white">Youth</SelectItem>
                        <SelectItem value="adults" className="text-white">Adults</SelectItem>
                        <SelectItem value="seniors" className="text-white">Seniors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => generateSermonMutation.mutate(sermonForm)}
                  disabled={!sermonForm.topic || generateSermonMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  {generateSermonMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Sermon
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {sermonOutput && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white font-black">{sermonOutput.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(JSON.stringify(sermonOutput, null, 2))}
                      className="border-slate-700 text-slate-300"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveScriptMutation.mutate({ 
                        scriptData: { ...sermonForm, title: sermonOutput.title }, 
                        type: 'sermon' 
                      })}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">Scripture References</h4>
                    <div className="flex flex-wrap gap-2">
                      {sermonOutput.scripture_references?.map((ref, idx) => (
                        <Badge key={idx} className="bg-purple-500">{ref}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">Main Points</h4>
                    {sermonOutput.main_points?.map((point, idx) => (
                      <div key={idx} className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                        <h5 className="text-white font-bold mb-1">{idx + 1}. {point.title}</h5>
                        <p className="text-xs text-slate-400 mb-2">📖 {point.scripture}</p>
                        <p className="text-sm text-slate-300">{point.content}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">Key Takeaways</h4>
                    <ul className="space-y-1">
                      {sermonOutput.key_takeaways?.map((takeaway, idx) => (
                        <li key={idx} className="text-sm text-slate-300">✓ {takeaway}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Stream Script Tab */}
        <TabsContent value="stream" className="space-y-6 mt-6">
          {/* Similar structure to sermon tab with streamForm and streamOutput */}
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">30-60 Minute Live Stream Scripts</p>
            <p className="text-slate-400">Professional scripts with time markers and interaction prompts</p>
          </div>
        </TabsContent>

        {/* Video Script Tab */}
        <TabsContent value="video" className="space-y-6 mt-6">
          {/* Similar structure with videoForm and videoOutput */}
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">Professional Video Scripts</p>
            <p className="text-slate-400">Production-ready scripts with shot descriptions and timing</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}