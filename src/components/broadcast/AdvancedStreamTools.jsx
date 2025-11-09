import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Type, Layers, Volume2, Sparkles, Zap, MonitorPlay,
  MessageSquare, Users, TrendingUp, Award, Radio, Download
} from "lucide-react";

export default function AdvancedStreamTools() {
  const [lowerThirdEnabled, setLowerThirdEnabled] = useState(false);
  const [lowerThirdText, setLowerThirdText] = useState({ name: "", title: "" });
  const [chatOverlayEnabled, setChatOverlayEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [sceneTransition, setSceneTransition] = useState("fade");
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(30);
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  return (
    <div className="space-y-3">
      {/* Lower Thirds */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-400" />
              Lower Thirds
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setLowerThirdEnabled(!lowerThirdEnabled)}
              className={lowerThirdEnabled ? "bg-blue-500 h-7 text-xs" : "bg-slate-700 h-7 text-xs"}
            >
              {lowerThirdEnabled ? 'On' : 'Off'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Name</Label>
            <Input
              placeholder="John Doe"
              value={lowerThirdText.name}
              onChange={(e) => setLowerThirdText({...lowerThirdText, name: e.target.value})}
              className="bg-slate-900/50 border-slate-700 text-white h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Title</Label>
            <Input
              placeholder="Senior Pastor"
              value={lowerThirdText.title}
              onChange={(e) => setLowerThirdText({...lowerThirdText, title: e.target.value})}
              className="bg-slate-900/50 border-slate-700 text-white h-8 text-xs"
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Display name and title overlay on stream
          </p>
        </CardContent>
      </Card>

      {/* Scene Transitions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Scene Transitions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {['fade', 'slide', 'wipe', 'zoom'].map((transition) => (
              <Button
                key={transition}
                size="sm"
                onClick={() => setSceneTransition(transition)}
                className={sceneTransition === transition 
                  ? "bg-purple-500 h-8 text-xs" 
                  : "bg-slate-700 h-8 text-xs"}
              >
                {transition.charAt(0).toUpperCase() + transition.slice(1)}
              </Button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Smooth transitions between scenes
          </p>
        </CardContent>
      </Card>

      {/* Audio Mixer */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-green-400" />
            Audio Mixer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-slate-300 text-xs">Background Music</Label>
              <span className="text-slate-400 text-xs">{backgroundMusicVolume}%</span>
            </div>
            <Slider
              value={[backgroundMusicVolume]}
              onValueChange={([value]) => setBackgroundMusicVolume(value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" className="bg-slate-700 h-8 text-xs">
              Sound FX
            </Button>
            <Button size="sm" className="bg-slate-700 h-8 text-xs">
              Applause
            </Button>
          </div>
          <p className="text-slate-500 text-xs">
            Control audio levels and effects
          </p>
        </CardContent>
      </Card>

      {/* Chat Overlay */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Chat Overlay
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setChatOverlayEnabled(!chatOverlayEnabled)}
              className={chatOverlayEnabled ? "bg-cyan-500 h-7 text-xs" : "bg-slate-700 h-7 text-xs"}
            >
              {chatOverlayEnabled ? 'On' : 'Off'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-slate-300 text-xs mb-2">Display live chat messages on stream</p>
          <div className="space-y-1">
            <Label className="text-slate-400 text-xs flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Show usernames
            </Label>
            <Label className="text-slate-400 text-xs flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Filter profanity
            </Label>
            <Label className="text-slate-400 text-xs flex items-center gap-2">
              <input type="checkbox" />
              Show timestamps
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Notifications */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Alerts
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className={alertsEnabled ? "bg-yellow-500 h-7 text-xs" : "bg-slate-700 h-7 text-xs"}
            >
              {alertsEnabled ? 'On' : 'Off'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="text-slate-300 text-xs">New Follower</span>
              </div>
              <Badge className="bg-blue-500 text-xs">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-slate-300 text-xs">New Donation</span>
              </div>
              <Badge className="bg-green-500 text-xs">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2">
                <Award className="w-3 h-3 text-purple-400" />
                <span className="text-slate-300 text-xs">New Subscriber</span>
              </div>
              <Badge className="bg-purple-500 text-xs">Active</Badge>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Show on-screen alerts for engagement
          </p>
        </CardContent>
      </Card>

      {/* Stream Health Monitor */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" />
            Stream Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Bitrate</span>
            <Badge className="bg-green-600 text-xs">4500 kbps</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">FPS</span>
            <Badge className="bg-green-600 text-xs">30</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Dropped Frames</span>
            <Badge className="bg-green-600 text-xs">0%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">CPU Usage</span>
            <Badge className="bg-yellow-600 text-xs">45%</Badge>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Real-time stream quality metrics
          </p>
        </CardContent>
      </Card>

      {/* Recording */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-red-400" />
              Recording
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setRecordingEnabled(!recordingEnabled)}
              className={recordingEnabled ? "bg-red-500 h-7 text-xs animate-pulse" : "bg-slate-700 h-7 text-xs"}
            >
              {recordingEnabled ? 'Recording...' : 'Start'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-slate-300 text-xs mb-2">
            Record your stream locally while broadcasting
          </p>
          <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
            <span className="text-slate-400 text-xs">Quality</span>
            <Badge className="bg-slate-700 text-xs">1080p @ 60fps</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Camera */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700 py-2 px-3">
          <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-indigo-400" />
            Multi-Camera
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button size="sm" className="bg-indigo-500 h-8 text-xs">Camera 1</Button>
            <Button size="sm" className="bg-slate-700 h-8 text-xs">Camera 2</Button>
            <Button size="sm" className="bg-slate-700 h-8 text-xs">Screen Share</Button>
            <Button size="sm" className="bg-slate-700 h-8 text-xs">Graphics</Button>
          </div>
          <p className="text-slate-500 text-xs">
            Switch between multiple video sources
          </p>
        </CardContent>
      </Card>
    </div>
  );
}