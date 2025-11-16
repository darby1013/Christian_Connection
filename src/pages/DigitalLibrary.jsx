import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Music, Image as ImageIcon, Video, Book } from 'lucide-react';

export default function DigitalLibrary() {
  const [user, setUser] = useState(null);

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

  const { data: purchases = [] } = useQuery({
    queryKey: ['myDigitalPurchases', user?.id],
    queryFn: () => base44.entities.DigitalPurchase.filter({ user_id: user?.id, payment_status: 'completed' }),
    enabled: !!user,
    initialData: []
  });

  const handleDownload = (purchase) => {
    if (purchase.download_count >= purchase.max_downloads) {
      alert('⚠️ Download limit reached for this item');
      return;
    }
    
    window.open(purchase.download_url, '_blank');
    
    base44.entities.DigitalPurchase.update(purchase.id, {
      download_count: (purchase.download_count || 0) + 1
    });
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'ebook': return Book;
      case 'music': case 'podcast': return Music;
      case 'artwork': case 'flyer': return ImageIcon;
      case 'transcript': return FileText;
      case 'course': return Video;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">My Digital Library</h1>

        {purchases.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <FileText className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">No digital products yet</p>
              <p className="text-slate-400">Your purchased digital items will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map(purchase => {
              const Icon = getCategoryIcon(purchase.category);
              const downloadsLeft = purchase.max_downloads - (purchase.download_count || 0);
              
              return (
                <Card key={purchase.id} className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold">{purchase.product_name}</h3>
                        <Badge className="bg-purple-500">{purchase.category}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4">
                      Purchased: {new Date(purchase.created_date).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-sm">Downloads: {purchase.download_count || 0}/{purchase.max_downloads}</span>
                      {downloadsLeft > 0 && downloadsLeft <= 1 && (
                        <Badge className="bg-yellow-500">Last download!</Badge>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleDownload(purchase)}
                      disabled={downloadsLeft === 0}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {downloadsLeft === 0 ? 'Limit Reached' : 'Download Now'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}