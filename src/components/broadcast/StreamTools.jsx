import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Timer, Users, MessageSquare, Heart, DollarSign, Share2, 
  Music, Image as ImageIcon
} from "lucide-react";

export default function StreamTools() {
  const [countdown, setCountdown] = useState({ minutes: 5, seconds: 0 });
  const [overlayText, setOverlayText] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white font-black text-lg">Stream Tools</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="w-full bg-slate-900/50 grid grid-cols-4">
            <TabsTrigger value="timer" className="data-[state=active]:bg-cyan-500 text-xs">
              <Timer className="w-3 h-3 mr-1" />
              Timer
            </TabsTrigger>
            <TabsTrigger value="overlay" className="data-[state=active]:bg-cyan-500 text-xs">
              <ImageIcon className="w-3 h-3 mr-1" />
              Overlay
            </TabsTrigger>
            <TabsTrigger value="poll" className="data-[state=active]:bg-cyan-500 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Poll
            </TabsTrigger>
            <TabsTrigger value="music" className="data-[state=active]:bg-cyan-500 text-xs">
              <Music className="w-3 h-3 mr-1" />
              Music
            </TabsTrigger>
          </TabsList>

          {/* Timer Tool */}
          <TabsContent value="timer" className="space-y-3 mt-4">
            <div className="text-center p-6 bg-slate-900/50 rounded-lg">
              <p className="text-5xl font-black text-cyan-400 mb-4">
                {countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                  Start
                </Button>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                  Reset
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Minutes"
                value={countdown.minutes}
                onChange={(e) => setCountdown({...countdown, minutes: parseInt(e.target.value) || 0})}
                className="bg-slate-900/50 border-slate-700 text-white text-sm"
              />
              <Input
                type="number"
                placeholder="Seconds"
                value={countdown.seconds}
                onChange={(e) => setCountdown({...countdown, seconds: parseInt(e.target.value) || 0})}
                className="bg-slate-900/50 border-slate-700 text-white text-sm"
              />
            </div>
          </TabsContent>

          {/* Text Overlay Tool */}
          <TabsContent value="overlay" className="space-y-3 mt-4">
            <Input
              placeholder="Enter overlay text..."
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white"
            />
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-cyan-500 hover:bg-cyan-600">
                Show Lower Third
              </Button>
              <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300">
                Show Banner
              </Button>
              <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300">
                Clear Overlay
              </Button>
            </div>
          </TabsContent>

          {/* Poll Tool */}
          <TabsContent value="poll" className="space-y-3 mt-4">
            <Input
              placeholder="Poll question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white"
            />
            <Button size="sm" className="w-full bg-purple-500 hover:bg-purple-600">
              Create Poll
            </Button>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">Active Poll</p>
              <p className="text-sm text-white mb-3">What topic should we discuss next?</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Faith</span>
                  <span className="text-cyan-400">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Hope</span>
                  <span className="text-cyan-400">35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Love</span>
                  <span className="text-cyan-400">20%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Music Tool */}
          <TabsContent value="music" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 justify-start">
                <Music className="w-4 h-4 mr-2" />
                Worship Background
              </Button>
              <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 justify-start">
                <Music className="w-4 h-4 mr-2" />
                Transition Music
              </Button>
              <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 justify-start">
                <Music className="w-4 h-4 mr-2" />
                Ending Theme
              </Button>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">Now Playing</p>
              <p className="text-sm text-white">Amazing Grace (Instrumental)</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-cyan-500"></div>
                </div>
                <span className="text-xs text-slate-400">1:24</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
            <Share2 className="w-3 h-3 mr-1" />
            Share
          </Button>
          <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
            <Heart className="w-3 h-3 mr-1" />
            Reactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}