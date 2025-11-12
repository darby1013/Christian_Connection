import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ShoppingCart, Star, TrendingUp, RefreshCw,
  Brain, Target, Zap, Award, Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AIRecommendations({ user, loyalty, recentlyViewed = [], pastOrders = [] }) {
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'active' }),
    initialData: [],
  });

  const { data: existingRecs } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const recs = await base44.entities.PersonalizedRecommendation.filter(
        { user_id: user.id },
        '-generated_at',
        1
      );
      return recs[0] || null;
    },
    enabled: !!user,
  });

  const createRecommendationMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalizedRecommendation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const generateRecommendations = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      // Gather user data
      const viewedCategories = [...new Set(recentlyViewed.map(v => v.product_category))];
      const purchasedProducts = pastOrders.flatMap(o => o.items || []).map(i => i.product_name);
      const userSegment = determineSegment(loyalty, pastOrders);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate personalized product recommendations for this customer:

**Customer Profile:**
- Loyalty Tier: ${loyalty?.current_tier || 'bronze'}
- Total Points: ${loyalty?.total_points || 0}
- Total Purchases: ${pastOrders.length}
- Total Spent: $${loyalty?.total_spent || 0}
- Customer Segment: ${userSegment}

**Browsing History:**
Recently viewed categories: ${viewedCategories.join(', ') || 'None'}
Recently viewed products: ${recentlyViewed.slice(0, 5).map(v => v.product_name).join(', ') || 'None'}

**Purchase History:**
Previously purchased: ${purchasedProducts.slice(0, 10).join(', ') || 'None'}

**Available Products:**
${products.slice(0, 30).map(p => `- ${p.name} ($${p.price}) - ${p.category}`).join('\n')}

Generate 6-8 product recommendations with:
1. Product name (must match exactly from available products)
2. Confidence score (0-1)
3. Specific reason (personalized to this customer)
4. Recommendation type (complementary, upgrade, trending, etc.)

Prioritize:
- Products in categories they've browsed
- Complementary items to past purchases
- Higher-tier items for premium members
- Trending bestsellers
- Items on sale for bargain hunters

Be specific and personalized. Use actual product names from the list.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  confidence_score: { type: "number" },
                  reason: { type: "string" },
                  recommendation_type: { type: "string" }
                }
              }
            },
            overall_strategy: { type: "string" },
            user_segment: { type: "string" }
          }
        }
      });

      // Match product names to actual products
      const recommendedProducts = result.recommendations.map(rec => {
        const product = products.find(p => 
          p.name.toLowerCase() === rec.product_name.toLowerCase() ||
          p.name.toLowerCase().includes(rec.product_name.toLowerCase())
        );
        return product ? {
          product_id: product.id,
          product_name: product.name,
          confidence_score: rec.confidence_score,
          reason: rec.reason
        } : null;
      }).filter(Boolean).slice(0, 6);

      const recData = {
        user_id: user.id,
        recommendation_type: 'ai_generated',
        recommended_products: recommendedProducts,
        ai_reasoning: result.overall_strategy,
        user_segment: result.user_segment,
        loyalty_tier: loyalty?.current_tier,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      await createRecommendationMutation.mutateAsync(recData);
      setRecommendations(recommendedProducts);

    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (user && !existingRecs && products.length > 0 && !generating) {
      // Auto-generate on first visit
      generateRecommendations();
    } else if (existingRecs) {
      setRecommendations(existingRecs.recommended_products);
    }
  }, [user, products.length, existingRecs]);

  if (!recommendations || recommendations.length === 0) return null;

  const displayProducts = recommendations.map(rec => 
    products.find(p => p.id === rec.product_id)
  ).filter(Boolean);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Recommended For You</h2>
            <p className="text-slate-400 text-sm">
              {loyalty && <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 mr-2">
                <Award className="w-3 h-3 mr-1" />
                {loyalty.current_tier} member
              </Badge>}
              AI-powered personalized picks
            </p>
          </div>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={generating}
          className="bg-purple-500 hover:bg-purple-600"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayProducts.map((product, idx) => {
          const rec = recommendations[idx];
          return (
            <Link key={product.id} to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
              <Card className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500/50 transition-all group cursor-pointer">
                <div className="relative">
                  <div className="aspect-square overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                    )}
                  </div>
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-cyan-500">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {Math.round(rec.confidence_score * 100)}%
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{product.name}</h4>
                  <p className="text-purple-300 text-xs mb-2 line-clamp-2">{rec.reason}</p>
                  <p className="text-cyan-400 font-black">${product.price.toFixed(2)}</p>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-white text-xs">{product.rating}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function determineSegment(loyalty, orders) {
  if (!orders || orders.length === 0) return 'new_customer';
  if (loyalty?.current_tier === 'platinum' || loyalty?.current_tier === 'diamond') return 'premium_member';
  if (loyalty?.total_spent > 500) return 'high_value';
  if (orders.length >= 5) return 'loyal_customer';
  return 'regular_customer';
}