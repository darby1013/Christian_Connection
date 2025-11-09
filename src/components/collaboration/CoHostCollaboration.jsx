import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MessageSquare, Users, FileText, Hand, Mic, MicOff,
  Crown, CheckCircle, Send, AlertCircle, Eye, Edit, Save
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

  const chatEndRef = useRef(null);

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

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader className="border-b border-slate-700 py-3 px-4">
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Co-Host Collaboration
          {isLive && <Badge className="bg-red-500 animate-pulse ml-2">LIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 w-full grid grid-cols-4">
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
                                {msg.sender[0]}
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
                              {coHost.name[0]}
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

        {/* Active Co-Hosts Status */}
        {coHosts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <Label className="text-white text-xs mb-2 block">ACTIVE CO-HOSTS</Label>
            <div className="flex flex-wrap gap-2">
              {coHosts.map((coHost) => (
                <Badge
                  key={coHost.id}
                  className={
                    currentSpeaker.id === coHost.id
                      ? 'bg-cyan-500'
                      : 'bg-slate-600'
                  }
                >
                  {currentSpeaker.id === coHost.id && <Crown className="w-3 h-3 mr-1" />}
                  {coHost.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}