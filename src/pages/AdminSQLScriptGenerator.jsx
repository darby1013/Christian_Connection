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
  Sparkles, Code, Download, Copy, Loader2, Database,
  Zap, FileText, CheckCircle, Wand2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminSQLScriptGenerator() {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [generatedExplanation, setGeneratedExplanation] = useState('');

  const generateScriptMutation = useMutation({
    mutationFn: async (data) => {
      const prompt = `Generate a complete SQL database script for a website/application with the following specifications:

Project Name: ${data.projectName}
Description: ${data.projectDescription}
Required Features: ${data.features}

Please generate:
1. Complete SQL DDL (CREATE TABLE statements)
2. Sample INSERT statements for initial data
3. Indexes for performance
4. Foreign key relationships
5. Any necessary triggers or views

Make it production-ready and include comments explaining each section.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            sql_script: { type: 'string' },
            schema_description: { type: 'string' },
            explanation: { type: 'string' },
            tables_created: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setGeneratedScript(data.sql_script);
      setGeneratedSchema(data.schema_description);
      setGeneratedExplanation(data.explanation);
    },
  });

  const handleGenerate = () => {
    if (!projectName || !projectDescription) {
      alert('Please fill in project name and description');
      return;
    }

    generateScriptMutation.mutate({
      projectName,
      projectDescription,
      features
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    alert('SQL script copied to clipboard!');
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_database.sql`;
    a.click();
  };

  const templates = [
    {
      name: 'E-Commerce Store',
      description: 'Full-featured online store with products, orders, customers, and inventory management',
      features: 'Products, Categories, Shopping Cart, Orders, Customers, Payment Processing, Inventory Tracking, Reviews'
    },
    {
      name: 'Social Media Platform',
      description: 'Social networking site with users, posts, comments, and messaging',
      features: 'User Profiles, Posts, Comments, Likes, Followers, Direct Messages, Notifications, Media Uploads'
    },
    {
      name: 'Content Management System',
      description: 'CMS for blogs, articles, and media content',
      features: 'Articles, Authors, Categories, Tags, Comments, Media Library, SEO Metadata, Publishing Workflow'
    },
    {
      name: 'Project Management Tool',
      description: 'Collaborate on projects with tasks, teams, and time tracking',
      features: 'Projects, Tasks, Teams, Users, Time Tracking, Milestones, Comments, File Attachments'
    }
  ];

  const applyTemplate = (template) => {
    setProjectName(template.name);
    setProjectDescription(template.description);
    setFeatures(template.features);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            AI SQL Script Generator
          </h2>
          <p className="text-slate-400 font-semibold">Generate complete database scripts with AI in seconds</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Templates */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-purple-500/30">
            <CardHeader className="border-b border-purple-500/30">
              <CardTitle className="text-white font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                Quick Start Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-3">
                {templates.map((template, idx) => (
                  <Card
                    key={idx}
                    onClick={() => applyTemplate(template)}
                    className="bg-slate-900/50 border-slate-700 hover:border-purple-500 cursor-pointer transition-all group"
                  >
                    <CardContent className="p-4">
                      <h4 className="text-white font-bold mb-2 group-hover:text-purple-400 transition-colors">
                        {template.name}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2">
                        {template.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Project Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Project Name *</Label>
                <Input
                  placeholder="e.g., My E-Commerce Platform"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Description *</Label>
                <Textarea
                  placeholder="Describe your project in detail..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white h-24"
                />
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Features & Requirements</Label>
                <Textarea
                  placeholder="List key features (e.g., user authentication, product catalog, order management...)"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white h-32"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateScriptMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-lg py-6"
              >
                {generateScriptMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate SQL Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {generatedScript && (
            <Tabs defaultValue="script" className="w-full">
              <TabsList className="bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="script" className="data-[state=active]:bg-cyan-500">
                  <Code className="w-4 h-4 mr-2" />
                  SQL Script
                </TabsTrigger>
                <TabsTrigger value="schema" className="data-[state=active]:bg-cyan-500">
                  <Database className="w-4 h-4 mr-2" />
                  Schema
                </TabsTrigger>
                <TabsTrigger value="explanation" className="data-[state=active]:bg-cyan-500">
                  <FileText className="w-4 h-4 mr-2" />
                  Explanation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="script">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-bold">Generated SQL Script</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={copyToClipboard} variant="outline" className="border-slate-700 text-slate-300">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" onClick={downloadScript} className="bg-green-500 hover:bg-green-600">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="bg-slate-900 p-6 text-cyan-400 text-sm overflow-x-auto max-h-[600px] overflow-y-auto">
                      {generatedScript}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Schema Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 whitespace-pre-wrap">{generatedSchema}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="explanation">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Implementation Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 whitespace-pre-wrap">{generatedExplanation}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold text-sm">✨ AI Features</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Complete DDL</p>
                    <p className="text-slate-400 text-xs">CREATE TABLE statements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Sample Data</p>
                    <p className="text-slate-400 text-xs">INSERT statements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Relationships</p>
                    <p className="text-slate-400 text-xs">Foreign keys & indexes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Optimizations</p>
                    <p className="text-slate-400 text-xs">Performance indexes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">Documentation</p>
                    <p className="text-slate-400 text-xs">Inline comments</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardHeader className="border-b border-blue-500/30">
              <CardTitle className="text-blue-300 font-bold text-sm">💡 Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="text-blue-200 text-xs space-y-2">
                <li>• Be specific about your features</li>
                <li>• Mention user types and roles</li>
                <li>• Describe data relationships</li>
                <li>• Include security requirements</li>
                <li>• Specify any compliance needs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stats */}
          {generatedScript && (
            <Card className="bg-green-900/20 border-green-500/30">
              <CardHeader className="border-b border-green-500/30">
                <CardTitle className="text-green-300 font-bold text-sm">Script Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-200">Lines of Code:</span>
                    <span className="text-white font-bold">
                      {generatedScript.split('\n').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-200">Characters:</span>
                    <span className="text-white font-bold">
                      {generatedScript.length.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-200">Size:</span>
                    <span className="text-white font-bold">
                      {(generatedScript.length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}