import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video, Eye, DollarSign, Trash2, Edit, Plus, Search, Radio
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminLiveStreams() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ['adminLiveStreams'],
    queryFn: () => base44.entities.LiveStream.list('-created_date'),
    initialData: [],
  });

  const deleteStreamMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveStream.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLiveStreams'] });
    },
  });

  const filteredStreams = streams.filter(stream =>
    stream.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stream.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const liveStreams = filteredStreams.filter(s => s.status === 'live');
  const allStreams = filteredStreams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Live Streams Management</h2>
          <p className="text-slate-400 font-semibold">Monitor and manage all live streams</p>
        </div>
        <Link to={createPageUrl("BroadcastStream")}>
          <Button className="bg-gradient-to-r from-orange-600 to-red-600 font-bold shadow-xl glow-orange">
            <Plus className="w-5 h-5 mr-2" />
            Start Broadcast
          </Button>
        </Link>
      </div>

      {/* Live Now Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="admin-card border-0 glow-orange">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-semibold mb-1">Live Now</p>
                <p className="text-3xl font-black text-white">{liveStreams.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Radio className="w-7 h-7 text-white animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-semibold mb-1">Total Streams</p>
                <p className="text-3xl font-black text-white">{streams.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center">
                <Video className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-semibold mb-1">Total Viewers</p>
                <p className="text-3xl font-black text-white">
                  {streams.reduce((sum, s) => sum + (s.viewer_count || 0), 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Eye className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-semibold mb-1">Total Donations</p>
                <p className="text-3xl font-black text-white">
                  ${streams.reduce((sum, s) => sum + (s.total_donations || 0), 0).toFixed(0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search streams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800/50 border-orange-500/30 text-white"
        />
      </div>

      {/* Streams Table */}
      <Card className="admin-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-orange-500/20 hover:bg-transparent">
                <TableHead className="text-orange-400 font-black">Status</TableHead>
                <TableHead className="text-orange-400 font-black">Title</TableHead>
                <TableHead className="text-orange-400 font-black">Host</TableHead>
                <TableHead className="text-orange-400 font-black">Category</TableHead>
                <TableHead className="text-orange-400 font-black">Viewers</TableHead>
                <TableHead className="text-orange-400 font-black">Donations</TableHead>
                <TableHead className="text-orange-400 font-black">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStreams.map((stream) => (
                <TableRow key={stream.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <TableCell>
                    <Badge className={
                      stream.status === 'live' 
                        ? 'bg-red-600 animate-pulse' 
                        : stream.status === 'scheduled'
                        ? 'bg-blue-600'
                        : 'bg-slate-600'
                    }>
                      {stream.status === 'live' && <Radio className="w-3 h-3 mr-1" />}
                      {stream.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-white max-w-xs truncate">
                    {stream.title}
                  </TableCell>
                  <TableCell className="text-slate-300 font-semibold">
                    {stream.host_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-orange-500/30 text-orange-300">
                      {stream.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-bold">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      {stream.viewer_count || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-green-400 font-bold">
                    ${stream.total_donations || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to={createPageUrl(`LiveStreamView?id=${stream.id}`)}>
                        <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this stream?')) {
                            deleteStreamMutation.mutate(stream.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {allStreams.length === 0 && (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">No streams found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}