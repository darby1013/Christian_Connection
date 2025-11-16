import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, Sparkles, User, Bot } from 'lucide-react';

export default function AIChatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m your AI shopping assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => user ? base44.entities.Order.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: []
  });

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const context = `
You are a helpful customer service AI assistant for Glory Wave store.
Available products: ${products.slice(0, 10).map(p => `${p.name} ($${p.price})`).join(', ')}
User has ${orders.length} orders.

Answer customer questions about:
- Product recommendations
- Order status and tracking
- Store policies (free shipping over $50, 30-day returns)
- Product availability
- General support

Be friendly, concise, and helpful. If asked about specific order details, ask for order number.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}\n\nUser: ${userMessage}\nAssistant:`,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    chatMutation.mutate(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-110 z-50 flex items-center justify-center group"
      >
        <MessageCircle className="w-8 h-8 text-white" />
        <Badge className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 flex items-center justify-center p-0 animate-pulse">
          <Sparkles className="w-3 h-3" />
        </Badge>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 bg-[#1a1f3a] border-cyan-500 shadow-2xl z-50 w-80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">AI Assistant</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-400 text-xs">Online</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => setIsMinimized(false)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 bg-[#1a1f3a] border-cyan-500 shadow-2xl z-50 w-96 h-[600px] flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-cyan-600 to-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold">AI Shopping Assistant</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-100 text-xs">Online & Ready</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => setIsMinimized(true)} className="text-white hover:bg-white/20">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl p-3 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-100'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800 rounded-2xl p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/30">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="border-slate-600 text-xs" onClick={() => {
              setInput('Track my order');
              handleSend();
            }}>
              Track Order
            </Button>
            <Button size="sm" variant="outline" className="border-slate-600 text-xs" onClick={() => {
              setInput('Recommend products for me');
              handleSend();
            }}>
              Get Recommendations
            </Button>
            <Button size="sm" variant="outline" className="border-slate-600 text-xs" onClick={() => {
              setInput('What are your shipping options?');
              handleSend();
            }}>
              Shipping Info
            </Button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 bg-[#1a1f3a]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900 border-slate-700 text-white"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-gradient-to-r from-cyan-600 to-blue-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}