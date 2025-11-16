import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Download, FileText, Video, Music, Book, Image, Code, Star, ShoppingCart } from 'lucide-react';

export default function DigitalStore() {
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    fetchUser();
  }, []);

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['digitalProducts'],
    queryFn: () => base44.entities.DigitalProductEnhanced.list('-created_date'),
    initialData: []
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CartItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const purchaseDigitalMutation = useMutation({
    mutationFn: async (product) => {
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      const order = await base44.entities.Order.create({
        user_id: user.id,
        total: product.price,
        status: 'completed',
        items: [{ product_id: product.id, product_name: product.name, price: product.price }]
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + product.access_duration_days);

      const download = await base44.entities.DigitalDownload.create({
        user_id: user.id,
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        order_id: order.id,
        download_url: product.file_url,
        max_downloads: product.download_limit,
        expires_at: expiresAt.toISOString()
      });

      if (product.email_delivery) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Your ${product.name} is ready to download`,
          body: `Thank you for your purchase!

Your digital product "${product.name}" is ready.

Download Link: ${window.location.origin}${createPageUrl('MyDigitalLibrary')}

This link expires on ${expiresAt.toLocaleDateString()}.
Maximum downloads: ${product.download_limit}

Thank you for your purchase!`
        });
      }

      if (product.instant_download) {
        window.open(product.file_url, '_blank');
      }

      return download;
    },
    onSuccess: () => {
      alert('✅ Purchase complete! Check your email and downloads.');
    }
  });

  const typeIcons = {
    ebook: Book,
    pdf: FileText,
    video: Video,
    audio: Music,
    course: Book,
    image: Image,
    template: FileText,
    software: Code,
    podcast: Music
  };

  const filteredProducts = selectedType === 'all' 
    ? digitalProducts 
    : digitalProducts.filter(p => p.product_type === selectedType);

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Download className="w-10 h-10 text-purple-400" />
            Digital Store
          </h1>
          <p className="text-slate-400 font-semibold">Instant downloads • Lifetime access</p>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap">
          <Button 
            onClick={() => setSelectedType('all')}
            variant={selectedType === 'all' ? 'default' : 'outline'}
            className={selectedType === 'all' ? 'bg-purple-600' : 'border-slate-600'}
          >
            All Products
          </Button>
          <Button 
            onClick={() => setSelectedType('ebook')}
            variant={selectedType === 'ebook' ? 'default' : 'outline'}
            className={selectedType === 'ebook' ? 'bg-purple-600' : 'border-slate-600'}
          >
            <Book className="w-4 h-4 mr-2" />
            eBooks
          </Button>
          <Button 
            onClick={() => setSelectedType('pdf')}
            variant={selectedType === 'pdf' ? 'default' : 'outline'}
            className={selectedType === 'pdf' ? 'bg-purple-600' : 'border-slate-600'}
          >
            <FileText className="w-4 h-4 mr-2" />
            PDFs
          </Button>
          <Button 
            onClick={() => setSelectedType('video')}
            variant={selectedType === 'video' ? 'default' : 'outline'}
            className={selectedType === 'video' ? 'bg-purple-600' : 'border-slate-600'}
          >
            <Video className="w-4 h-4 mr-2" />
            Videos
          </Button>
          <Button 
            onClick={() => setSelectedType('audio')}
            variant={selectedType === 'audio' ? 'default' : 'outline'}
            className={selectedType === 'audio' ? 'bg-purple-600' : 'border-slate-600'}
          >
            <Music className="w-4 h-4 mr-2" />
            Audio
          </Button>
          <Button 
            onClick={() => setSelectedType('course')}
            variant={selectedType === 'course' ? 'default' : 'outline'}
            className={selectedType === 'course' ? 'bg-purple-600' : 'border-slate-600'}
          >
            Courses
          </Button>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const Icon = typeIcons[product.product_type] || Download;
            
            return (
              <Card key={product.id} className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all group">
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                      {product.thumbnail_url ? (
                        <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-20 h-20 text-purple-300" />
                      )}
                    </div>
                    <Badge className="absolute top-3 left-3 bg-purple-600">
                      {product.product_type.toUpperCase()}
                    </Badge>
                    {product.instant_download && (
                      <Badge className="absolute top-3 right-3 bg-green-500">
                        Instant
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                    {product.file_size && (
                      <p className="text-slate-500 text-xs mb-2">Size: {product.file_size}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (product.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                        ))}
                      </div>
                      <span className="text-slate-400 text-xs">({product.rating || 5.0})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-purple-400 font-black text-2xl">${product.price?.toFixed(2)}</p>
                      <Button
                        onClick={() => purchaseDigitalMutation.mutate(product)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 font-bold"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}