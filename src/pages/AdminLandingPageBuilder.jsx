
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import EnterpriseTable from '../components/admin/EnterpriseTable';
import { Layout, Plus, Edit, Trash2, Eye, Sparkles, GitCompare } from 'lucide-react';

export default function AdminLandingPageBuilder() {
  const [showDialog, setShowDialog] = useState(false);
  const [showABDialog, setShowABDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null); // Used to store the page for A/B testing
  const [editingPage, setEditingPage] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    hero_image: '',
    hero_text: '', // Added hero_text
    cta_text: 'Shop Now',
    cta_link: '',
    seo_title: '',
    seo_description: '',
    content_blocks: [] // Added content_blocks
  });

  const [abTestForm, setAbTestForm] = useState({
    variant_a_content: {
      cta_text: '',
      hero_title: '',
      button_color: ''
    },
    variant_b_content: {
      cta_text: '',
      hero_title: '',
      button_color: ''
    }
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['landingPages'],
    queryFn: () => base44.entities.LandingPage.list('-created_date'),
    initialData: []
  });

  const { data: abTests = [] } = useQuery({
    queryKey: ['abTests'],
    queryFn: () => base44.entities.ABTest.list(),
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

  const createABTestMutation = useMutation({
    mutationFn: (data) => base44.entities.ABTest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['abTests']);
      setShowABDialog(false);
      alert('✅ A/B test created!');
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
      hero_text: '', // Reset hero_text
      cta_text: 'Shop Now',
      cta_link: '',
      seo_title: '',
      seo_description: '',
      content_blocks: [] // Reset content_blocks
    });
    setEditingPage(null);
  };

  const resetABTestForm = () => {
    setAbTestForm({
      variant_a_content: { cta_text: '', hero_title: '', button_color: '' },
      variant_b_content: { cta_text: '', hero_title: '', button_color: '' }
    });
    setSelectedPage(null);
  };

  const handleImageUpload = async (file) => {
    const url = await uploadImageMutation.mutateAsync(file);
    setForm({...form, hero_image: url});
  };

  const handleAbTestFormChange = (variant, field, value) => {
    setAbTestForm(prev => ({
      ...prev,
      [`variant_${variant}_content`]: {
        ...prev[`variant_${variant}_content`],
        [field]: value
      }
    }));
  };

  const columns = [
    { header: 'Page', key: 'title', render: (val) => <span className="text-white font-bold">{val}</span> },
    { header: 'Slug', key: 'slug', render: (val) => <span className="text-cyan-400 font-mono">/{val}</span> },
    { header: 'Views', key: 'views', render: (val) => <span className="text-slate-300">{val || 0}</span> },
    { header: 'Conversions', key: 'conversions', render: (val) => <Badge className="bg-green-500">{val || 0}</Badge> },
    {
      header: 'Conv. Rate',
      key: 'views',
      render: (val, row) => {
        const rate = val > 0 ? ((row.conversions || 0) / val * 100).toFixed(2) : 0;
        return <Badge className={rate > 5 ? 'bg-green-500' : 'bg-amber-500'}>{rate}%</Badge>;
      }
    },
    { header: 'Status', key: 'is_active', render: (val) => <Badge className={val ? 'bg-green-500' : 'bg-red-500'}>{val ? 'Active' : 'Inactive'}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Landing Page Builder"
        subtitle="Create high-converting pages with A/B testing"
        icon={Layout}
        badge="CMS"
        actions={[
          { label: 'Create Page', icon: Plus, onClick: () => setShowDialog(true) }
        ]}
      />

      <div className="grid grid-cols-4 gap-4"> {/* Changed to grid-cols-4 */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{pages.length}</p>
            <p className="text-blue-300 text-sm font-bold">Total Pages</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{pages.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString()}</p>
            <p className="text-green-300 text-sm font-bold">Total Views</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{pages.reduce((sum, p) => sum + (p.conversions || 0), 0)}</p>
            <p className="text-purple-300 text-sm font-bold">Conversions</p>
          </CardContent>
        </Card>
        {/* New Card for Active A/B Tests */}
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/30">
          <CardContent className="p-6">
            <p className="text-3xl font-black text-white">{abTests.filter(t => t.is_active).length}</p>
            <p className="text-amber-300 text-sm font-bold">Active A/B Tests</p>
          </CardContent>
        </Card>
      </div>

      <EnterpriseTable
        columns={columns}
        data={pages}
        actions={[
          { label: 'A/B Test', icon: GitCompare, onClick: (p) => {
            setSelectedPage(p);
            setShowABDialog(true);
            resetABTestForm(); // Clear the A/B test form when opening for a new page
          }},
          { label: 'Preview', icon: Eye, onClick: (p) => window.open(`/landing/${p.slug}`, '_blank') },
          { label: 'Delete', icon: Trash2, onClick: (p) => {
            if (confirm('Delete page?')) base44.entities.LandingPage.delete(p.id).then(() => queryClient.invalidateQueries(['landingPages']));
          }}
        ]}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Added max-h and overflow-y-auto */}
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

            {/* New Hero Text field */}
            <div>
              <Label className="text-white">Hero Text</Label>
              <Textarea value={form.hero_text} onChange={(e) => setForm({...form, hero_text: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-24" />
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

            {/* SEO fields updated to be in a grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">SEO Title</Label>
                <Input value={form.seo_title} onChange={(e) => setForm({...form, seo_title: e.target.value})} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-white">SEO Description</Label>
                <Textarea value={form.seo_description} onChange={(e) => setForm({...form, seo_description: e.target.value})} className="bg-slate-900 border-slate-700 text-white h-20" />
              </div>
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

      {/* A/B Test Dialog */}
      <Dialog open={showABDialog} onOpenChange={setShowABDialog}>
        <DialogContent className="bg-[#1a1f3a] border-purple-500 max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-purple-400" />
              Create A/B Test for "{selectedPage?.title}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">Define the elements you want to test between two variants. The base page content will be used for any fields not specified here.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <h3 className="text-blue-300 font-bold mb-3">Variant A (Control)</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="CTA Text (e.g., Shop Now)"
                    value={abTestForm.variant_a_content.cta_text}
                    onChange={(e) => handleAbTestFormChange('a', 'cta_text', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Input
                    placeholder="Hero Title"
                    value={abTestForm.variant_a_content.hero_title}
                    onChange={(e) => handleAbTestFormChange('a', 'hero_title', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Select
                    value={abTestForm.variant_a_content.button_color}
                    onValueChange={(value) => handleAbTestFormChange('a', 'button_color', value)}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Button Color" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Add more fields for Variant A as needed */}
                </div>
              </div>
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <h3 className="text-purple-300 font-bold mb-3">Variant B (Test)</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="CTA Text (e.g., Get Started)"
                    value={abTestForm.variant_b_content.cta_text}
                    onChange={(e) => handleAbTestFormChange('b', 'cta_text', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Input
                    placeholder="Hero Title"
                    value={abTestForm.variant_b_content.hero_title}
                    onChange={(e) => handleAbTestFormChange('b', 'hero_title', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Select
                    value={abTestForm.variant_b_content.button_color}
                    onValueChange={(value) => handleAbTestFormChange('b', 'button_color', value)}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Button Color" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Add more fields for Variant B as needed */}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {setShowABDialog(false); resetABTestForm();}} className="flex-1 border-slate-600">Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedPage) {
                    createABTestMutation.mutate({
                      page_id: selectedPage.id,
                      variant_a_content: abTestForm.variant_a_content,
                      variant_b_content: abTestForm.variant_b_content,
                      winner: 'undetermined', // Default winner state
                      is_active: true // A new A/B test should probably be active by default
                    });
                  }
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold"
              >
                Start A/B Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
