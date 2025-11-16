import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Layout, Plus, Edit, Trash2, Eye, Sparkles } from 'lucide-react';

export default function AdminLandingPageBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    hero_image: '',
    cta_text: 'Shop Now',
    cta_link: '',
    seo_title: '',
    seo_description: ''
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LandingPage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['landingPages']);
      setShowDialog(false);
      resetForm();
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      hero_image: '',
      cta_text: 'Shop Now',
      cta_link: '',
      seo_title: '',
      seo_description: ''
    });
    setEditingPage(null);
  };

  const handleImageUpload = async (file) => {
    const url = await uploadImageMutation.mutateAsync(file);
    setForm({...form, hero_image: url});
  };

  const columns = [
    { header: 'Page', key: 'title', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Slug', key: 'slug', render: (val) => <span className="text-cyan-400">/{val}</span> },
    { header: 'Views', key: 'views', render: (val) => <span className="text-slate-300">{val || 0}</span> },
    { header: 'Conversions', key: 'conversions', render: (val) => <Badge className="bg-green-500">{val || 0}</Badge> },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Landing Page Builder"
        subtitle="Create high-converting promotional pages"
        icon={Layout}
        badge="CMS"
        actions={[
          { label: 'Create Page', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{pages.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Pages</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{pages.reduce((sum, p) => sum + (p.views || 0), 0)}</p>
            <p className="text-green-300 text-sm font-bold">Total Views</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{pages.reduce((sum, p) => sum + (p.conversions || 0), 0)}</p>
            <p className="text-purple-300 text-sm font-bold">Conversions</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={pages}
        actions={[
          { label: 'Preview', icon: Eye, onClick: (p) => window.open(`/landing/${p.slug}`, '_blank') },
          { label: 'Delete', icon: Trash2, onClick: (p) => {
            if (confirm('Delete page?')) base44.entities.LandingPage.delete(p.id).then(() => queryClient.invalidateQueries(['landingPages']));
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Create Landing Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Page Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">URL Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div>
              <Label className="text-white">Hero Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="bg-slate-900 border-slate-700 text-white" />
              {form.hero_image && <img src={form.hero_image} alt="" className="w-full h-48 object-cover rounded-lg mt-2" />}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">CTA Button Text</Label>
                <Input value={form.cta_text} onChange={(e) => setForm({...form, cta_text: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">CTA Link</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({...form, cta_link: e.target.value})} placeholder="/store" className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div>
              <Label className="text-white">SEO Title</Label>
              <Input value={form.seo_title} onChange={(e) => setForm({...form, seo_title: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
            </div>

            <div>
              <Label className="text-white">SEO Description</Label>
              <Textarea value={form.seo_description} onChange={(e) => setForm({...form, seo_description: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-20" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowDialog(false); resetForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
                Create Landing Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}