import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, RotateCcw, Settings, Eye, EyeOff, 
  ChevronsUp, ChevronsDown, Type, Maximize2, Minimize2
} from "lucide-react";

export default function Teleprompter({ script, isVisible = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying && containerRef.current) {
      intervalRef.current = setInterval(() => {
        containerRef.current.scrollTop += scrollSpeed;
        
        const scrollPercentage = (containerRef.current.scrollTop / 
          (containerRef.current.scrollHeight - containerRef.current.clientHeight)) * 100;
        setProgress(scrollPercentage);

        if (scrollPercentage >= 99) {
          setIsPlaying(false);
        }
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, scrollSpeed]);

  const handleReset = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setProgress(0);
    }
    setIsPlaying(false);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={`bg-black border-amber-500/30 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader className="border-b border-amber-500/20 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-amber-400 font-black text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Teleprompter
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
              {progress.toFixed(0)}%
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-7 w-7 text-amber-400 hover:bg-amber-500/10"
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Script Content */}
        <div
          ref={containerRef}
          className={`bg-black overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-180px)]' : 'h-96'} px-8 py-12`}
          style={{
            scrollBehavior: 'smooth'
          }}
        >
          <div
            className="text-white font-mono leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          >
            {script?.content ? (
              <div className="max-w-4xl mx-auto">
                {script.content.split('\n').map((line, idx) => (
                  <p key={idx} className="mb-4">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center text-amber-400/50 py-20">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No script loaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-b from-slate-900 to-black border-t border-amber-500/20 p-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-10 w-10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              } text-white font-bold h-12 px-8`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setScrollSpeed(prev => Math.max(0.5, prev - 0.5))}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-10 w-10"
            >
              <ChevronsDown className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setScrollSpeed(prev => Math.min(5, prev + 0.5))}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-10 w-10"
            >
              <ChevronsUp className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-xs font-bold">Scroll Speed</span>
                <span className="text-amber-400 text-xs">{scrollSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[scrollSpeed]}
                onValueChange={([value]) => setScrollSpeed(value)}
                min={0.5}
                max={5}
                step={0.5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  Font Size
                </span>
                <span className="text-amber-400 text-xs">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => setFontSize(value)}
                min={16}
                max={48}
                step={2}
                className="w-full"
              />
            </div>
          </div>

          {script?.segments && (
            <div className="pt-3 border-t border-amber-500/20">
              <p className="text-amber-400 text-xs font-bold mb-2">Script Segments</p>
              <div className="flex flex-wrap gap-2">
                {script.segments.map((segment, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Scroll to segment (estimate based on index)
                      const percentage = (idx / script.segments.length) * 100;
                      const scrollTarget = (containerRef.current.scrollHeight * percentage) / 100;
                      containerRef.current.scrollTop = scrollTarget;
                    }}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7"
                  >
                    {idx + 1}. {segment.title} ({segment.duration}m)
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}