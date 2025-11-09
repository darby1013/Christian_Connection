import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Upload, Save, FileText, RefreshCw } from "lucide-react";

export default function ScriptEditor({ user, onScriptCreated }) {
  const [activeTab, setActiveTab] = useState("ai");
  const queryClient = useQueryClient();

  // AI Generation Form
  const [aiForm, setAiForm] = useState({
    title: "",
    category: "Worship",
    description: "",
    duration: 30,
    style: "professional"
  });

  // Manual Script Form
  const [manualScript, setManualScript] = useState({
    title: "",
    content: "",
    duration: 30
  });

  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null);

  const generateScriptMutation = useMutation({
    mutationFn: async (formData) => {
      const prompt = `Create a professional ${formData.duration}-minute live stream script for a Christian platform.

Title: "${formData.title}"
Category: ${formData.category}
Description: ${formData.description}
Style: ${formData.style}

Structure the script with:
1. Opening (30 seconds - 1 minute)
   - Welcome message
   - Topic introduction
   - Hook to engage viewers

2. Main Content (Split into 3-4 segments)
   - Each segment should be ${Math.floor(formData.duration / 4)}-${Math.floor(formData.duration / 3)} minutes
   - Include talking points
   - Add [PAUSE] markers for emphasis
   - Include [ENGAGE VIEWERS] prompts for interaction
   - Add visual cue suggestions

3. Closing (2-3 minutes)
   - Summary of key points
   - Call to action
   - Thank viewers
   - Next stream preview

Format with clear time markers like [00:00], [02:30], etc.
Include stage directions in [BRACKETS]
Make it conversational, authentic, and suitable for live streaming.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            full_script: { type: "string" },
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time_marker: { type: "string" },
                  segment_title: { type: "string" },
                  content: { type: "string" },
                  duration_minutes: { type: "number" }
                }
              }
            },
            key_messages: { type: "array", items: { type: "string" } },
            interaction_prompts: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Save to database
      const scriptData = {
        title: result.title || formData.title,
        topic: formData.category,
        script_type: "video",
        duration: formData.duration,
        content: result.full_script,
        segments: result.segments || [],
        key_points: result.key_messages || [],
        author_id: user.id,
        author_name: user.full_name,
        is_ai_generated: true,
        tags: [formData.category.toLowerCase(), "livestream"]
      };

      const savedScript = await base44.entities.StreamScript.create(scriptData);
      return savedScript;
    },
    onSuccess: (script) => {
      queryClient.invalidateQueries({ queryKey: ['streamScripts'] });
      if (onScriptCreated) onScriptCreated(script);
      // Reset form
      setAiForm({
        title: "",
        category: "Worship",
        description: "",
        duration: 30,
        style: "professional"
      });
    }
  });

  const saveManualScriptMutation = useMutation({
    mutationFn: async (scriptData) => {
      const data = {
        title: scriptData.title,
        topic: "Custom",
        script_type: "video",
        duration: scriptData.duration,
        content: scriptData.content,
        author_id: user.id,
        author_name: user.full_name,
        is_ai_generated: false,
        tags: ["manual", "livestream"]
      };

      const savedScript = await base44.entities.StreamScript.create(data);
      return savedScript;
    },
    onSuccess: (script) => {
      queryClient.invalidateQueries({ queryKey: ['streamScripts'] });
      if (onScriptCreated) onScriptCreated(script);
      setManualScript({ title: "", content: "", duration: 30 });
    }
  });

  const uploadScriptMutation = useMutation({
    mutationFn: async (file) => {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Read file content
      const text = await file.text();
      
      const data = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        topic: "Uploaded",
        script_type: "video",
        duration: 30,
        content: text,
        author_id: user.id,
        author_name: user.full_name,
        is_ai_generated: false,
        tags: ["uploaded", "livestream"]
      };

      const savedScript = await base44.entities.StreamScript.create(data);
      return savedScript;
    },
    onSuccess: (script) => {
      queryClient.invalidateQueries({ queryKey: ['streamScripts'] });
      if (onScriptCreated) onScriptCreated(script);
      setUploadedFile(null);
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setUploadedFile(file);
      } else {
        alert('Please upload a .txt file');
      }
    }
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-black">Create Script</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-900/50 border border-slate-700 mb-6">
            <TabsTrigger value="ai" className="flex-1 data-[state=active]:bg-purple-500">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 data-[state=active]:bg-cyan-500">
              <FileText className="w-4 h-4 mr-2" />
              Write Manual
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-green-500">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>

          {/* AI Generation Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Script Title *</Label>
              <Input
                placeholder="e.g., Sunday Morning Worship Service"
                value={aiForm.title}
                onChange={(e) => setAiForm({...aiForm, title: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-bold mb-2 block">Category</Label>
                <Select value={aiForm.category} onValueChange={(value) => setAiForm({...aiForm, category: value})}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Worship" className="text-white">Worship</SelectItem>
                    <SelectItem value="Teaching" className="text-white">Teaching</SelectItem>
                    <SelectItem value="Prayer" className="text-white">Prayer</SelectItem>
                    <SelectItem value="Testimony" className="text-white">Testimony</SelectItem>
                    <SelectItem value="Announcement" className="text-white">Announcement</SelectItem>
                    <SelectItem value="Interview" className="text-white">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-bold mb-2 block">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={aiForm.duration}
                  onChange={(e) => setAiForm({...aiForm, duration: parseInt(e.target.value)})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                  min="5"
                  max="120"
                />
              </div>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Description / Key Points</Label>
              <Textarea
                placeholder="Describe what you want to talk about, main points to cover, scripture references, etc."
                value={aiForm.description}
                onChange={(e) => setAiForm({...aiForm, description: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white h-32"
              />
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Style</Label>
              <Select value={aiForm.style} onValueChange={(value) => setAiForm({...aiForm, style: value})}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="professional" className="text-white">Professional</SelectItem>
                  <SelectItem value="conversational" className="text-white">Conversational</SelectItem>
                  <SelectItem value="energetic" className="text-white">Energetic</SelectItem>
                  <SelectItem value="contemplative" className="text-white">Contemplative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => generateScriptMutation.mutate(aiForm)}
              disabled={!aiForm.title || !aiForm.description || generateScriptMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
            >
              {generateScriptMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating AI Script...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Script with AI
                </>
              )}
            </Button>
          </TabsContent>

          {/* Manual Script Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Script Title *</Label>
              <Input
                placeholder="Enter script title"
                value={manualScript.title}
                onChange={(e) => setManualScript({...manualScript, title: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Duration (minutes)</Label>
              <Input
                type="number"
                value={manualScript.duration}
                onChange={(e) => setManualScript({...manualScript, duration: parseInt(e.target.value)})}
                className="bg-slate-900/50 border-slate-700 text-white"
                min="5"
                max="120"
              />
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Script Content *</Label>
              <Textarea
                placeholder="Write your script here..."
                value={manualScript.content}
                onChange={(e) => setManualScript({...manualScript, content: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white h-64 font-mono"
              />
              <p className="text-xs text-slate-400 mt-2">
                Tip: Use time markers like [00:00] and stage directions in [BRACKETS]
              </p>
            </div>

            <Button
              onClick={() => saveManualScriptMutation.mutate(manualScript)}
              disabled={!manualScript.title || !manualScript.content || saveManualScriptMutation.isPending}
              className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
            >
              {saveManualScriptMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Script
                </>
              )}
            </Button>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Upload Script File</Label>
              <Input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400 mt-2">
                Supported format: .txt (plain text)
              </p>
            </div>

            {uploadedFile && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-bold text-sm mb-1">File Ready</p>
                <p className="text-slate-300 text-sm">{uploadedFile.name}</p>
              </div>
            )}

            <Button
              onClick={() => uploadScriptMutation.mutate(uploadedFile)}
              disabled={!uploadedFile || uploadScriptMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-600 font-bold"
            >
              {uploadScriptMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Save Script
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}