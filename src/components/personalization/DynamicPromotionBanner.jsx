import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, Tag, Clock } from 'lucide-react';

export default function DynamicPromotionBanner({ userId, cartItems = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const [promotion, setPromotion] = useState(null);
  const queryClient = useQueryClient();

  const { data: activePromotions = [] } = useQuery({
    queryKey: ['dynamicPromotions', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.DynamicPromotion.filter({ user_id: userId, is_claimed: false });
    },
    enabled: !!userId,
    refetchInterval: 30000,
    initialData: []
  });

  const claimMutation = useMutation({
    mutationFn: (promoId) => base44.entities.DynamicPromotion.update(promoId, { is_claimed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dynamicPromotions']);
      alert('🎉 Discount code copied to clipboard!');
    }
  });

  useEffect(() => {
    if (!userId || activePromotions.length === 0) return;

    const cartValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const browsingTime = Date.now();

    const checkAndCreatePromotion = async () => {
      if (cartItems.length > 0 && cartValue > 50 && !activePromotions.some(p => p.trigger_behavior === 'cart_threshold')) {
        const discountCode = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const promo = await base44.entities.DynamicPromotion.create({
          user_id: userId,
          promotion_type: 'banner',
          message: `🎉 Special offer! Your cart qualifies for 15% OFF!`,
          discount_code: discountCode,
          discount_percentage: 15,
          trigger_behavior: 'cart_threshold',
          expires_at: expiresAt.toISOString(),
          shown_at: new Date().toISOString()
        });

        setPromotion(promo);
        queryClient.invalidateQueries(['dynamicPromotions']);
      }
    };

    checkAndCreatePromotion();
  }, [userId, cartItems, activePromotions]);

  useEffect(() => {
    if (activePromotions.length > 0 && !promotion) {
      setPromotion(activePromotions[0]);
    }
  }, [activePromotions]);

  if (!promotion || dismissed) return null;

  const handleClaim = () => {
    navigator.clipboard.writeText(promotion.discount_code);
    claimMutation.mutate(promotion.id);
    setDismissed(true);
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top">
      <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 border-0 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-white font-black text-lg">{promotion.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white font-mono font-bold">
                    {promotion.discount_code}
                  </Badge>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires in 24h
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleClaim} className="bg-white text-purple-600 hover:bg-white/90 font-bold">
                <Tag className="w-4 h-4 mr-2" />
                Claim Code
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setDismissed(true)} className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}