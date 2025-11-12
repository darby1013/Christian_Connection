import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ShoppingCart, Trash2, Share2, Star, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Wishlist() {
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const wishlists = await base44.entities.Wishlist.filter({ user_id: user.id });
      return wishlists[0] || null;
    },
    enabled: !!user,
  });

  const updateWishlistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Wishlist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeFromWishlist = (itemIndex) => {
    if (!wishlist) return;

    const newItems = wishlist.items.filter((_, idx) => idx !== itemIndex);

    updateWishlistMutation.mutate({
      id: wishlist.id,
      data: {
        items: newItems,
        item_count: newItems.length,
        total_value: newItems.reduce((sum, i) => sum + i.price, 0)
      }
    });
  };

  if (!wishlist || wishlist.items?.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 max-w-md">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Your Wishlist is Empty</h2>
            <p className="text-slate-400 mb-6">Save items you love for later</p>
            <Link to={createPageUrl("StoreAdvanced")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Wishlist</h1>
            <p className="text-slate-400">{wishlist.items.length} items • ${wishlist.total_value.toFixed(2)} total</p>
          </div>
          <Button className="bg-purple-500 hover:bg-purple-600">
            <Share2 className="w-4 h-4 mr-2" />
            Share Wishlist
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.items.map((item, idx) => (
            <Card key={idx} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50 transition-all group">
              <Link to={createPageUrl("ProductDetail") + `?id=${item.product_id}`}>
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-cyan-900" />
                  )}
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWishlist(idx);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Link>
              <CardContent className="p-4">
                <Link to={createPageUrl("ProductDetail") + `?id=${item.product_id}`}>
                  <h3 className="text-white font-bold mb-2 line-clamp-2 hover:text-cyan-400 transition-colors">
                    {item.product_name}
                  </h3>
                </Link>
                <p className="text-2xl font-black text-white mb-3">${item.price.toFixed(2)}</p>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 font-bold">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}