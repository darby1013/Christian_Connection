import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, Star, ShoppingCart, TrendingUp } from 'lucide-react';

export default function SmartProductRecommendations({ userId, currentProductId }) {
  const { data: personalization } = useQuery({
    queryKey: ['personalization', userId],
    queryFn: async () => {
      if (!userId) return null;
      const existing = await base44.entities.UserPersonalization.filter({ user_id: userId });
      return existing[0] || null;
    },
    enabled: !!userId
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ['recentlyViewed', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await base44.entities.RecentlyViewed.filter({ user_id: userId });
    },
    enabled: !!userId,
    initialData: []
  });

  const parseImages = (images) => {
    if (Array.isArray(images)) return images;
    if (!images) return [];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [images];
      } catch {
        return [images];
      }
    }
    return [];
  };

  const getRecommendations = () => {
    let recommendations = [];

    if (personalization?.favorite_categories?.length > 0) {
      const categoryMatches = products.filter(p => 
        personalization.favorite_categories.includes(p.category) && 
        p.id !== currentProductId &&
        p.status === 'active'
      );
      recommendations.push(...categoryMatches);
    }

    if (personalization?.favorite_brands?.length > 0) {
      const brandMatches = products.filter(p => 
        personalization.favorite_brands.includes(p.brand) && 
        p.id !== currentProductId &&
        p.status === 'active'
      );
      recommendations.push(...brandMatches);
    }

    if (recentlyViewed.length > 0) {
      const viewedProductIds = recentlyViewed.map(rv => rv.product_id);
      const similarProducts = products.filter(p => 
        !viewedProductIds.includes(p.id) && 
        p.id !== currentProductId &&
        p.status === 'active'
      );
      recommendations.push(...similarProducts);
    }

    if (recommendations.length === 0) {
      recommendations = products.filter(p => 
        p.status === 'active' && 
        p.is_featured && 
        p.id !== currentProductId
      );
    }

    const unique = Array.from(new Map(recommendations.map(p => [p.id, p])).values());
    return unique.slice(0, 6);
  };

  const recommended = getRecommendations();

  if (recommended.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h3 className="text-white font-black text-2xl">Recommended Just For You</h3>
        {personalization && (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
            AI Powered
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommended.map(product => {
          const images = parseImages(product.images);
          const hasDiscount = product.compare_at_price > product.price;
          
          return (
            <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all group">
              <CardContent className="p-0">
                <div className="relative">
                  {hasDiscount && (
                    <Badge className="absolute top-2 right-2 bg-red-500 z-10 text-xs">
                      {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                    </Badge>
                  )}
                  {personalization?.personalized_discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-purple-500 z-10 text-xs">
                      +{personalization.personalized_discount}% OFF
                    </Badge>
                  )}
                  <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                    <img 
                      src={images[0] || '/placeholder.jpg'} 
                      alt={product.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>
                </div>
                <div className="p-3">
                  <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                    <h4 className="text-white font-bold text-sm line-clamp-2 mb-2 hover:text-cyan-400 transition-colors">
                      {product.name}
                    </h4>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < (product.rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-400 font-black">
                        ${(product.price * (1 - (personalization?.personalized_discount || 0) / 100)).toFixed(2)}
                      </p>
                      {(hasDiscount || personalization?.personalized_discount > 0) && (
                        <p className="text-slate-500 line-through text-xs">${product.price?.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}