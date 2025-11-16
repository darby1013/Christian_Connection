import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Video, Plus, Edit, Trash2, Play } from 'lucide-react';

export default function AdminProductVideos() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    product_id: '',
    title: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    video_type: 'demo',
    is_featured: false
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['productVideos'],
    queryFn: () => base44.entities.ProductVideo.list(),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductVideo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productVideos']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductVideo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productVideos']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductVideo.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['productVideos'])
  });

  const resetForm = () => {
    setForm({
      product_id: '',
      title: '',
      video_url: '',
      thumbnail_url: '',
      duration: 0,
      video_type: 'demo',
      is_featured: false
    });
    setEditingVideo(null);
  };

  const handleSubmit = () => {
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const columns = [
    { 
      header: 'Video', 
      key: 'title',
      render: (_, video) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded bg-slate-800 flex items-center justify-center overflow-hidden">
            {video.thumbnail_url ? (
              <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Play className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div>
            <p className="text-white font-bold">{video.title}</p>
            <p className="text-slate-400 text-xs">{video.duration}s</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Product', 
      key: 'product_id',
      render: (val) => {
        const p = products.find(p => p.id === val);
        return <span className="text-slate-300">{p?.name || 'N/A'}</span>;
      }
    },
    { header: 'Type', key: 'video_type', render: (val) => <Badge className="bg-purple-500">{val}</Badge> },
    { header: 'Featured', key: 'is_featured', render: (val) => val ? <Badge className="bg-yellow-500">Featured</Badge> : null }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Product Videos"
        subtitle="Manage product demos, reviews, and tutorials"
        icon={Video}
        badge="ENTERPRISE"
        actions={[
          { label: 'Add Video', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{videos.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Videos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{videos.filter(v => v.video_type === 'demo').length}</p>
            <p className="text-purple-300 text-sm font-bold">Product Demos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{videos.filter(v => v.video_type === 'review').length}</p>
            <p className="text-green-300 text-sm font-bold">Reviews</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-yellow-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{videos.filter(v => v.is_featured).length}</p>
            <p className="text-yellow-300 text-sm font-bold">Featured</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={videos}
        actions={[
          { label: 'Edit', icon: Edit, onClick: (video) => {
            setEditingVideo(video);
            setForm(video);
            setShowDialog(true);
          }},
          { label: 'Delete', icon: Trash2, onClick: (video) => {
            if (confirm('Delete this video?')) deleteMutation.mutate(video.id);
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">
              {editingVideo ? 'Edit Video' : 'Add Video'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Product *</Label>
              <select
                value={form.product_id}
                onChange={(e) => setForm({...form, product_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-2"
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white">Video Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Video URL *</Label>
              <Input value={form.video_url} onChange={(e) => setForm({...form, video_url: e.target.value})} placeholder="https://..." className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Thumbnail URL</Label>
              <Input value={form.thumbnail_url} onChange={(e) => setForm({...form, thumbnail_url: e.target.value})} placeholder="https://..." className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Duration (seconds)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({...form, duration: parseInt(e.target.value)})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">Video Type</Label>
                <select
                  value={form.video_type}
                  onChange={(e) => setForm({...form, video_type: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-2"
                >
                  <option value="demo">Product Demo</option>
                  <option value="review">Review</option>
                  <option value="unboxing">Unboxing</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({...form, is_featured: e.target.checked})} />
              <Label className="text-white">Featured Video</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                {editingVideo ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}