
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label"; // Ensure Label is imported as it's used in both old and new code
import { base44 } from "@/api/base44Client"; // New import
import {
  MessageSquare, Users, FileText, Hand, Mic, MicOff,
  Crown, CheckCircle, Send, AlertCircle, Eye, Edit, Save,
  TrendingUp, TrendingDown, Heart, Frown, Meh, Smile, // New Lucide icons
  BarChart3, Zap, AlertTriangle, Activity // New Lucide icons
} from "lucide-react";
import { format } from "date-fns";

export default function CoHostCollaboration({ 
  user, 
  coHosts, 
  isLive,
  script,
  onScriptUpdate,
  showNotes,
  onShowNotesUpdate
}) {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [raisedHands, setRaisedHands] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(user);
  const [editingScript, setEditingScript] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [localScript, setLocalScript] = useState(script?.content || '');
  const [localNotes, setLocalNotes] = useState(showNotes || '');

  // Real-time Analytics - New state variables
  const [sentimentData, setSentimentData] = useState({
    overall: 'neutral',
    positive: 0,
    neutral: 0,
    negative: 0
  });
  const [coHostEngagement, setCoHostEngagement] = useState({});
  const [engagementTrend, setEngagementTrend] = useState('stable');
  const [showEngagementAlert, setShowEngagementAlert] = useState(false);
  const [recentSentiments, setRecentSentiments] = useState([]);

  const chatEndRef = useRef(null);
  const sentimentCheckInterval = useRef(null); // New useRef

  useEffect(() => {
    if (script) {
      setLocalScript(script.content || '');
    }
  }, [script]);

  useEffect(() => {
    setLocalNotes(showNotes || '');
  }, [showNotes]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize co-host engagement scores - New useEffect
  useEffect(() => {
    const scores = {};
    // Ensure all coHosts and the current user are initialized
    [...coHosts, user].filter(Boolean).forEach(host => { // Filter out null/undefined if user isn't always present
      if (!scores[host.id]) { // Avoid re-initializing if host is already there (e.g., if 'user' is also in 'coHosts')
        scores[host.id] = {
          messages: 0,
          airTime: 0,
          engagementScore: 50, // Default engagement score
          lastActive: new Date()
        };
      }
    });
    setCoHostEngagement(scores);
  }, [coHosts, user]); // Depend on coHosts and user

  // Real-time sentiment analysis - New useEffect
  useEffect(() => {
    if (isLive) {
      // Clear any existing interval before setting a new one
      if (sentimentCheckInterval.current) {
        clearInterval(sentimentCheckInterval.current);
      }
      
      sentimentCheckInterval.current = setInterval(async () => {
        await analyzeSentiment();
      }, 15000); // Every 15 seconds
    } else {
      if (sentimentCheckInterval.current) {
        clearInterval(sentimentCheckInterval.current);
      }
    }

    return () => {
      if (sentimentCheckInterval.current) {
        clearInterval(sentimentCheckInterval.current);
      }
    };
  }, [isLive, chatMessages.length]); // Re-run if live status changes or chat messages count changes (to trigger analysis)

  // analyzeSentiment function - New function
  const analyzeSentiment = async () => {
    // Only analyze if there are messages and the component is live
    if (chatMessages.length === 0 || !isLive) return;

    try {
      // Get recent messages for analysis, excluding system/action messages
      const recentMessages = chatMessages.slice(-10).filter(m => m.type === 'message');
      if (recentMessages.length === 0) return;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the sentiment of these live podcast chat messages, considering the context of a co-host collaboration for a live podcast. Assume the audience is interacting in the chat.

${recentMessages.map(m => `${m.sender}: ${m.text}`).join('\n')}

Provide:
1. Overall sentiment (positive, neutral, negative)
2. Percentage breakdown (positive %, neutral %, negative %) of recent messages.
3. Engagement trend (rising, stable, dropping) based on the sentiment over time or direct engagement cues.
4. Key sentiment indicators (excitement, confusion, appreciation, topic suggestions, etc.) - extract specific themes.
5. Actionable insights/suggestions for hosts to improve engagement or address audience sentiment.

Be specific and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_sentiment: { type: "string", description: "Overall sentiment (positive, neutral, negative)" },
            positive_percent: { type: "number", description: "Percentage of positive sentiment messages" },
            neutral_percent: { type: "number", description: "Percentage of neutral sentiment messages" },
            negative_percent: { type: "number", description: "Percentage of negative sentiment messages" },
            engagement_trend: { type: "string", description: "Trend of audience engagement (rising, stable, dropping)" },
            key_indicators: { type: "array", items: { type: "string" }, description: "Key themes or indicators from the chat" },
            host_suggestion: { type: "string", description: "Actionable suggestion for hosts" }
          },
          required: ["overall_sentiment", "positive_percent", "neutral_percent", "negative_percent", "engagement_trend", "key_indicators", "host_suggestion"]
        }
      });

      setSentimentData({
        overall: result.overall_sentiment,
        positive: result.positive_percent,
        neutral: result.neutral_percent,
        negative: result.negative_percent,
        trend: result.engagement_trend,
        indicators: result.key_indicators,
        suggestion: result.host_suggestion
      });

      setEngagementTrend(result.engagement_trend);
      setRecentSentiments(prev => [
        { timestamp: new Date(), sentiment: result.overall_sentiment },
        ...prev.slice(0, 9) // Keep last 10 sentiments
      ]);

      // Alert on engagement drop or negative sentiment peak
      if (result.engagement_trend === 'dropping' || result.negative_percent > 30) {
        setShowEngagementAlert(true);
        setTimeout(() => setShowEngagementAlert(false), 10000); // Show for 10 seconds
      }

      // Alert on engagement peak
      if (result.positive_percent > 70) {
        setShowEngagementAlert(true);
        setTimeout(() => setShowEngagementAlert(false), 5000); // Show for 5 seconds
      }

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Optionally, set an error state or display a message
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: user.full_name,
      senderId: user.id,
      text: newMessage,
      timestamp: new Date(),
      type: 'message'
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');

    // Update co-host engagement - Modified logic
    setCoHostEngagement(prev => {
      const updated = { ...prev };
      if (updated[user.id]) {
        updated[user.id] = {
          ...updated[user.id],
          messages: updated[user.id].messages + 1,
          engagementScore: Math.min(100, updated[user.id].engagementScore + 2), // Increase score
          lastActive: new Date()
        };
      }
      return updated;
    });
  };

  const raiseHand = () => {
    if (raisedHands.find(h => h.id === user.id)) {
      setRaisedHands(raisedHands.filter(h => h.id !== user.id));
    } else {
      setRaisedHands([...raisedHands, {
        id: user.id,
        name: user.full_name,
        timestamp: new Date()
      }]);

      // Add to chat
      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender: user.full_name,
        senderId: user.id,
        text: '✋ Raised hand',
        timestamp: new Date(),
        type: 'action'
      }]);
    }
  };

  const passControl = (coHost) => {
    setCurrentSpeaker(coHost);
    
    setChatMessages([...chatMessages, {
      id: Date.now(),
      sender: 'System',
      senderId: 'system',
      text: `🎙️ ${user.full_name} passed control to ${coHost.name}`,
      timestamp: new Date(),
      type: 'system'
    }]);

    // Update co-host engagement for air time (simplified for now)
    setCoHostEngagement(prev => {
      const updated = { ...prev };
      // Decrease previous speaker's engagement, increase new speaker's
      if (updated[user.id]) {
        updated[user.id] = { ...updated[user.id], engagementScore: Math.max(0, updated[user.id].engagementScore - 5) };
      }
      if (updated[coHost.id]) {
        updated[coHost.id] = { ...updated[coHost.id], engagementScore: Math.min(100, updated[coHost.id].engagementScore + 10) };
      }
      return updated;
    });
  };

  const sendCue = (cueText) => {
    setChatMessages([...chatMessages, {
      id: Date.now(),
      sender: user.full_name,
      senderId: user.id,
      text: `📌 CUE: ${cueText}`,
      timestamp: new Date(),
      type: 'cue'
    }]);
  };

  const saveScript = () => {
    if (onScriptUpdate) {
      onScriptUpdate(localScript);
      setEditingScript(false);
      
      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender: 'System',
        senderId: 'system',
        text: `📝 ${user.full_name} updated the script`,
        timestamp: new Date(),
        type: 'system'
      }]);
    }
  };

  const saveNotes = () => {
    if (onShowNotesUpdate) {
      onShowNotesUpdate(localNotes);
      setEditingNotes(false);
      
      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender: 'System',
        senderId: 'system',
        text: `📋 ${user.full_name} updated show notes`,
        timestamp: new Date(),
        type: 'system'
      }]);
    }
  };

  const quickCues = [
    '🎬 Start segment',
    '⏰ Time check',
    '❓ Take questions',
    '🎵 Music break',
    '📢 Announcement',
    '✅ Wrap up'
  ];

  // Helper functions for analytics display - New functions
  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-green-400" />;
      case 'negative': return <Frown className="w-4 h-4 text-red-400" />;
      default: return <Meh className="w-4 h-4 text-amber-400" />;
    }
  };

  const getEngagementColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Engagement Alert Banner - New JSX */}
      {showEngagementAlert && isLive && (
        <Card className={`border-2 ${
          sentimentData.positive > 70 ? 'bg-green-900/30 border-green-500' :
          engagementTrend === 'dropping' || sentimentData.negative > 30 ? 'bg-red-900/30 border-red-500' :
          'bg-amber-900/30 border-amber-500'
        } animate-pulse`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {sentimentData.positive > 70 && engagementTrend === 'rising' ? ( // Also check for rising trend
                <>
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <div>
                    <h4 className="text-green-300 font-bold">🔥 Engagement Peak!</h4>
                    <p className="text-green-200 text-sm">{sentimentData.positive}% positive sentiment - Keep it up!</p>
                  </div>
                </>
              ) : engagementTrend === 'dropping' || sentimentData.negative > 30 ? (
                <>
                  <TrendingDown className="w-6 h-6 text-red-400" />
                  <div>
                    <h4 className="text-red-300 font-bold">⚠️ Engagement Alert: {sentimentData.negative > 30 ? 'High Negative Sentiment' : 'Dropping Engagement'}</h4>
                    <p className="text-red-200 text-sm">{sentimentData.suggestion || 'Consider changing topic or asking questions to re-engage.'}</p>
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Co-Host Collaboration
              {isLive && <Badge className="bg-red-500 animate-pulse ml-2">LIVE</Badge>}
            </CardTitle>
            {isLive && ( // Live sentiment badge - Modified JSX
              <Badge className={`flex items-center gap-1 ${
                sentimentData.overall === 'positive' ? 'bg-green-600/50 text-green-200' :
                sentimentData.overall === 'negative' ? 'bg-red-600/50 text-red-200' :
                'bg-amber-600/50 text-amber-200'
              }`}>
                {getSentimentIcon(sentimentData.overall)}
                <span className="font-semibold">{Math.round((sentimentData.positive || 0))}% Positive</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 w-full grid grid-cols-5"> {/* Grid cols increased for new tab */}
              <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-500 text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat
                {chatMessages.length > 0 && (
                  <Badge className="ml-1 bg-red-500 text-xs">{chatMessages.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="control" className="data-[state=active]:bg-cyan-500 text-xs">
                <Mic className="w-3 h-3 mr-1" />
                Control
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500 text-xs"> {/* New TabsTrigger */}
                <BarChart3 className="w-3 h-3 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="script" className="data-[state=active]:bg-cyan-500 text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Script
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-cyan-500 text-xs">
                <Edit className="w-3 h-3 mr-1" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-4">
              <div className="space-y-3">
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto space-y-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.type === 'system' ? 'bg-blue-900/20 border border-blue-500/30' :
                            msg.type === 'cue' ? 'bg-amber-900/20 border border-amber-500/30' :
                            msg.type === 'action' ? 'bg-purple-900/20 border border-purple-500/30' :
                            msg.senderId === user.id ? 'bg-cyan-500/20 border border-cyan-500/30 ml-8' :
                            'bg-slate-800/50 border border-slate-700 mr-8'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {msg.type !== 'system' && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-cyan-500">
                                  {msg.sender?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-semibold text-xs ${
                                  msg.type === 'system' ? 'text-blue-400' :
                                  msg.type === 'cue' ? 'text-amber-400' :
                                  'text-white'
                                }`}>
                                  {msg.sender}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {format(msg.timestamp, 'HH:mm')}
                                </span>
                              </div>
                              <p className={`text-sm ${
                                msg.type === 'system' ? 'text-blue-200' :
                                msg.type === 'cue' ? 'text-amber-200' :
                                'text-slate-300'
                              }`}>
                                {msg.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Message co-hosts..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Button onClick={sendMessage} className="bg-cyan-500 hover:bg-cyan-600">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Cues */}
                <div>
                  <Label className="text-white text-xs mb-2 block">Quick Cues</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickCues.map((cue, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        onClick={() => sendCue(cue)}
                        className="bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-xs"
                      >
                        {cue}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Control Tab */}
            <TabsContent value="control" className="mt-4">
              <div className="space-y-4">
                {/* Current Speaker */}
                <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
                  <CardContent className="p-4">
                    <Label className="text-cyan-300 text-xs mb-2 block">CURRENT SPEAKER</Label>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-cyan-500">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-500 text-white font-bold">
                          {currentSpeaker.name?.[0] || currentSpeaker.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-bold">{currentSpeaker.name || currentSpeaker.full_name}</p>
                        <Badge className="bg-cyan-500">
                          <Mic className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pass Control */}
                <div>
                  <Label className="text-white font-bold mb-2 block">Pass Control To</Label>
                  <div className="space-y-2">
                    {coHosts.map((coHost) => (
                      <button
                        key={coHost.id}
                        onClick={() => passControl(coHost)}
                        className="w-full p-3 rounded-lg bg-slate-900/30 border border-slate-700 hover:border-cyan-500/50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                {coHost.name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-semibold text-sm">{coHost.name}</p>
                              <p className="text-slate-400 text-xs">{coHost.email}</p>
                            </div>
                          </div>
                          {currentSpeaker.id === coHost.id && (
                            <Badge className="bg-cyan-500">
                              <Mic className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Raised Hands */}
                {raisedHands.length > 0 && (
                  <Card className="bg-amber-900/20 border-amber-500/30">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-amber-300 font-bold text-sm flex items-center gap-2">
                        <Hand className="w-4 h-4" />
                        Raised Hands
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-1">
                      {raisedHands.map((hand) => (
                        <div key={hand.id} className="text-amber-200 text-xs flex items-center gap-2">
                          <Hand className="w-3 h-3" />
                          {hand.name} • {format(hand.timestamp, 'HH:mm:ss')}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Raise Hand Button */}
                <Button
                  onClick={raiseHand}
                  className={`w-full ${
                    raisedHands.find(h => h.id === user.id)
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <Hand className="w-4 h-4 mr-2" />
                  {raisedHands.find(h => h.id === user.id) ? 'Lower Hand' : 'Raise Hand'}
                </Button>
              </div>
            </TabsContent>

            {/* Real-time Analytics Tab - New TabsContent */}
            <TabsContent value="analytics" className="mt-4">
              <div className="space-y-4">
                {/* Sentiment Overview */}
                <Card className="bg-slate-900/30 border-slate-700">
                  <CardHeader className="py-2 px-3 border-b border-slate-700">
                    <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Live Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                        <Smile className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        <p className="text-green-300 font-bold text-lg">{sentimentData.positive}%</p>
                        <p className="text-green-200 text-xs">Positive</p>
                      </div>
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-center">
                        <Meh className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <p className="text-amber-300 font-bold text-lg">{sentimentData.neutral}%</p>
                        <p className="text-amber-200 text-xs">Neutral</p>
                      </div>
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-center">
                        <Frown className="w-5 h-5 text-red-400 mx-auto mb-1" />
                        <p className="text-red-300 font-bold text-lg">{sentimentData.negative}%</p>
                        <p className="text-red-200 text-xs">Negative</p>
                      </div>
                    </div>

                    {sentimentData.indicators && sentimentData.indicators.length > 0 && (
                      <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                        <Label className="text-blue-300 text-xs mb-1 block">Key Indicators</Label>
                        <div className="flex flex-wrap gap-1">
                          {sentimentData.indicators.map((indicator, idx) => (
                            <Badge key={idx} className="bg-blue-500 text-xs">{indicator}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {sentimentData.suggestion && (
                      <div className="p-2 bg-purple-900/20 border border-purple-500/30 rounded">
                        <Label className="text-purple-300 text-xs mb-1 block">AI Suggestion</Label>
                        <p className="text-purple-200 text-xs">{sentimentData.suggestion}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Engagement Trend */}
                <Card className={`border-2 ${
                  engagementTrend === 'rising' ? 'bg-green-900/20 border-green-500/30' :
                  engagementTrend === 'dropping' ? 'bg-red-900/20 border-red-500/30' :
                  'bg-slate-900/30 border-slate-700'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {engagementTrend === 'rising' ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : engagementTrend === 'dropping' ? (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        ) : (
                          <Activity className="w-5 h-5 text-amber-400" />
                        )}
                        <div>
                          <p className={`font-bold text-sm ${
                            engagementTrend === 'rising' ? 'text-green-300' :
                            engagementTrend === 'dropping' ? 'text-red-300' :
                            'text-amber-300'
                          }`}>
                            {engagementTrend === 'rising' ? 'Engagement Rising ↗' :
                             engagementTrend === 'dropping' ? 'Engagement Dropping ↘' :
                             'Engagement Stable →'}
                          </p>
                          <p className="text-slate-400 text-xs">Last analysis period</p>
                        </div>
                      </div>
                      <Badge className={
                        engagementTrend === 'rising' ? 'bg-green-500' :
                        engagementTrend === 'dropping' ? 'bg-red-500' :
                        'bg-amber-500'
                      }>
                        {engagementTrend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Co-Host Performance */}
                <Card className="bg-slate-900/30 border-slate-700">
                  <CardHeader className="py-2 px-3 border-b border-slate-700">
                    <CardTitle className="text-white font-bold text-sm">Co-Host Engagement Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {user && coHostEngagement[user.id] && (
                      <div className="p-2 bg-cyan-900/20 border border-cyan-500/30 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-purple-500">
                                {user.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white text-xs font-semibold">{user.full_name} (You)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${getEngagementColor(coHostEngagement[user.id].engagementScore)}`}>
                              {coHostEngagement[user.id].engagementScore}
                            </span>
                            <Badge className="bg-cyan-500 text-xs">
                              {coHostEngagement[user.id].messages} msgs
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {coHosts.map(host => {
                      const engagement = coHostEngagement[host.id] || { engagementScore: 50, messages: 0 };
                      return (
                        <div key={host.id} className="p-2 bg-slate-800/30 border border-slate-700 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500">
                                  {host.name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white text-xs font-semibold">{host.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${getEngagementColor(engagement.engagementScore)}`}>
                                {engagement.engagementScore}
                              </span>
                              <Badge className="bg-purple-500 text-xs">
                                {engagement.messages} msgs
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded mt-3">
                      <p className="text-blue-200 text-xs">
                        <BarChart3 className="w-3 h-3 inline mr-1" />
                        Scores update based on messages, air time (via control pass), and potential audience reactions.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment History */}
                {recentSentiments.length > 0 && (
                  <Card className="bg-slate-900/30 border-slate-700">
                    <CardHeader className="py-2 px-3 border-b border-slate-700">
                      <CardTitle className="text-white font-bold text-sm">Sentiment Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1 h-16">
                        {/* Map in reverse to show newest on the right */}
                        {[...recentSentiments].reverse().map((sent, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 h-full rounded ${
                              sent.sentiment === 'positive' ? 'bg-green-500/50' :
                              sent.sentiment === 'negative' ? 'bg-red-500/50' :
                              'bg-amber-500/50'
                            }`}
                            title={`Sentiment: ${sent.sentiment} at ${format(sent.timestamp, 'HH:mm:ss')}`}
                          />
                        ))}
                      </div>
                      <p className="text-slate-400 text-xs text-center mt-2">
                        Last {recentSentiments.length} analysis periods
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Collaborative Script Tab */}
            <TabsContent value="script" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-bold">Live Script</Label>
                  <div className="flex gap-2">
                    {!editingScript ? (
                      <Button
                        size="sm"
                        onClick={() => setEditingScript(true)}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={saveScript}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingScript(false);
                            setLocalScript(script?.content || '');
                          }}
                          variant="outline"
                          className="border-slate-700"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {editingScript ? (
                  <Textarea
                    value={localScript}
                    onChange={(e) => setLocalScript(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white h-96 font-mono text-sm"
                    placeholder="Edit script here... Changes are visible to all co-hosts"
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-96 overflow-y-auto">
                    <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                      {localScript || 'No script loaded'}
                    </pre>
                  </div>
                )}

                {isLive && (
                  <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded text-center">
                    <p className="text-blue-300 text-xs">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Real-time sync - All co-hosts see changes instantly
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Collaborative Notes Tab */}
            <TabsContent value="notes" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-bold">Show Notes (Collaborative)</Label>
                  <div className="flex gap-2">
                    {!editingNotes ? (
                      <Button
                        size="sm"
                        onClick={() => setEditingNotes(true)}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={saveNotes}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingNotes(false);
                            setLocalNotes(showNotes || '');
                          }}
                          variant="outline"
                          className="border-slate-700"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {editingNotes ? (
                  <Textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white h-96"
                    placeholder="Add show notes, timestamps, links, etc..."
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-96 overflow-y-auto">
                    <pre className="text-slate-300 text-sm whitespace-pre-wrap">
                      {localNotes || 'No show notes yet'}
                    </pre>
                  </div>
                )}

                <div className="p-2 bg-purple-900/20 border border-purple-500/30 rounded text-center">
                  <p className="text-purple-300 text-xs">
                    <Users className="w-3 h-3 inline mr-1" />
                    Shared with all {coHosts.length} co-host{coHosts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Active Co-Hosts Status - Modified JSX */}
          {coHosts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <Label className="text-white text-xs mb-2 block">ACTIVE CO-HOSTS</Label>
              <div className="flex flex-wrap gap-2">
                {user && coHostEngagement[user.id] && ( // Add current user to active hosts display
                  <Badge
                    key={user.id}
                    className={
                      currentSpeaker.id === user.id
                        ? 'bg-cyan-500 flex items-center gap-1'
                        : 'bg-slate-600 flex items-center gap-1'
                    }
                    title={`Engagement: ${coHostEngagement[user.id].engagementScore}`}
                  >
                    {currentSpeaker.id === user.id && <Crown className="w-3 h-3 mr-1" />}
                    {user.full_name}
                    <span className={`ml-1 font-semibold ${getEngagementColor(coHostEngagement[user.id].engagementScore)}`}>
                      {coHostEngagement[user.id].engagementScore}
                    </span>
                  </Badge>
                )}
                {coHosts.filter(ch => ch.id !== user.id).map((coHost) => { // Filter out user if already added
                  const engagement = coHostEngagement[coHost.id] || { engagementScore: 50 };
                  return (
                    <Badge
                      key={coHost.id}
                      className={
                        currentSpeaker.id === coHost.id
                          ? 'bg-cyan-500 flex items-center gap-1'
                          : 'bg-slate-600 flex items-center gap-1'
                      }
                      title={`Engagement: ${engagement.engagementScore}`}
                    >
                      {currentSpeaker.id === coHost.id && <Crown className="w-3 h-3 mr-1" />}
                      {coHost.name}
                      <span className={`ml-1 font-semibold ${getEngagementColor(engagement.engagementScore)}`}>
                        {engagement.engagementScore}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
