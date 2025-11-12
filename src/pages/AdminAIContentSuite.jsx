import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, FileText, Search, Mail, TrendingUp, Copy,
  RefreshCw, Check, Eye, Edit, Save, Wand2, Brain,
  Target, Zap, MessageSquare, Tag, Globe
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminAIContentSuite() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentType, setContentType] = useState("product_description");
  const [tone, setTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("faith_community");
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: aiContent = [] } = useQuery({
    queryKey: ['aiGeneratedContent'],
    queryFn: () => base44.entities.AIGeneratedContent.list('-created_date', 20),
    initialData: [],
  });

  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ['abandonedCarts'],
    queryFn: () => base44.entities.AbandonedCart.filter({ recovered: false }, '-abandoned_at', 10),
    initialData: [],
  });

  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.AIGeneratedContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiGeneratedContent'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('✅ Content applied to product!');
    },
  });

  const generateProductContent = async () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    setGeneratingContent(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate comprehensive, high-converting content for this product:

Product Name: ${selectedProduct.name}
Current Description: ${selectedProduct.description || 'No description'}
Category: ${selectedProduct.category}
Price: $${selectedProduct.price}
Brand: ${selectedProduct.brand || 'Glory Wave'}

Target Audience: ${targetAudience}
Tone: ${tone}

Generate the following:

1. **SHORT DESCRIPTION** (2-3 sentences, 100-150 chars)
   - Hook that captures attention
   - Key benefit statement
   - Use for product listings

2. **LONG DESCRIPTION** (3-4 paragraphs, 300-500 words)
   - Compelling narrative
   - Detailed features and benefits
   - Emotional connection
   - Use case scenarios
   - Faith-based inspiration where appropriate
   - Call to action

3. **MARKETING HEADLINE** (5-10 words)
   - Punchy, benefit-driven
   - For ads and promotions

4. **MARKETING BODY** (2-3 sentences)
   - Compelling promotional copy
   - Urgency and value proposition

5. **SEO OPTIMIZATION**
   - SEO Title (60 chars max, keyword-rich)
   - Meta Description (150-160 chars, engaging)
   - 10-15 high-value keywords

6. **SOCIAL MEDIA POSTS** (3 variations)
   - Facebook post (conversational)
   - Instagram caption (visual, emoji-rich)
   - Twitter/X post (concise, impactful)

Make it persuasive, authentic, and optimized for conversions.`,
        response_json_schema: {
          type: "object",
          properties: {
            short_description: { type: "string" },
            long_description: { type: "string" },
            marketing_headline: { type: "string" },
            marketing_body: { type: "string" },
            seo_title: { type: "string" },
            seo_description: { type: "string" },
            seo_keywords: { type: "array", items: { type: "string" } },
            social_media_posts: {
              type: "object",
              properties: {
                facebook: { type: "string" },
                instagram: { type: "string" },
                twitter: { type: "string" }
              }
            },
            quality_score: { type: "number" }
          }
        }
      });

      setGeneratedContent(result);

      // Save to database
      await createContentMutation.mutateAsync({
        content_type: 'product_description',
        entity_id: selectedProduct.id,
        entity_name: selectedProduct.name,
        generated_content: result,
        tone,
        target_audience: targetAudience,
        quality_score: result.quality_score || 85,
        is_approved: false,
        is_published: false
      });

      alert('✅ AI Content Generated!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  const generateEmailSubjects = async (cart) => {
    setGeneratingContent(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 high-converting abandoned cart email subject lines:

Customer: ${cart.user_name || 'Valued Customer'}
Cart Value: $${cart.cart_value}
Items: ${cart.items_count}
Time Abandoned: ${Math.floor((new Date() - new Date(cart.abandoned_at)) / 3600000)} hours ago

Create subject lines that:
1. Create urgency without being pushy
2. Personalize when possible
3. Highlight value/savings
4. Use emojis strategically
5. A/B test-ready variations

Include:
- Urgency-focused (2 variations)
- Value-focused (2 variations)  
- Curiosity-focused (1 variation)

Each should be 40-60 characters for mobile optimization.`,
        response_json_schema: {
          type: "object",
          properties: {
            email_subject_lines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  type: { type: "string" },
                  predicted_open_rate: { type: "number" }
                }
              }
            },
            recommended_send_time: { type: "string" },
            personalization_tokens: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedContent({ emailSubjects: result });
      alert('✅ Email subject lines generated!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  const applyToProduct = async (field, value) => {
    if (!selectedProduct) return;

    const updateData = {};
    
    switch(field) {
      case 'short_description':
        updateData.short_description = value;
        break;
      case 'long_description':
        updateData.description = value;
        break;
      case 'seo':
        updateData.seo_title = generatedContent.seo_title;
        updateData.seo_description = generatedContent.seo_description;
        updateData.seo_keywords = generatedContent.seo_keywords;
        break;
    }

    await updateProductMutation.mutateAsync({
      id: selectedProduct.id,
      data: updateData
    });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">AI Content Generation Suite</h2>
          <p className="text-slate-400 font-semibold">Generate high-converting copy with AI</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2">
          <Brain className="w-4 h-4 mr-2" />
          Powered by Advanced AI
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{aiContent.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{aiContent.length}</p>
            <p className="text-slate-400 text-sm font-semibold">AI Contents Generated</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {aiContent.filter(c => c.is_published).length}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Published</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">
              {aiContent.length > 0 ? (aiContent.reduce((sum, c) => sum + (c.quality_score || 0), 0) / aiContent.length).toFixed(0) : 0}
            </p>
            <p className="text-slate-400 text-sm font-semibold">Avg Quality Score</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mb-1">{abandonedCarts.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Carts Awaiting Recovery</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="products" className="data-[state=active]:bg-cyan-500">
            <FileText className="w-4 h-4 mr-2" />
            Product Content
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-cyan-500">
            <Mail className="w-4 h-4 mr-2" />
            Email Recovery
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500">
            <Globe className="w-4 h-4 mr-2" />
            Generated Content
          </TabsTrigger>
        </TabsList>

        {/* Product Content Generator */}
        <TabsContent value="products" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Generate Content</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Select Product *</Label>
                  <Select onValueChange={(id) => setSelectedProduct(products.find(p => p.id === id))}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id} className="text-white">
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-300 font-bold">{selectedProduct.name}</p>
                    <p className="text-cyan-200 text-sm">${selectedProduct.price} • {selectedProduct.category}</p>
                  </div>
                )}

                <div>
                  <Label className="text-white font-bold mb-2 block">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="professional" className="text-white">Professional</SelectItem>
                      <SelectItem value="casual" className="text-white">Casual & Friendly</SelectItem>
                      <SelectItem value="inspirational" className="text-white">Inspirational</SelectItem>
                      <SelectItem value="urgent" className="text-white">Urgent & Compelling</SelectItem>
                      <SelectItem value="friendly" className="text-white">Warm & Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Target Audience</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="faith_community" className="text-white">Faith Community</SelectItem>
                      <SelectItem value="young_adults" className="text-white">Young Adults</SelectItem>
                      <SelectItem value="families" className="text-white">Families</SelectItem>
                      <SelectItem value="ministry_leaders" className="text-white">Ministry Leaders</SelectItem>
                      <SelectItem value="general" className="text-white">General Audience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateProductContent}
                  disabled={!selectedProduct || generatingContent}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold h-12"
                >
                  {generatingContent ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating AI Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Complete Content Suite
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content Display */}
            {generatedContent && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardHeader className="border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white font-bold">Generated Content</CardTitle>
                    <Badge className="bg-green-500">
                      Quality: {generatedContent.quality_score || 85}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Short Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white font-bold">Short Description</Label>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.short_description, 'short')}
                          className="bg-cyan-500 hover:bg-cyan-600 h-7"
                        >
                          {copiedField === 'short' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => applyToProduct('short_description', generatedContent.short_description)}
                          className="bg-green-500 hover:bg-green-600 h-7"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={generatedContent.short_description}
                      readOnly
                      className="bg-slate-900 border-slate-700 text-white h-20"
                    />
                  </div>

                  {/* Long Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white font-bold">Long Description</Label>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.long_description, 'long')}
                          className="bg-cyan-500 hover:bg-cyan-600 h-7"
                        >
                          {copiedField === 'long' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => applyToProduct('long_description', generatedContent.long_description)}
                          className="bg-green-500 hover:bg-green-600 h-7"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={generatedContent.long_description}
                      readOnly
                      className="bg-slate-900 border-slate-700 text-white h-40"
                    />
                  </div>

                  {/* Marketing Copy */}
                  <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <Label className="text-purple-300 font-bold mb-2 block">Marketing Copy</Label>
                    <h4 className="text-white font-black text-lg mb-2">{generatedContent.marketing_headline}</h4>
                    <p className="text-purple-200 text-sm">{generatedContent.marketing_body}</p>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(`${generatedContent.marketing_headline}\n\n${generatedContent.marketing_body}`, 'marketing')}
                      className="mt-2 bg-purple-500 hover:bg-purple-600"
                    >
                      {copiedField === 'marketing' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      Copy Marketing Copy
                    </Button>
                  </div>

                  {/* SEO */}
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-green-300 font-bold">SEO Optimization</Label>
                      <Button
                        size="sm"
                        onClick={() => applyToProduct('seo')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Apply All SEO
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-green-400 text-xs mb-1">SEO Title:</p>
                        <p className="text-green-200 text-sm">{generatedContent.seo_title}</p>
                      </div>
                      <div>
                        <p className="text-green-400 text-xs mb-1">Meta Description:</p>
                        <p className="text-green-200 text-sm">{generatedContent.seo_description}</p>
                      </div>
                      <div>
                        <p className="text-green-400 text-xs mb-1">Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {generatedContent.seo_keywords?.map((kw, idx) => (
                            <Badge key={idx} className="bg-green-500 text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <Label className="text-blue-300 font-bold mb-3 block">Social Media Posts</Label>
                    <div className="space-y-3">
                      {generatedContent.social_media_posts && Object.entries(generatedContent.social_media_posts).map(([platform, post]) => (
                        <div key={platform} className="p-3 bg-slate-900/50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-blue-300 font-semibold capitalize">{platform}</p>
                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(post, platform)}
                              className="bg-blue-500 hover:bg-blue-600 h-6"
                            >
                              {copiedField === platform ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                          <p className="text-blue-100 text-sm">{post}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Email Subject Line Generator */}
        <TabsContent value="emails" className="mt-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-bold">Abandoned Cart Email Recovery</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-3">
                {abandonedCarts.map((cart) => (
                  <Card key={cart.id} className="bg-slate-900/50 border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-bold">{cart.user_name || cart.user_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-amber-500">${cart.cart_value.toFixed(2)}</Badge>
                            <Badge className="bg-purple-500">{cart.items_count} items</Badge>
                            <Badge className="bg-slate-600">
                              {Math.floor((new Date() - new Date(cart.abandoned_at)) / 3600000)}h ago
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => generateEmailSubjects(cart)}
                          disabled={generatingContent}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {generatingContent ? (
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3 mr-1" />
                          )}
                          Generate Subjects
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {generatedContent?.emailSubjects && (
                <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 mt-6">
                  <CardHeader className="border-b border-purple-500/30">
                    <CardTitle className="text-white font-bold">AI-Generated Subject Lines</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {generatedContent.emailSubjects.email_subject_lines?.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-purple-500">{item.type}</Badge>
                              <Badge className="bg-green-500">
                                {(item.predicted_open_rate * 100).toFixed(0)}% open rate
                              </Badge>
                            </div>
                            <p className="text-white font-bold text-lg">{item.subject}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(item.subject, `email-${idx}`)}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            {copiedField === `email-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Recommended send time: {generatedContent.emailSubjects.recommended_send_time}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content History */}
        <TabsContent value="history" className="mt-6">
          <div className="grid gap-3">
            {aiContent.map((content) => (
              <Card key={content.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${
                      content.is_published ? 'bg-green-500/20 border-2 border-green-500/30' : 'bg-slate-800'
                    } flex items-center justify-center`}>
                      {content.is_published ? (
                        <Check className="w-6 h-6 text-green-400" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{content.entity_name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-purple-500">{content.content_type.replace('_', ' ')}</Badge>
                        <Badge className="bg-cyan-500">Quality: {content.quality_score}/100</Badge>
                        {content.is_published && <Badge className="bg-green-500">Published</Badge>}
                        {content.is_approved && <Badge className="bg-blue-500">Approved</Badge>}
                      </div>
                      <p className="text-slate-400 text-sm mt-2">
                        Generated: {new Date(content.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}