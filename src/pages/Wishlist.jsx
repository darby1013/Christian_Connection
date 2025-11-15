import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => base44.entities.WishlistItem.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: []
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (id) => base44.entities.WishlistItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: (data) => base44.entities.CartItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('✅ Added to cart!');
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Heart className="w-10 h-10 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-slate-400 font-semibold">{wishlistItems.length} items saved</p>
          </div>
          <Link to={createPageUrl('Store')}>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <Heart className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-2xl mb-2">Your wishlist is empty</p>
              <p className="text-slate-400 mb-6">Start adding products you love!</p>
              <Link to={createPageUrl('Store')}>
                <Button className="bg-cyan-500">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map(item => (
              <Card key={item.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group">
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={item.product_image || '/placeholder.jpg'} 
                      alt={item.product_name}
                      className="w-full aspect-square object-cover"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFromWishlistMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2">{item.product_name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-cyan-400 font-black text-2xl mb-4">${item.product_price?.toFixed(2)}</p>
                    <Button
                      onClick={() => {
                        addToCartMutation.mutate({
                          user_id: user.id,
                          product_id: item.product_id,
                          quantity: 1,
                          price: item.product_price
                        });
                      }}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}