import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  User, GripVertical, Eye, Save, Upload, Palette, Layout, 
  ShoppingBag, Heart, Award, Settings, Image as ImageIcon,
  Sun, Moon, Sparkles, Globe, Mail, Bell
} from 'lucide-react';

export default function UserProfileEditor() {
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    bio: '',
    website: '',
    social_links: { twitter: '', instagram: '', facebook: '' },
    interests: [],
    banner_image: '',
    avatar: ''
  });

  const [sections, setSections] = useState([
    { id: 'bio', title: 'Bio & About', icon: User, visible: true },
    { id: 'orders', title: 'Recent Orders', icon: ShoppingBag, visible: true },
    { id: 'wishlist', title: 'Wishlist', icon: Heart, visible: true },
    { id: 'badges', title: 'Achievements', icon: Award, visible: true }
  ]);

  const [theme, setTheme] = useState({
    layout: 'default',
    colorScheme: '#06b6d4',
    bannerStyle: 'gradient'
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const layouts = await base44.entities.UserProfileLayout.filter({ user_id: currentUser.id });
        if (layouts[0]) {
          setSections(layouts[0].sections || sections);
          setTheme({
            layout: layouts[0].theme || 'default',
            colorScheme: layouts[0].color_scheme || '#06b6d4',
            bannerStyle: 'gradient'
          });
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => user ? base44.entities.Order.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: []
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => user ? base44.entities.WishlistItem.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: []
  });

  const saveLayoutMutation = useMutation({
    mutationFn: async (data) => {
      const existing = await base44.entities.UserProfileLayout.filter({ user_id: user.id });
      if (existing[0]) {
        return base44.entities.UserProfileLayout.update(existing[0].id, data);
      }
      return base44.entities.UserProfileLayout.create({ user_id: user.id, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profileLayout']);
      alert('✅ Profile saved!');
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    setSections(items);
  };

  const handleSave = () => {
    saveLayoutMutation.mutate({
      sections,
      theme: theme.layout,
      color_scheme: theme.colorScheme,
      banner_image: profileData.banner_image,
      bio_visible: sections.find(s => s.id === 'bio')?.visible,
      orders_visible: sections.find(s => s.id === 'orders')?.visible,
      wishlist_visible: sections.find(s => s.id === 'wishlist')?.visible,
      badges_visible: sections.find(s => s.id === 'badges')?.visible
    });

    if (profileData.bio || profileData.website) {
      base44.auth.updateMe({
        bio: profileData.bio,
        website: profileData.website,
        social_links: profileData.social_links
      });
    }
  };

  const handleBannerUpload = async (file) => {
    const url = await uploadImageMutation.mutateAsync(file);
    setProfileData({...profileData, banner_image: url});
  };

  const renderSectionPreview = (section) => {
    if (!section.visible) return null;

    switch(section.id) {
      case 'bio':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-xl mb-3">About Me</h3>
              <p className="text-slate-300">{profileData.bio || 'No bio yet'}</p>
              {profileData.website && (
                <a href={profileData.website} className="text-cyan-400 text-sm mt-2 block">
                  <Globe className="w-4 h-4 inline mr-1" />
                  {profileData.website}
                </a>
              )}
            </CardContent>
          </Card>
        );
      case 'orders':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-xl mb-3">Recent Orders</h3>
              <div className="space-y-2">
                {orders.slice(0, 3).map(order => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                    <span className="text-slate-300 text-sm">Order #{order.id.slice(0, 8)}</span>
                    <Badge className="bg-green-500">${order.total?.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      case 'wishlist':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-xl mb-3">Wishlist</h3>
              <p className="text-slate-400">{wishlist.length} items saved</p>
            </CardContent>
          </Card>
        );
      case 'badges':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-xl mb-3">Achievements</h3>
              <div className="flex gap-2">
                <Badge className="bg-purple-500">Early Adopter</Badge>
                <Badge className="bg-yellow-500">Top Contributor</Badge>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <User className="w-10 h-10 text-cyan-400" />
              Profile Editor
            </h1>
            <p className="text-slate-400 font-semibold">Customize your profile with drag & drop</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setPreview(!preview)} variant="outline" className="border-slate-600">
              <Eye className="w-4 h-4 mr-2" />
              {preview ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-black text-xl">Profile Settings</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Profile Banner</Label>
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Bio</Label>
                    <Textarea 
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      className="bg-slate-900 border-slate-700 text-white h-24"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Website</Label>
                    <Input 
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      placeholder="https://..."
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Theme Color</Label>
                    <div className="flex gap-2">
                      {['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'].map(color => (
                        <button
                          key={color}
                          onClick={() => setTheme({...theme, colorScheme: color})}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            theme.colorScheme === color ? 'border-white scale-110' : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Layout Style</Label>
                    <Select value={theme.layout} onValueChange={(val) => setTheme({...theme, layout: val})}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="w-5 h-5 text-purple-400" />
                  <h2 className="text-white font-black text-lg">Section Order</h2>
                </div>
                <p className="text-slate-400 text-sm mb-4">Drag to reorder sections</p>
                
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {sections.map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors"
                              >
                                <GripVertical className="w-5 h-5 text-slate-500" />
                                <section.icon className="w-5 h-5 text-cyan-400" />
                                <span className="flex-1 text-white font-semibold">{section.title}</span>
                                <button
                                  onClick={() => {
                                    const updated = sections.map(s => 
                                      s.id === section.id ? {...s, visible: !s.visible} : s
                                    );
                                    setSections(updated);
                                  }}
                                  className={`px-3 py-1 rounded text-xs font-bold ${
                                    section.visible ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'
                                  }`}
                                >
                                  {section.visible ? 'Visible' : 'Hidden'}
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-[#1a1f3a] border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="h-48 bg-gradient-to-r from-purple-600 to-cyan-500 relative"
                  style={{
                    background: profileData.banner_image 
                      ? `url(${profileData.banner_image})` 
                      : `linear-gradient(135deg, ${theme.colorScheme} 0%, #0891b2 100%)`
                  }}
                >
                  {!profileData.banner_image && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                </div>
                
                <div className="p-8">
                  <div className="flex items-start gap-6 -mt-20 mb-8">
                    <div className="w-32 h-32 rounded-2xl border-4 border-[#1a1f3a] bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-5xl font-black text-white shadow-2xl">
                      {user?.full_name?.[0] || 'U'}
                    </div>
                    <div className="mt-16">
                      <h1 className="text-3xl font-black text-white mb-2">{user?.full_name || 'Your Name'}</h1>
                      <p className="text-slate-400 font-semibold">{user?.email}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge style={{ backgroundColor: theme.colorScheme }}>VIP Member</Badge>
                        <Badge className="bg-yellow-500">Top Contributor</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {sections.map(section => (
                      <div key={section.id}>
                        {renderSectionPreview(section)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}