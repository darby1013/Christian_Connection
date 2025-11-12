import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Minus, X, ShoppingCart, Gift, Sparkles,
  DollarSign, Percent, Check, Wand2, RefreshCw
} from "lucide-react";

export default function BundleBuilder({ category, availableProducts, user }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [bundleName, setBundleName] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  const queryClient = useQueryClient();

  const bundleDiscount = 10; // 10% discount on custom bundles

  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = totalPrice * (bundleDiscount / 100);
  const finalPrice = totalPrice - discountAmount;

  const addItem = (product) => {
    const existing = selectedItems.find(i => i.product_id === product.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.product_id === product.id ? {...i, quantity: i.quantity + 1} : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0]
      }]);
    }
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(i => i.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setSelectedItems(selectedItems.map(i =>
      i.product_id === productId ? {...i, quantity} : i
    ));
  };

  const generateAISuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const currentItems = selectedItems.map(i => i.product_name).join(', ');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Customer is building a custom bundle in category: "${category}"

Currently selected products: ${currentItems || 'None yet'}

Available products in this category:
${availableProducts.map(p => `- ${p.name} ($${p.price})`).join('\n')}

Suggest 3-5 products to complete their bundle:
1. Complementary items (go well together)
2. Popular combinations (frequently bought together)
3. Value additions (enhance the bundle)

For each suggestion, explain WHY it fits this bundle.
Consider faith-based usage, practical combinations, and value.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            },
            bundle_theme: { type: "string" }
          }
        }
      });

      const suggestions = result.suggestions.map(sug => {
        const product = availableProducts.find(p =>
          p.name.toLowerCase().includes(sug.product_name.toLowerCase())
        );
        return product ? { ...product, reason: sug.reason, priority: sug.priority } : null;
      }).filter(Boolean);

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const saveBundle = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('Please sign in to save bundle');
        return;
      }

      return base44.entities.CustomBundle.create({
        user_id: user.id,
        bundle_name: bundleName || `My ${category} Kit`,
        bundle_category: category,
        selected_products: selectedItems,
        total_price: totalPrice,
        bundle_discount_percentage: bundleDiscount,
        final_price: finalPrice,
        savings: discountAmount,
        is_saved: true,
        ai_suggested: aiSuggestions.length > 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customBundles'] });
      alert('✅ Bundle saved!');
    },
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('Please sign in');
        return;
      }

      // Create bundle as a custom order item
      const carts = await base44.entities.ShoppingCart.filter({ user_id: user.id, is_active: true });
      const cart = carts[0];

      const bundleCartItem = {
        product_id: 'custom-bundle-' + Date.now(),
        product_name: bundleName || `Custom ${category} Bundle`,
        price: finalPrice,
        quantity: 1,
        image_url: selectedItems[0]?.image,
        sku: 'CUSTOM-BUNDLE',
        is_in_stock: true
      };

      if (cart) {
        const newItems = [...cart.items, bundleCartItem];
        const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return base44.entities.ShoppingCart.update(cart.id, {
          items: newItems,
          subtotal,
          total: subtotal,
          last_updated: new Date().toISOString()
        });
      } else {
        return base44.entities.ShoppingCart.create({
          user_id: user.id,
          items: [bundleCartItem],
          subtotal: finalPrice,
          total: finalPrice,
          is_active: true,
          last_updated: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('✅ Bundle added to cart!');
    },
  });

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Available Products */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-purple-500/30">
          <CardHeader className="border-b border-purple-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-bold">Build Your {category} Kit</CardTitle>
              <Button
                onClick={generateAISuggestions}
                disabled={generatingSuggestions}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {generatingSuggestions ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                AI Suggest
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {availableProducts.map((product) => {
                const isSelected = selectedItems.find(i => i.product_id === product.id);
                const aiSuggested = aiSuggestions.find(s => s.id === product.id);

                return (
                  <Card key={product.id} className={`border-slate-700 ${
                    aiSuggested ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-900/30'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img src={product.images?.[0]} alt={product.name} className="w-20 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{product.name}</h4>
                          <p className="text-cyan-400 font-black mb-2">${product.price.toFixed(2)}</p>
                          {aiSuggested && (
                            <div className="mb-2">
                              <Badge className="bg-purple-500 mb-1">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Recommended
                              </Badge>
                              <p className="text-purple-300 text-xs">{aiSuggested.reason}</p>
                            </div>
                          )}
                          <Button
                            size="sm"
                            onClick={() => isSelected ? removeItem(product.id) : addItem(product)}
                            className={isSelected ? "bg-green-500 hover:bg-green-600 w-full" : "bg-cyan-500 hover:bg-cyan-600 w-full"}
                          >
                            {isSelected ? (
                              <><Check className="w-3 h-3 mr-1" />Added</>
                            ) : (
                              <><Plus className="w-3 h-3 mr-1" />Add to Bundle</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bundle Summary */}
      <div>
        <Card className="bg-[#1a1f3a] border-slate-700 sticky top-4">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Your Custom Bundle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Bundle Name</Label>
              <Input
                placeholder="My Faith Starter Kit"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded">
                  <img src={item.image} alt={item.product_name} className="w-10 h-10 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-white text-xs font-semibold line-clamp-1">{item.product_name}</p>
                    <p className="text-slate-400 text-xs">${item.price} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="bg-slate-700 hover:bg-slate-600 w-6 h-6"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="bg-slate-700 hover:bg-slate-600 w-6 h-6"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.product_id)}
                    className="text-red-400 hover:text-red-300 w-6 h-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {selectedItems.length === 0 && (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Add products to start building</p>
              </div>
            )}

            {selectedItems.length > 0 && (
              <>
                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white font-bold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Bundle Discount ({bundleDiscount}%)
                    </span>
                    <span className="text-green-400 font-bold">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-white font-black">Total</span>
                    <span className="text-cyan-400 font-black text-2xl">${finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-green-900/20 border border-green-500/30 rounded text-center">
                    <p className="text-green-300 text-xs font-bold">
                      You save ${discountAmount.toFixed(2)}!
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => addToCart.mutate()}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Bundle to Cart
                  </Button>
                  <Button
                    onClick={() => saveBundle.mutate()}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Save for Later
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}