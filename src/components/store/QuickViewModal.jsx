
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Heart, Eye, Star, Plus, Minus, X, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickViewModal({ product, isOpen, onClose, user, cart }) {
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('Please sign in first');
        return;
      }

      const cartItem = {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity,
        image_url: product.images?.[0],
        sku: product.sku,
        is_in_stock: product.stock_quantity > 0
      };

      if (cart) {
        const existingItemIndex = cart.items.findIndex(i => i.product_id === product.id);
        let newItems;

        if (existingItemIndex >= 0) {
          newItems = [...cart.items];
          newItems[existingItemIndex].quantity += quantity;
        } else {
          newItems = [...cart.items, cartItem];
        }

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
          items: [cartItem],
          subtotal: product.price * quantity,
          total: product.price * quantity,
          is_active: true,
          last_updated: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('✅ Added to cart!');
      onClose();
    },
  });

  const trackQuickView = async () => {
    try {
      await base44.entities.QuickViewStats.filter({ product_id: product.id }).then(async (stats) => {
        if (stats.length > 0) {
          await base44.entities.QuickViewStats.update(stats[0].id, {
            total_quick_views: stats[0].total_quick_views + 1,
            last_quick_viewed: new Date().toISOString()
          });
        } else {
          await base44.entities.QuickViewStats.create({
            product_id: product.id,
            product_name: product.name,
            total_quick_views: 1,
            last_quick_viewed: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.log('Error tracking quick view');
    }
  };

  React.useEffect(() => {
    if (isOpen && product) {
      trackQuickView();
    }
  }, [isOpen, product]);

  if (!product) return null;

  const discount = product.compare_at_price && product.price < product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white font-black flex items-center gap-2">
            <Eye className="w-6 h-6 text-cyan-400" />
            Quick View
          </DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 py-4">
          {/* Product Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900 flex items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-white opacity-30" />
              </div>
            )}
            {discount > 0 && (
              <Badge className="absolute top-4 right-4 bg-red-500 text-xl font-black px-4 py-2">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            {product.brand && (
              <p className="text-cyan-400 font-semibold">{product.brand}</p>
            )}
            <h2 className="text-3xl font-black text-white">{product.name}</h2>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-400 text-sm">({product.review_count || 0} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div>
              {discount > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-white">${product.price.toFixed(2)}</span>
                  <span className="text-xl text-slate-500 line-through">${product.compare_at_price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-4xl font-black text-white">${product.price.toFixed(2)}</span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-slate-300 text-sm">{product.short_description || product.description?.substring(0, 150)}</p>

            {/* Stock Status */}
            {product.stock_quantity <= 0 ? (
              <Badge className="bg-red-500 text-lg px-4 py-2">Out of Stock</Badge>
            ) : product.stock_quantity <= product.low_stock_threshold ? (
              <Badge className="bg-amber-500 text-lg px-4 py-2">
                Only {product.stock_quantity} left!
              </Badge>
            ) : (
              <Badge className="bg-green-500 px-4 py-2">In Stock</Badge>
            )}

            {/* Quantity Selector */}
            <div>
              {/* NOTE: Label component is missing from imports. Add it if needed, or remove. */}
              {/* <Label className="text-white font-bold mb-2 block">Quantity</Label> */}
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-slate-900 border-slate-700 text-white font-bold"
                />
                <Button
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-slate-700 hover:bg-slate-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={product.stock_quantity === 0 || !user}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold h-12"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="icon"
                className="bg-slate-700 hover:bg-slate-600 w-12 h-12"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} onClick={onClose}>
              <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                View Full Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
