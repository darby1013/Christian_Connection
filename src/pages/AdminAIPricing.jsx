import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles, TrendingUp, DollarSign, Target, Users, ShoppingBag,
  RefreshCw, AlertCircle, CheckCircle, ArrowUp, ArrowDown
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminAIPricing() {
  const [analyzing, setAnalyzing] = useState(false);
  const [pricingInsights, setPricingInsights] = useState(null);
  const [revenueForecasts, setRevenueForecasts] = useState(null);
  const [upsellOpportunities, setUpsellOpportunities] = useState([]);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 500),
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    initialData: [],
  });

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['allDigitalProducts'],
    queryFn: () => base44.entities.DigitalProduct.list('-created_date'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: [],
  });

  const analyzePricingMutation = useMutation({
    mutationFn: async () => {
      const subscriptionData = subscriptions.map(s => ({
        plan_type: s.plan_type,
        price: s.price,
        status: s.status,
        created_date: s.created_date
      }));

      const productData = digitalProducts.map(p => ({
        name: p.name,
        price: p.price,
        downloads: p.downloads_count,
        rating: p.rating,
        category: p.category
      }));

      const prompt = `Analyze this Christian platform's pricing data and provide strategic insights:

SUBSCRIPTION DATA:
${JSON.stringify(subscriptionData.slice(0, 50), null, 2)}

DIGITAL PRODUCT DATA:
${JSON.stringify(productData, null, 2)}

Total active subscribers: ${subscriptions.filter(s => s.status === 'active').length}
Total products: ${digitalProducts.length}
Average subscription price: $${(subscriptions.reduce((sum, s) => sum + s.price, 0) / subscriptions.length).toFixed(2)}

Provide:
1. Optimal pricing recommendations for each subscription tier
2. Digital product pricing optimization
3. Revenue opportunities we're missing
4. Competitor pricing insights for Christian platforms
5. Price elasticity analysis
6. Conversion rate optimization suggestions`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subscription_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tier: { type: "string" },
                  current_price: { type: "number" },
                  recommended_price: { type: "number" },
                  reasoning: { type: "string" },
                  expected_impact: { type: "string" }
                }
              }
            },
            product_pricing: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  avg_current: { type: "number" },
                  recommended_range: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            revenue_opportunities: { type: "array", items: { type: "string" } },
            market_insights: { type: "array", items: { type: "string" } },
            conversion_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setPricingInsights(data);
      setAnalyzing(false);
    }
  });

  const forecastRevenueMutation = useMutation({
    mutationFn: async () => {
      const monthlyRevenue = orders.reduce((acc, order) => {
        const month = new Date(order.created_date).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + order.total_amount;
        return acc;
      }, {});

      const monthlySubscriptions = subscriptions.filter(s => s.status === 'active').length * 
        (subscriptions.reduce((sum, s) => sum + s.price, 0) / subscriptions.length);

      const prompt = `Forecast revenue for the next 6 months based on this Christian platform's data:

MONTHLY REVENUE HISTORY:
${JSON.stringify(monthlyRevenue, null, 2)}

CURRENT METRICS:
- Active subscriptions: ${subscriptions.filter(s => s.status === 'active').length}
- Monthly recurring revenue: $${monthlySubscriptions.toFixed(2)}
- Average order value: $${(orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length).toFixed(2)}
- Total users: ${users.length}

Provide 6-month forecast with:
1. Expected revenue per month
2. Growth rate predictions
3. Key factors affecting forecast
4. Risk factors
5. Optimization opportunities`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            forecasts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_revenue: { type: "number" },
                  confidence: { type: "string" },
                  growth_rate: { type: "string" }
                }
              }
            },
            key_factors: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setRevenueForecasts(data);
      setAnalyzing(false);
    }
  });

  const analyzeUpsellsMutation = useMutation({
    mutationFn: async () => {
      const basicUsers = subscriptions.filter(s => s.plan_type === 'basic' && s.status === 'active');
      const premiumUsers = subscriptions.filter(s => s.plan_type === 'premium' && s.status === 'active');

      const prompt = `Identify personalized upsell opportunities for this Christian platform:

CURRENT BREAKDOWN:
- Basic tier users: ${basicUsers.length}
- Premium tier users: ${premiumUsers.length}
- VIP tier users: ${subscriptions.filter(s => s.plan_type === 'vip').length}

PRODUCT CATALOG:
${digitalProducts.length} digital products available

Recommend:
1. Which users to target for tier upgrades
2. Personalized product bundles
3. Limited-time offers
4. Cross-sell opportunities
5. Retention strategies for high-value users`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tier_upgrades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  target_segment: { type: "string" },
                  from_tier: { type: "string" },
                  to_tier: { type: "string" },
                  incentive: { type: "string" },
                  expected_conversion: { type: "string" },
                  messaging: { type: "string" }
                }
              }
            },
            product_bundles: { type: "array", items: { type: "string" } },
            limited_offers: { type: "array", items: { type: "string" } },
            retention_strategies: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setUpsellOpportunities(data.tier_upgrades || []);
      setAnalyzing(false);
    }
  });

  const runAnalysis = async (type) => {
    setAnalyzing(true);
    if (type === 'pricing') await analyzePricingMutation.mutateAsync();
    else if (type === 'forecast') await forecastRevenueMutation.mutateAsync();
    else if (type === 'upsell') await analyzeUpsellsMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">AI Pricing Intelligence</h2>
          <p className="text-slate-400 font-semibold">Optimize pricing, forecast revenue, and identify upsell opportunities</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Active Subscribers</p>
                <p className="text-3xl font-black text-white mt-1">
                  {subscriptions.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Users className="w-10 h-10 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Avg Order Value</p>
                <p className="text-3xl font-black text-white mt-1">
                  ${orders.length > 0 ? (orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length).toFixed(2) : '0'}
                </p>
              </div>
              <ShoppingBag className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Monthly MRR</p>
                <p className="text-3xl font-black text-white mt-1">
                  ${subscriptions.filter(s => s.status === 'active').length > 0 
                    ? (subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.price, 0)).toFixed(2) 
                    : '0'}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold">Digital Products</p>
                <p className="text-3xl font-black text-white mt-1">{digitalProducts.length}</p>
              </div>
              <Target className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="pricing" className="data-[state=active]:bg-cyan-500">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing Optimization
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-cyan-500">
            <TrendingUp className="w-4 h-4 mr-2" />
            Revenue Forecast
          </TabsTrigger>
          <TabsTrigger value="upsell" className="data-[state=active]:bg-cyan-500">
            <Target className="w-4 h-4 mr-2" />
            Upsell Opportunities
          </TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  AI Pricing Analysis
                </CardTitle>
                <Button
                  onClick={() => runAnalysis('pricing')}
                  disabled={analyzing}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!pricingInsights ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Click "Run Analysis" to get AI-powered pricing insights</p>
                  <p className="text-slate-500 text-sm">Analyzing {subscriptions.length} subscriptions and {digitalProducts.length} products</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">Subscription Tier Recommendations</h4>
                    <div className="grid gap-4">
                      {pricingInsights.subscription_recommendations?.map((rec, idx) => (
                        <Card key={idx} className="bg-slate-900/50 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="text-white font-bold capitalize">{rec.tier} Tier</h5>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-slate-400">Current: ${rec.current_price}</span>
                                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                                  <span className="text-cyan-400 font-bold">Recommended: ${rec.recommended_price}</span>
                                  {rec.recommended_price > rec.current_price ? (
                                    <Badge className="bg-green-500">
                                      <ArrowUp className="w-3 h-3 mr-1" />
                                      +{((rec.recommended_price - rec.current_price) / rec.current_price * 100).toFixed(0)}%
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-500">
                                      <ArrowDown className="w-3 h-3 mr-1" />
                                      {((rec.recommended_price - rec.current_price) / rec.current_price * 100).toFixed(0)}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-sm mb-2">{rec.reasoning}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm font-semibold">{rec.expected_impact}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">Revenue Opportunities</h4>
                    <div className="space-y-2">
                      {pricingInsights.revenue_opportunities?.map((opp, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                          <span className="text-slate-300 text-sm">{opp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">Conversion Optimization Tips</h4>
                    <div className="space-y-2">
                      {pricingInsights.conversion_tips?.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                          <Target className="w-5 h-5 text-purple-400 mt-0.5" />
                          <span className="text-slate-300 text-sm">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  6-Month Revenue Forecast
                </CardTitle>
                <Button
                  onClick={() => runAnalysis('forecast')}
                  disabled={analyzing}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Forecasting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Forecast
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!revenueForecasts ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Generate AI-powered revenue forecasts for the next 6 months</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueForecasts.forecasts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="predicted_revenue" stroke="#22d3ee" strokeWidth={3} name="Predicted Revenue" />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-bold mb-3">Key Growth Factors</h4>
                      <div className="space-y-2">
                        {revenueForecasts.key_factors?.map((factor, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                            <span className="text-slate-300 text-sm">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-bold mb-3">Risk Factors</h4>
                      <div className="space-y-2">
                        {revenueForecasts.risk_factors?.map((risk, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                            <span className="text-slate-300 text-sm">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upsell Tab */}
        <TabsContent value="upsell" className="space-y-6 mt-6">
          <Card className="bg-[#1a1f3a] border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-black flex items-center gap-2">
                  <Target className="w-6 h-6 text-orange-400" />
                  Personalized Upsell Opportunities
                </CardTitle>
                <Button
                  onClick={() => runAnalysis('upsell')}
                  disabled={analyzing}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Find Opportunities
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upsellOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Discover personalized upsell opportunities for your users</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upsellOpportunities.map((opp, idx) => (
                    <Card key={idx} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h5 className="text-white font-bold text-lg mb-1">{opp.target_segment}</h5>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500 capitalize">{opp.from_tier}</Badge>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <Badge className="bg-purple-500 capitalize">{opp.to_tier}</Badge>
                            </div>
                          </div>
                          <Badge className="bg-green-500">{opp.expected_conversion} conversion</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-400 text-sm font-semibold mb-1">Incentive:</p>
                            <p className="text-slate-300">{opp.incentive}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm font-semibold mb-1">Messaging:</p>
                            <p className="text-slate-300 italic">"{opp.messaging}"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);