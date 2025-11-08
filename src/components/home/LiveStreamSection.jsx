import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ArrowRight } from "lucide-react";

export default function LiveStreamSection() {
  const { data: liveStreams = [], isLoading } = useQuery({
    queryKey: ['homeLiveStreams'],
    queryFn: () => base44.entities.LiveStream.filter({ status: 'live' }, '-created_date', 3),
    initialData: [],
  });

  if (!isLoading && liveStreams.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <Badge variant="destructive" className="text-sm">LIVE NOW</Badge>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Currently Streaming</h2>
        </div>
        <Link to={createPageUrl("LiveStreams")}>
          <Button variant="outline">
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-lg">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          liveStreams.map((stream) => (
            <Link key={stream.id} to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500">
                  <img
                    src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'}
                    alt={stream.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      LIVE
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {stream.viewer_count}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {stream.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{stream.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">{stream.host_name}</span>
                    <Badge variant="outline" className="text-xs">{stream.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}