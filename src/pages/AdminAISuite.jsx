import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { 
  Sparkles, BookOpen, FileText, MessageSquare, TrendingUp, Mic2,
  Video, Hash, Share2, Zap, Wand2, PenTool, Target, Search, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminAISuite() {
  const [activeCategory, setActiveCategory] = useState('all');

  const aiTools = {
    course: [
      { 
        name: 'AI Course Creator',
        description: 'Structure complete courses with AI assistance',
        icon: BookOpen,
        color: 'from-blue-500 to-cyan-500',
        page: 'AdminAICourseCreator',
        features: ['Full course outline', 'Module structure', 'Learning objectives', 'Prerequisites']
      },
      { 
        name: 'AI Lesson Generator',
        description: 'Generate engaging lesson content automatically',
        icon: FileText,
        color: 'from-purple-500 to-pink-500',
        page: 'AdminAILessonGenerator',
        features: ['Text content', 'Examples', 'Explanations', 'Visual aids']
      },
      { 
        name: 'AI Quiz Generator',
        description: 'Create assessments from course material',
        icon: Target,
        color: 'from-green-500 to-emerald-500',
        page: 'AdminAIQuizGenerator',
        features: ['Multiple choice', 'True/false', 'Short answer', 'Auto-grading']
      },
      { 
        name: 'AI Discussion Generator',
        description: 'Generate forum discussion prompts',
        icon: MessageSquare,
        color: 'from-amber-500 to-orange-500',
        page: 'AdminAIDiscussionGenerator',
        features: ['Thought-provoking questions', 'Debate topics', 'Critical thinking']
      },
      { 
        name: 'AI Learning Path Optimizer',
        description: 'Personalize student learning journeys',
        icon: TrendingUp,
        color: 'from-indigo-500 to-blue-500',
        page: 'AdminAILearningPathOptimizer',
        features: ['Progress analysis', 'Custom recommendations', 'Gap identification']
      },
    ],
    podcast: [
      { 
        name: 'AI Transcription Manager',
        description: 'High-accuracy audio transcription',
        icon: FileText,
        color: 'from-cyan-500 to-blue-500',
        page: 'AdminAITranscriptionManager',
        features: ['Real-time transcription', 'Speaker detection', 'Timestamps', 'Export formats']
      },
      { 
        name: 'AI Trailer Generator',
        description: 'Create engaging podcast trailers',
        icon: Video,
        color: 'from-pink-500 to-rose-500',
        page: 'AdminAITrailerGenerator',
        features: ['Auto highlight clips', 'Background music', 'Voice synthesis', '30-60s length']
      },
      { 
        name: 'AI Social Media Generator',
        description: 'Promote episodes across platforms',
        icon: Share2,
        color: 'from-purple-500 to-indigo-500',
        page: 'AdminAISocialMediaGenerator',
        features: ['Multi-platform posts', 'Audiograms', 'Quote graphics', 'Hashtags']
      },
      { 
        name: 'AI Chapter Generator',
        description: 'Auto-segment episodes into chapters',
        icon: Zap,
        color: 'from-green-500 to-teal-500',
        page: 'AdminAIChapterGenerator',
        features: ['Topic detection', 'Timestamps', 'Chapter titles', 'Descriptions']
      },
      { 
        name: 'AI Podcast Repurposing',
        description: 'Transform episodes into multiple formats',
        icon: Sparkles,
        color: 'from-amber-500 to-yellow-500',
        page: 'AdminAIPodcastRepurposing',
        features: ['Blog posts', 'Newsletters', 'Twitter threads', 'Video clips']
      },
    ],
    content: [
      { 
        name: 'AI Blog Post Generator',
        description: 'Generate complete blog posts from prompts',
        icon: PenTool,
        color: 'from-blue-500 to-indigo-500',
        page: 'AdminAIBlogGenerator',
        features: ['SEO optimized', 'Multiple tones', 'Keyword integration', 'Meta descriptions']
      },
      { 
        name: 'AI Tone Editor',
        description: 'Rewrite content in different tones',
        icon: Wand2,
        color: 'from-purple-500 to-pink-500',
        page: 'AdminAIToneEditor',
        features: ['Formal/casual', 'Persuasive', 'Friendly', 'Professional']
      },
      { 
        name: 'AI Tag & Metadata Generator',
        description: 'Auto-generate tags and SEO metadata',
        icon: Hash,
        color: 'from-cyan-500 to-blue-500',
        page: 'AdminAITagGenerator',
        features: ['Relevant tags', 'Meta titles', 'Descriptions', 'Keywords']
      },
      { 
        name: 'AI Content Enhancer',
        description: 'Improve readability and engagement',
        icon: Sparkles,
        color: 'from-green-500 to-emerald-500',
        page: 'AdminAIContentEnhancer',
        features: ['Grammar fixes', 'Clarity', 'Flow', 'Engagement boost']
      },
      { 
        name: 'AI SEO Optimizer',
        description: 'Analyze and optimize for search rankings',
        icon: Search,
        color: 'from-amber-500 to-orange-500',
        page: 'AdminAISEOOptimizer',
        features: ['Keyword analysis', 'Ranking tips', 'Meta optimization', 'Content score']
      },
    ]
  };

  const allTools = [...aiTools.course, ...aiTools.podcast, ...aiTools.content];
  const displayTools = activeCategory === 'all' ? allTools : aiTools[activeCategory];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="AI Suite"
        subtitle="15 enterprise AI tools for content creation, optimization & automation"
        icon={Sparkles}
        badge="ENTERPRISE"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <BookOpen className="w-12 h-12 text-blue-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{aiTools.course.length}</p>
            <p className="text-blue-300 text-sm font-bold">Course AI Tools</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <Mic2 className="w-12 h-12 text-purple-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{aiTools.podcast.length}</p>
            <p className="text-purple-300 text-sm font-bold">Podcast AI Tools</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <PenTool className="w-12 h-12 text-green-400 mb-3" />
            <p className="text-3xl font-black text-white mb-1">{aiTools.content.length}</p>
            <p className="text-green-300 text-sm font-bold">Content AI Tools</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-[#1e293b] border border-slate-700">
          <TabsTrigger value="all">All Tools ({allTools.length})</TabsTrigger>
          <TabsTrigger value="course">Course ({aiTools.course.length})</TabsTrigger>
          <TabsTrigger value="podcast">Podcast ({aiTools.podcast.length})</TabsTrigger>
          <TabsTrigger value="content">Content ({aiTools.content.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTools.map((tool, idx) => (
              <Link key={idx} to={createPageUrl(tool.page)}>
                <Card className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer h-full hover:shadow-2xl hover:shadow-cyan-500/10 hover:scale-105`}>
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <tool.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-black text-xl mb-2">{tool.name}</h3>
                    <p className="text-slate-400 text-sm mb-4 font-medium">{tool.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.features.slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {tool.features.length > 3 && (
                        <Badge variant="secondary" className="bg-slate-800 text-cyan-400 text-xs">
                          +{tool.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardContent className="p-8">
          <div className="flex items-center gap-4">
            <Sparkles className="w-16 h-16 text-purple-400" />
            <div className="flex-1">
              <p className="text-purple-300 font-black text-2xl mb-2">🚀 AI-Powered Platform</p>
              <p className="text-purple-200 text-sm mb-4">
                15 enterprise AI tools to automate content creation, optimize workflows, and enhance user experience across courses, podcasts, and blog content.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-purple-600">✓ GPT-4 Powered</Badge>
                <Badge className="bg-purple-600">✓ Real-time Generation</Badge>
                <Badge className="bg-purple-600">✓ Multi-format Export</Badge>
                <Badge className="bg-purple-600">✓ SEO Optimized</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}