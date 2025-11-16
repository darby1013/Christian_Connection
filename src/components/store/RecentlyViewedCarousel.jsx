import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Eye, Star } from 'lucide-react';

export default function RecentlyViewedCarousel({ userId, currentProductId }) {
  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['recentlyViewed', userId],
    queryFn: async () => {
      if (!userId) return [];
      const items = await base44.entities.RecentlyViewed.filter({ user_id: userId });
      return items
        .filter(item => item.product_id !== currentProductId)
        .sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))
        .slice(0, 6);
    },
    enabled: !!userId,
    initialData: []
  });

  if (recentlyViewed.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Eye className="w-6 h-6 text-purple-400" />
        <h3 className="text-white font-black text-2xl">Recently Viewed</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recentlyViewed.map(item => (
          <Link key={item.id} to={createPageUrl('ProductDetail') + `?id=${item.product_id}`}>
            <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
              <CardContent className="p-3">
                <img src={item.product_image || '/placeholder.jpg'} alt={item.product_name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                <p className="text-white font-bold text-sm line-clamp-2 mb-1">{item.product_name}</p>
                <p className="text-cyan-400 font-bold">${item.product_price?.toFixed(2)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}