import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Eye, Heart, Share2, Send, DollarSign, Users, MessageCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LiveStreamView() {
  const urlParams = new URLSearchParams(window.location.search);
  const streamId = urlParams.get('id');
  const [chatMessage, setChatMessage] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: stream, isLoading } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter({ id: streamId });
      return streams[0];
    },
    enabled: !!streamId,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['streamChat', streamId],
    queryFn: () => base44.entities.ChatMessage.filter({ room_id: streamId, room_type: 'livestream' }, '-created_date', 100),
    initialData: [],
    enabled: !!streamId,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  const sendChatMutation = useMutation({
    mutationFn: (messageData) => base44.entities.ChatMessage.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamChat', streamId] });
      setChatMessage("");
    },
  });

  const sendDonationMutation = useMutation({
    mutationFn: (donationData) => base44.entities.Donation.create(donationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream', streamId] });
      setDonationAmount("");
      alert('Thank you for your generous donation!');
    },
  });

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user) return;

    sendChatMutation.mutate({
      room_id: streamId,
      room_type: 'livestream',
      sender_id: user.id,
      sender_name: user.full_name,
      message: chatMessage
    });
  };

  const handleDonate = (e) => {
    e.preventDefault();
    if (!donationAmount || !user) return;

    sendDonationMutation.mutate({
      amount: parseFloat(donationAmount),
      donor_id: user.id,
      donor_name: user.full_name,
      donor_email: user.email,
      recipient_type: 'streamer',
      recipient_id: stream.id,
      message: `Donation for ${stream.title}`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Stream not found</h2>
          <p className="text-slate-600">The stream you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="relative aspect-video bg-black">
                {stream.status === 'live' && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      LIVE
                    </Badge>
                  </div>
                )}
                <img
                  src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200'}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white transition-all">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-blue-600 border-b-8 border-b-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{stream.title}</h1>
                    <p className="text-slate-600 mb-4">{stream.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <Heart className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {stream.host_name?.[0] || 'H'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{stream.host_name}</h3>
                    <p className="text-sm text-slate-500">{stream.category}</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Users className="w-4 h-4 mr-2" />
                    Follow
                  </Button>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">{stream.viewer_count || 0} watching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">${stream.total_donations || 0} raised</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat & Donate Sidebar */}
          <div className="space-y-4">
            <Card className="border-0 shadow-lg">
              <Tabs defaultValue="chat" className="w-full">
                <div className="border-b px-4 pt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="chat" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="donate" className="flex-1">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Donate
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chat" className="p-0">
                  <div className="h-96 overflow-y-auto p-4 space-y-3">
                    {chatMessages.slice().reverse().map((msg) => (
                      <div key={msg.id} className="flex items-start gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                            {msg.sender_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-sm text-slate-900">{msg.sender_name}</span>
                            <span className="text-xs text-slate-400">now</span>
                          </div>
                          <p className="text-sm text-slate-700">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSendChat} className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder={user ? "Type a message..." : "Sign in to chat"}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={!user}
                      />
                      <Button type="submit" disabled={!user || !chatMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="donate" className="p-6 space-y-4">
                  <div className="text-center mb-6">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Support {stream.host_name}</h3>
                    <p className="text-sm text-slate-600">Your donation helps keep this ministry going</p>
                  </div>

                  <form onSubmit={handleDonate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Donation Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Enter amount"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          className="pl-10"
                          disabled={!user}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 25, 50].map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          onClick={() => setDonationAmount(amount.toString())}
                          disabled={!user}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                      disabled={!user || !donationAmount}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                    </Button>

                    {!user && (
                      <p className="text-sm text-center text-slate-500">
                        Please sign in to donate
                      </p>
                    )}
                  </form>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-slate-500 text-center">
                      Total raised: <span className="font-bold text-green-600">${stream.total_donations || 0}</span>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}