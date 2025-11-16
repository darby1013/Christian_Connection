import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Video, Music, Book, Clock, CheckCircle } from 'lucide-react';

export default function MyDigitalLibrary() {
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

  const { data: downloads = [] } = useQuery({
    queryKey: ['digitalDownloads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.DigitalDownload.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const downloadMutation = useMutation({
    mutationFn: async (download) => {
      if (download.download_count >= download.max_downloads) {
        alert('Download limit reached for this product');
        return;
      }

      await base44.entities.DigitalDownload.update(download.id, {
        download_count: download.download_count + 1,
        last_download_at: new Date().toISOString()
      });

      window.open(download.download_url, '_blank');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['digitalDownloads']);
    }
  });

  const typeIcons = {
    ebook: Book,
    pdf: FileText,
    video: Video,
    audio: Music,
    course: Book,
    image: FileText,
    template: FileText,
    software: Download,
    podcast: Music
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Download className="w-10 h-10 text-purple-400" />
            My Digital Library
          </h1>
          <p className="text-slate-400 font-semibold">Access all your purchased digital products</p>
        </div>

        {downloads.length === 0 ? (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-16 text-center">
              <Download className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">No digital products yet</p>
              <p className="text-slate-400 mb-6">Browse the digital store to get started</p>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                Browse Digital Store
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {downloads.map(download => {
              const Icon = typeIcons.pdf || FileText;
              const isExpired = new Date(download.expires_at) < new Date();
              const downloadsRemaining = download.max_downloads - download.download_count;
              
              return (
                <Card key={download.id} className="bg-[#1a1f3a] border-slate-700 hover:border-purple-500 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2">{download.product_name}</h3>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {isExpired ? (
                            <Badge className="bg-red-500">Expired</Badge>
                          ) : (
                            <Badge className="bg-green-500">Active</Badge>
                          )}
                          <Badge className="bg-cyan-500">
                            {downloadsRemaining} downloads left
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-xs mb-3">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Expires: {new Date(download.expires_at).toLocaleDateString()}
                        </p>
                        {download.last_download_at && (
                          <p className="text-slate-500 text-xs mb-3">
                            Last downloaded: {new Date(download.last_download_at).toLocaleDateString()}
                          </p>
                        )}
                        <Button
                          onClick={() => downloadMutation.mutate(download)}
                          disabled={isExpired || downloadsRemaining === 0}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 font-bold"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Now
                        </Button>
                      </div>
                    </div>
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