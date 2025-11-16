import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  User, GripVertical, Eye, Save, Upload, Palette, Layout, 
  ShoppingBag, Heart, Award, Settings, Image as ImageIcon,
  Sun, Moon, Sparkles, Globe, Mail, Bell, Star, Package,
  Calendar, MessageSquare, Download, TrendingUp
} from 'lucide-react';

export default function UserProfileEditor() {
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    bio: '',
    website: '',
    social_links: { twitter: '', instagram: '', facebook: '' },
    interests: [],
    banner_image: '',
    avatar: '',
    location: '',
    company: '',
    tagline: ''
  });

  const [sections, setSections] = useState([
    { id: 'bio', title: 'Bio & About', icon: User, visible: true },
    { id: 'stats', title: 'My Statistics', icon: TrendingUp, visible: true },
    { id: 'orders', title: 'Recent Orders', icon: ShoppingBag, visible: true },
    { id: 'wishlist', title: 'Wishlist', icon: Heart, visible: true },
    { id: 'badges', title: 'Achievements', icon: Award, visible: true },
    { id: 'activity', title: 'Recent Activity', icon: Calendar, visible: true },
    { id: 'reviews', title: 'My Reviews', icon: Star, visible: true },
    { id: 'downloads', title: 'Digital Library', icon: Download, visible: false }
  ]);

  const [theme, setTheme] = useState({
    layout: 'default',
    colorScheme: '#06b6d4',
    bannerStyle: 'gradient',
    font: 'default',
    spacing: 'comfortable'
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        setProfileData(prev => ({
          ...prev,
          bio: currentUser.bio || '',
          website: currentUser.website || '',
          social_links: currentUser.social_links || { twitter: '', instagram: '', facebook: '' }
        }));
        
        const layouts = await base44.entities.UserProfileLayout.filter({ user_id: currentUser.id });
        if (layouts[0]) {
          setSections(layouts[0].sections || sections);
          setTheme({
            layout: layouts[0].theme || 'default',
            colorScheme: layouts[0].color_scheme || '#06b6d4',
            bannerStyle: 'gradient',
            font: 'default',
            spacing: 'comfortable'
          });
          if (layouts[0].banner_image) {
            setProfileData(prev => ({ ...prev, banner_image: layouts[0].banner_image }));
          }
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => user ? base44.entities.Order.filter({ user_id: user.id }).then(o => o.slice(0, 5)) : [],
    enabled: !!user,
    initialData: []
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => user ? base44.entities.WishlistItem.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: []
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: () => user ? base44.entities.ProductReview.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: []
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ['digitalDownloads', user?.id],
    queryFn: () => user ? base44.entities.DigitalDownload.filter({ user_id: user.id }) : [],
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
    mutationFn: async ({ file, type }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return { url: file_url, type };
    },
    onSuccess: ({ url, type }) => {
      if (type === 'banner') {
        setProfileData(prev => ({ ...prev, banner_image: url }));
        setUploadingBanner(false);
      } else {
        setProfileData(prev => ({ ...prev, avatar: url }));
        setUploadingAvatar(false);
      }
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    setSections(items);
  };

  const handleSave = async () => {
    await saveLayoutMutation.mutateAsync({
      sections,
      theme: theme.layout,
      color_scheme: theme.colorScheme,
      banner_image: profileData.banner_image,
      layout_config: { font: theme.font, spacing: theme.spacing },
      bio_visible: sections.find(s => s.id === 'bio')?.visible,
      orders_visible: sections.find(s => s.id === 'orders')?.visible,
      wishlist_visible: sections.find(s => s.id === 'wishlist')?.visible,
      badges_visible: sections.find(s => s.id === 'badges')?.visible
    });

    if (profileData.bio || profileData.website || profileData.location || profileData.company || profileData.tagline) {
      await base44.auth.updateMe({
        bio: profileData.bio,
        website: profileData.website,
        social_links: profileData.social_links,
        location: profileData.location,
        company: profileData.company,
        tagline: profileData.tagline
      });
    }
  };

  const handleImageUpload = async (file, type) => {
    if (type === 'banner') setUploadingBanner(true);
    else setUploadingAvatar(true);
    uploadImageMutation.mutate({ file, type });
  };

  const renderSectionPreview = (section) => {
    if (!section.visible) return null;

    switch(section.id) {
      case 'bio':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">About Me</h3>
              </div>
              <p className="text-slate-300 mb-4">{profileData.bio || 'No bio yet. Add one to tell others about yourself!'}</p>
              {profileData.tagline && (
                <p className="text-cyan-400 italic mb-2">"{profileData.tagline}"</p>
              )}
              <div className="space-y-2">
                {profileData.location && (
                  <p className="text-slate-400 text-sm">📍 {profileData.location}</p>
                )}
                {profileData.company && (
                  <p className="text-slate-400 text-sm">🏢 {profileData.company}</p>
                )}
                {profileData.website && (
                  <a href={profileData.website} className="text-cyan-400 text-sm flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {profileData.website}
                  </a>
                )}
                {(profileData.social_links?.twitter || profileData.social_links?.instagram || profileData.social_links?.facebook) && (
                  <div className="flex gap-3 mt-3">
                    {profileData.social_links.twitter && (
                      <a href={profileData.social_links.twitter} className="text-slate-400 hover:text-cyan-400">Twitter</a>
                    )}
                    {profileData.social_links.instagram && (
                      <a href={profileData.social_links.instagram} className="text-slate-400 hover:text-cyan-400">Instagram</a>
                    )}
                    {profileData.social_links.facebook && (
                      <a href={profileData.social_links.facebook} className="text-slate-400 hover:text-cyan-400">Facebook</a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'stats':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">My Statistics</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-white">{orders.length}</p>
                  <p className="text-slate-400 text-xs">Orders</p>
                </div>
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-white">{wishlist.length}</p>
                  <p className="text-slate-400 text-xs">Wishlist</p>
                </div>
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-white">{reviews.length}</p>
                  <p className="text-slate-400 text-xs">Reviews</p>
                </div>
                <div className="text-center p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-black text-white">{downloads.length}</p>
                  <p className="text-slate-400 text-xs">Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'orders':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">Recent Orders</h3>
              </div>
              {orders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                      <div>
                        <p className="text-slate-300 text-sm font-bold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-slate-500 text-xs">{new Date(order.created_date).toLocaleDateString()}</p>
                      </div>
                      <Badge className="bg-green-500">${order.total?.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'wishlist':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">Wishlist</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {wishlist.slice(0, 6).map(item => (
                  <div key={item.id} className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                    <img src={item.product_image || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-center mt-3">{wishlist.length} items saved</p>
            </CardContent>
          </Card>
        );
      case 'badges':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">Achievements</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
                  <Star className="w-4 h-4 mr-2" />
                  Early Adopter
                </Badge>
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Top Contributor
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  VIP Shopper
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      case 'activity':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Placed an order</p>
                    <p className="text-slate-500 text-xs">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Added to wishlist</p>
                    <p className="text-slate-500 text-xs">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'reviews':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">My Reviews</h3>
              </div>
              <p className="text-slate-400">{reviews.length} reviews written</p>
            </CardContent>
          </Card>
        );
      case 'downloads':
        return (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5" style={{ color: theme.colorScheme }} />
                <h3 className="text-white font-bold text-xl">Digital Library</h3>
              </div>
              <p className="text-slate-400">{downloads.length} digital products</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const themeStyles = {
    default: 'max-w-6xl',
    minimal: 'max-w-4xl',
    creative: 'max-w-7xl',
    professional: 'max-w-5xl'
  };

  const spacingStyles = {
    compact: 'space-y-3',
    comfortable: 'space-y-6',
    spacious: 'space-y-10'
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <User className="w-10 h-10 text-cyan-400" />
              Profile Editor
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">ENTERPRISE</Badge>
            </h1>
            <p className="text-slate-400 font-semibold">Drag, drop, and customize your profile in real-time</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setPreview(!preview)} variant="outline" className="border-slate-600">
              <Eye className="w-4 h-4 mr-2" />
              {preview ? 'Edit Mode' : 'Live Preview'}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold h-12 px-6">
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
                    <Label className="text-white mb-2 block">Profile Banner</Label>
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    {uploadingBanner && <p className="text-cyan-400 text-xs mt-1">Uploading...</p>}
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">Profile Picture</Label>
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    {uploadingAvatar && <p className="text-cyan-400 text-xs mt-1">Uploading...</p>}
                  </div>

                  <div>
                    <Label className="text-white">Tagline</Label>
                    <Input 
                      value={profileData.tagline}
                      onChange={(e) => setProfileData({...profileData, tagline: e.target.value})}
                      placeholder="Your personal motto..."
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Bio</Label>
                    <Textarea 
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      className="bg-slate-900 border-slate-700 text-white h-32"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Location</Label>
                      <Input 
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        placeholder="City, State"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Company</Label>
                      <Input 
                        value={profileData.company}
                        onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                        placeholder="Your company"
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
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

                  <div className="space-y-2">
                    <Label className="text-white">Social Links</Label>
                    <Input 
                      value={profileData.social_links.twitter}
                      onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, twitter: e.target.value}})}
                      placeholder="Twitter URL"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    <Input 
                      value={profileData.social_links.instagram}
                      onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, instagram: e.target.value}})}
                      placeholder="Instagram URL"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    <Input 
                      value={profileData.social_links.facebook}
                      onChange={(e) => setProfileData({...profileData, social_links: {...profileData.social_links, facebook: e.target.value}})}
                      placeholder="Facebook URL"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-purple-400" />
                  <h2 className="text-white font-black text-lg">Theme Customization</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Accent Color</Label>
                    <div className="flex gap-2">
                      {['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'].map(color => (
                        <button
                          key={color}
                          onClick={() => setTheme({...theme, colorScheme: color})}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            theme.colorScheme === color ? 'border-white scale-110 shadow-lg' : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Layout Style</Label>
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

                  <div>
                    <Label className="text-white">Spacing</Label>
                    <Select value={theme.spacing} onValueChange={(val) => setTheme({...theme, spacing: val})}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Font Style</Label>
                    <Select value={theme.font} onValueChange={(val) => setTheme({...theme, font: val})}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="mono">Monospace</SelectItem>
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
                  <h2 className="text-white font-black text-lg">Section Manager</h2>
                </div>
                <p className="text-slate-400 text-sm mb-4">Drag to reorder • Click to hide/show</p>
                
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {sections.map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  snapshot.isDragging
                                    ? 'border-cyan-500 bg-cyan-900/30 shadow-lg'
                                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <GripVertical className="w-5 h-5 text-slate-500" />
                                <section.icon className="w-5 h-5 text-cyan-400" />
                                <span className="flex-1 text-white font-semibold text-sm">{section.title}</span>
                                <button
                                  onClick={() => {
                                    const updated = sections.map(s => 
                                      s.id === section.id ? {...s, visible: !s.visible} : s
                                    );
                                    setSections(updated);
                                  }}
                                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                    section.visible 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-slate-700 text-slate-400'
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
            <div className={themeStyles[theme.layout] + ' mx-auto'}>
              <Card className="bg-[#1a1f3a] border-slate-700 overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div 
                    className="h-64 relative bg-cover bg-center"
                    style={{
                      background: profileData.banner_image 
                        ? `url(${profileData.banner_image})` 
                        : `linear-gradient(135deg, ${theme.colorScheme} 0%, #0891b2 100%)`
                    }}
                  >
                    {!profileData.banner_image && (
                      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/20">
                        <ImageIcon className="w-20 h-20 text-white/40" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-start gap-6 -mt-24 mb-8">
                      <div 
                        className="w-32 h-32 rounded-2xl border-4 flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden"
                        style={{ borderColor: theme.colorScheme }}
                      >
                        {profileData.avatar ? (
                          <img src={profileData.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                            {user?.full_name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="mt-16">
                        <h1 className="text-3xl font-black text-white mb-2">{user?.full_name || 'Your Name'}</h1>
                        {profileData.tagline && (
                          <p className="text-cyan-400 italic mb-2">"{profileData.tagline}"</p>
                        )}
                        <p className="text-slate-400 font-semibold mb-3">{user?.email}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge style={{ backgroundColor: theme.colorScheme }}>VIP Member</Badge>
                          <Badge className="bg-yellow-500">
                            <Star className="w-3 h-3 mr-1" />
                            Top Contributor
                          </Badge>
                          <Badge className="bg-purple-500">
                            {orders.length} Orders
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className={spacingStyles[theme.spacing]}>
                      {sections.map(section => (
                        <div key={section.id} className="animate-in fade-in">
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
    </div>
  );
}