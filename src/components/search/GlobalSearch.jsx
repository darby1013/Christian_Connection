import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Video, FileText, Users, ShoppingBag, Download, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GlobalSearch({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: streams = [] } = useQuery({
    queryKey: ['searchStreams', debouncedQuery],
    queryFn: () => base44.entities.LiveStream.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['searchVideos', debouncedQuery],
    queryFn: () => base44.entities.Video.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['searchBlogPosts', debouncedQuery],
    queryFn: () => base44.entities.BlogPost.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['searchProducts', debouncedQuery],
    queryFn: () => base44.entities.Product.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['searchDigitalProducts', debouncedQuery],
    queryFn: () => base44.entities.DigitalProduct.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['searchGroups', debouncedQuery],
    queryFn: () => base44.entities.Group.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const { data: forumThreads = [] } = useQuery({
    queryKey: ['searchForumThreads', debouncedQuery],
    queryFn: () => base44.entities.ForumThread.list('-created_date', 5),
    enabled: debouncedQuery.length > 2,
    initialData: [],
  });

  const filteredStreams = streams.filter(s => 
    s.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    s.host_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(v =>
    v.title?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredPosts = blogPosts.filter(p =>
    p.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredDigitalProducts = digitalProducts.filter(p =>
    p.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const filteredThreads = forumThreads.filter(t =>
    t.title?.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const hasResults = filteredStreams.length > 0 || filteredVideos.length > 0 || 
                     filteredPosts.length > 0 || filteredProducts.length > 0 ||
                     filteredDigitalProducts.length > 0 || filteredGroups.length > 0 ||
                     filteredThreads.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white font-black text-xl">Search</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search streams, videos, posts, products, groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white h-12"
            autoFocus
          />
        </div>

        <ScrollArea className="h-96 mt-4">
          {!debouncedQuery && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Start typing to search...</p>
            </div>
          )}

          {debouncedQuery && !hasResults && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No results found for "{debouncedQuery}"</p>
            </div>
          )}

          {/* Streams */}
          {filteredStreams.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                Live Streams
              </h3>
              <div className="space-y-2">
                {filteredStreams.map((stream) => (
                  <Link
                    key={stream.id}
                    to={createPageUrl(`LiveStreamView?id=${stream.id}`)}
                    onClick={onClose}
                    className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">{stream.title}</h4>
                        <p className="text-xs text-slate-400">{stream.host_name}</p>
                      </div>
                      {stream.status === 'live' && (
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {(filteredProducts.length > 0 || filteredDigitalProducts.length > 0) && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                Products
              </h3>
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={createPageUrl("Store")}
                    onClick={onClose}
                    className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=100'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">{product.name}</h4>
                        <p className="text-cyan-400 font-bold text-sm">${product.price}</p>
                      </div>
                      <Badge className="bg-blue-500">Physical</Badge>
                    </div>
                  </Link>
                ))}
                {filteredDigitalProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={createPageUrl("Store")}
                    onClick={onClose}
                    className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded flex items-center justify-center">
                        <Download className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">{product.name}</h4>
                        <p className="text-cyan-400 font-bold text-sm">${product.price}</p>
                      </div>
                      <Badge className="bg-purple-500">Digital</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Blog Posts */}
          {filteredPosts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Blog Posts
              </h3>
              <div className="space-y-2">
                {filteredPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={createPageUrl(`BlogPost?id=${post.id}`)}
                    onClick={onClose}
                    className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <h4 className="text-white font-semibold text-sm mb-1">{post.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {filteredGroups.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Groups
              </h3>
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={createPageUrl("Groups")}
                    onClick={onClose}
                    className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">{group.name}</h4>
                        <p className="text-xs text-slate-400">{group.member_count || 0} members</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Forum Threads */}
          {filteredThreads.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Forum Discussions
              </h3>
              <div className="space-y-2">
                {filteredThreads.map((thread) => (
                  <Link
                    key={thread.id}
                    to={createPageUrl("Forum")}
                    onClick={onClose}
                    className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <h4 className="text-white font-semibold text-sm mb-1">{thread.title}</h4>
                    <p className="text-xs text-slate-400">{thread.reply_count || 0} replies</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}