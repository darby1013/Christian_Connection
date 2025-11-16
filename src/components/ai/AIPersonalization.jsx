import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, TrendingUp } from 'lucide-react';

export default function AIPersonalization({ userId, children }) {
  const queryClient = useQueryClient();

  const { data: personalization } = useQuery({
    queryKey: ['personalization', userId],
    queryFn: async () => {
      if (!userId) return null;
      const existing = await base44.entities.UserPersonalization.filter({ user_id: userId });
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      const newProfile = await base44.entities.UserPersonalization.create({
        user_id: userId,
        browsing_history: [],
        purchase_history: [],
        preferences: {},
        segment: 'new',
        lifetime_value: 0,
        favorite_categories: [],
        favorite_brands: [],
        personalized_discount: 0
      });
      
      return newProfile;
    },
    enabled: !!userId,
    staleTime: 60000
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', userId],
    queryFn: () => userId ? base44.entities.Order.filter({ user_id: userId }) : [],
    enabled: !!userId,
    initialData: []
  });

  const updatePersonalizationMutation = useMutation({
    mutationFn: (data) => base44.entities.UserPersonalization.update(personalization?.id, data),
    onSuccess: () => queryClient.invalidateQueries(['personalization'])
  });

  useEffect(() => {
    if (!userId || !personalization) return;

    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const purchaseCount = orders.length;

    let segment = 'new';
    let discount = 0;

    if (totalSpent > 500 || purchaseCount > 5) {
      segment = 'vip';
      discount = 15;
    } else if (totalSpent > 200 || purchaseCount > 2) {
      segment = 'frequent';
      discount = 10;
    } else if (purchaseCount > 0) {
      segment = 'occasional';
      discount = 5;
    }

    if (personalization.segment !== segment || personalization.lifetime_value !== totalSpent) {
      updatePersonalizationMutation.mutate({
        segment,
        lifetime_value: totalSpent,
        personalized_discount: discount
      });
    }
  }, [orders, userId, personalization]);

  if (!userId || !personalization) {
    return <>{children}</>;
  }

  const segmentColors = {
    vip: 'from-yellow-500 to-amber-600',
    frequent: 'from-purple-500 to-pink-600',
    occasional: 'from-blue-500 to-cyan-600',
    new: 'from-green-500 to-emerald-600'
  };

  const segmentIcons = {
    vip: Star,
    frequent: TrendingUp,
    occasional: Sparkles,
    new: Sparkles
  };

  const SegmentIcon = segmentIcons[personalization.segment];

  return (
    <>
      {personalization.personalized_discount > 0 && (
        <div className="fixed top-20 right-6 z-40 animate-in slide-in-from-right">
          <Badge className={`bg-gradient-to-r ${segmentColors[personalization.segment]} text-white px-4 py-2 shadow-xl`}>
            <SegmentIcon className="w-4 h-4 mr-2" />
            Your {personalization.segment.toUpperCase()} Discount: {personalization.personalized_discount}% OFF
          </Badge>
        </div>
      )}
      {children}
    </>
  );
}