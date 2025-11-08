import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Settings, ShoppingBag, Crown, Video, MessageSquare,
  Upload, Camera, Calendar, Heart, Package, FileText, Edit2, Check
} from "lucide-react";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    bio: "",
    profile_image: "",
    banner_image: ""
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfileForm({
          full_name: currentUser.full_name || "",
          bio: currentUser.bio || "",
          profile_image: currentUser.profile_image || "",
          banner_image: currentUser.banner_image || ""
        });
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: () => base44.entities.Order.filter({ customer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: streams = [] } = useQuery({
    queryKey: ['userStreams', user?.id],
    queryFn: () => base44.entities.LiveStream.filter({ host_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['userBlogPosts', user?.id],
    queryFn: () => base44.entities.BlogPost.filter({ author_name: user?.full_name }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: forumThreads = [] } = useQuery({
    queryKey: ['userForumThreads', user?.id],
    queryFn: () => base44.entities.ForumThread.filter({ author_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: async () => {
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const handleFileUpload = async (file, fieldName) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileForm({...profileForm, [fieldName]: file_url});
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const activeSubscription = subscriptions.find(s => s.status === 'active');
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-purple-900 via-blue-900 to-cyan-900 overflow-hidden">
        {profileForm.banner_image && (
          <img src={profileForm.banner_image} alt="Banner" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] to-transparent"></div>
        {isEditing && (
          <label className="absolute top-4 right-4 cursor-pointer">
            <Button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white">
              <Camera className="w-4 h-4 mr-2" />
              Change Banner
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files[0], 'banner_image')}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        {/* Profile Header */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-cyan-500">
                  <AvatarImage src={profileForm.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-4xl font-black">
                    {user.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <div className="w-10 h-10 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'profile_image')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white font-bold">Display Name</Label>
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-bold">Bio</Label>
                      <Textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="bg-slate-900/50 border-slate-700 text-white mt-2 h-20"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-black text-white mb-2">{user.full_name}</h1>
                    <p className="text-slate-400 mb-3">{user.email}</p>
                    {user.bio && (
                      <p className="text-slate-300 mb-4">{user.bio}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className="bg-blue-500">
                        <User className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                      {activeSubscription && (
                        <Badge className="bg-purple-500">
                          <Crown className="w-3 h-3 mr-1" />
                          {activeSubscription.plan_name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-slate-700 text-slate-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        Joined {new Date(user.created_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending || uploading}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setProfileForm({
                          full_name: user.full_name || "",
                          bio: user.bio || "",
                          profile_image: user.profile_image || "",
                          banner_image: user.banner_image || ""
                        });
                      }}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-4 text-center">
              <Video className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{streams.length}</p>
              <p className="text-xs text-slate-400">Streams</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{blogPosts.length}</p>
              <p className="text-xs text-slate-400">Posts</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{forumThreads.length}</p>
              <p className="text-xs text-slate-400">Threads</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-4 text-center">
              <ShoppingBag className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{orders.length}</p>
              <p className="text-xs text-slate-400">Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="w-full mb-12">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Activity
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white font-black">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {streams.slice(0, 5).map((stream) => (
                    <div key={stream.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                      <Video className="w-8 h-8 text-cyan-400" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{stream.title}</h4>
                        <p className="text-xs text-slate-400">{new Date(stream.created_date).toLocaleDateString()}</p>
                      </div>
                      <Badge className={stream.status === 'live' ? 'bg-red-500' : 'bg-gray-500'}>
                        {stream.status}
                      </Badge>
                    </div>
                  ))}
                  
                  {forumThreads.slice(0, 5).map((thread) => (
                    <div key={thread.id} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                      <MessageSquare className="w-8 h-8 text-green-400" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{thread.title}</h4>
                        <p className="text-xs text-slate-400">{new Date(thread.created_date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400">
                        {thread.reply_count || 0} replies
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6 mt-6">
            {activeSubscription ? (
              <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-black flex items-center gap-2">
                    <Crown className="w-6 h-6 text-amber-400" />
                    Active Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-4">{activeSubscription.plan_name}</h3>
                      <div className="space-y-2 text-slate-300">
                        <p><strong>Price:</strong> ${activeSubscription.price}/month</p>
                        <p><strong>Status:</strong> <Badge className="bg-green-500">{activeSubscription.status}</Badge></p>
                        <p><strong>Started:</strong> {new Date(activeSubscription.start_date).toLocaleDateString()}</p>
                        <p><strong>Renews:</strong> {new Date(activeSubscription.end_date).toLocaleDateString()}</p>
                        <p><strong>Auto-Renew:</strong> {activeSubscription.auto_renew ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-3">Benefits</h4>
                      <ul className="space-y-2">
                        {activeSubscription.benefits?.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-slate-300">
                            <Check className="w-4 h-4 text-green-400" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-12 text-center">
                  <Crown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
                  <p className="text-slate-400 mb-6">Subscribe to unlock exclusive content and features</p>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Crown className="w-4 h-4 mr-2" />
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white font-black">Purchase History</CardTitle>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Total Spent</p>
                  <p className="text-2xl font-black text-cyan-400">${totalSpent.toFixed(2)}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Order #{order.order_number || order.id.slice(0, 8)}</h4>
                          <p className="text-xs text-slate-400">{new Date(order.created_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white">${order.total_amount?.toFixed(2)}</p>
                        <Badge className={
                          order.status === 'delivered' ? 'bg-green-500' :
                          order.status === 'shipped' ? 'bg-blue-500' :
                          order.status === 'processing' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No orders yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}