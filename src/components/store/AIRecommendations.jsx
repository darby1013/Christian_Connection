import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIRecommendations({ userId, currentProductId, type = 'personalized' }) {
  const { data: recommendations = [] } = useQuery({
    queryKey: ['aiRecommendations', userId, currentProductId, type],
    queryFn: async () => {
      const products = await base44.entities.Product.list();
      const filtered = products.filter(p => p.id !== currentProductId && p.status === 'active');
      return filtered.slice(0, 4);
    },
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

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-black text-white">
          {type === 'personalized' ? 'Recommended For You' : 'You May Also Like'}
        </h2>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">AI Powered</Badge>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map(product => {
          const images = parseImages(product.images);
          
          return (
            <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all group">
              <CardContent className="p-0">
                <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                  <div className="relative overflow-hidden">
                    <img 
                      src={images[0] || '/placeholder.jpg'} 
                      alt={product.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.is_on_sale && (
                      <Badge className="absolute top-3 left-3 bg-red-500">SALE</Badge>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                    <h3 className="text-white font-bold mb-2 hover:text-cyan-400 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ))}
                    <span className="text-slate-400 text-xs ml-1">(4.8)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-cyan-400 font-black text-xl">${product.price?.toFixed(2)}</p>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
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