
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
import { Progress } from "@/components/ui/progress";
import {
  User, Settings, ShoppingBag, Crown, Video, MessageSquare,
  Upload, Camera, Calendar, Heart, Package, FileText, Edit2, Check,
  Award, TrendingUp, Star, Trophy, Zap, Target, GraduationCap // Added GraduationCap
} from "lucide-react";
import { motion } from "framer-motion";

import LearningPath from "../components/profile/LearningPath";
import BadgeShowcase from "../components/profile/BadgeShowcase";

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

  // Badges System
  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: user?.id }),
    enabled: !!user,
    initialData: [],
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
    initialData: [],
  });

  const { data: userPoints } = useQuery({
    queryKey: ['userPoints', user?.id],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.filter({ user_id: user?.id });
      return points[0];
    },
    enabled: !!user,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['userLevels'],
    queryFn: () => base44.entities.UserLevel.list('level_number'),
    initialData: [],
  });

  const updateBadgeShowcaseMutation = useMutation({
    mutationFn: async ({ badgeId, isShowcased, order }) => {
      return base44.entities.UserBadge.update(badgeId, {
        is_showcased: isShowcased,
        showcase_order: order
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBadges'] });
    },
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

  const handleToggleBadgeShowcase = (badgeId, currentStatus) => {
    const showcasedBadgesCount = userBadges.filter(ub => ub.is_showcased).length;
    if (!currentStatus && showcasedBadgesCount >= 5) {
      alert('You can only showcase up to 5 badges');
      return;
    }
    updateBadgeShowcaseMutation.mutate({
      badgeId,
      isShowcased: !currentStatus,
      order: currentStatus ? null : showcasedBadgesCount + 1
    });
  };

  const activeSubscription = subscriptions.find(s => s.status === 'active');
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const showcasedBadges = userBadges
    .filter(ub => ub.is_showcased)
    .sort((a, b) => (a.showcase_order || 0) - (b.showcase_order || 0))
    .map(ub => allBadges.find(b => b.id === ub.badge_id))
    .filter(Boolean);

  const currentLevel = levels.find(l => 
    userPoints && userPoints.total_points >= l.required_points
  ) || levels[0];

  const nextLevel = levels.find(l =>
    userPoints && l.level_number > (currentLevel?.level_number || 0)
  );

  const levelDifference = (nextLevel?.required_points || 0) - (currentLevel?.required_points || 0);
  const pointsIntoCurrentLevel = (userPoints?.total_points || 0) - (currentLevel?.required_points || 0);

  const progressToNextLevel = (levelDifference > 0)
    ? (pointsIntoCurrentLevel / levelDifference) * 100
    : 100;

  const safeProgressToNextLevel = Math.max(0, Math.min(100, isNaN(progressToNextLevel) ? 0 : progressToNextLevel));


  const getBadgeColor = (color) => {
    const colors = {
      blue: "from-blue-500 to-cyan-500",
      purple: "from-purple-500 to-pink-500",
      green: "from-green-500 to-emerald-500",
      amber: "from-amber-500 to-orange-500",
      red: "from-red-500 to-rose-500",
      pink: "from-pink-500 to-fuchsia-500"
    };
    return colors[color] || colors.blue;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] py-12">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
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
                      {currentLevel && (
                        <Badge className={`bg-gradient-to-r ${getBadgeColor(currentLevel.color || 'blue')}`}>
                          <Trophy className="w-3 h-3 mr-1" />
                          {currentLevel.name}
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="learning" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4 mr-2" />
              My Learning Path
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Level & Progress Card */}
            {userPoints && nextLevel && (
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        Level Progress
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300">Current Level</span>
                          <span className="text-white font-bold text-lg">{currentLevel?.name}</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">Progress to {nextLevel.name}</span>
                            <span className="text-cyan-400 font-bold">{safeProgressToNextLevel.toFixed(0)}%</span>
                          </div>
                          <Progress value={safeProgressToNextLevel} className="h-3 mb-2" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">{userPoints.total_points} points</span>
                            <span className="text-slate-400">{nextLevel.required_points} points needed</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        Next Badge
                      </h3>
                      <div className="space-y-3">
                        {allBadges
                          .filter(b => !userBadges.some(ub => ub.badge_id === b.id))
                          .slice(0, 2)
                          .map(badge => {
                            const progress = badge.requirement_count > 0
                              ? ((userPoints.total_points || 0) / badge.requirement_count) * 100
                              : 0;
                            return (
                              <div key={badge.id} className="bg-slate-900/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">{badge.icon}</span>
                                  <div className="flex-1">
                                    <p className="text-white font-bold text-sm">{badge.name}</p>
                                    <p className="text-slate-400 text-xs">{badge.description}</p>
                                  </div>
                                </div>
                                <Progress value={Math.min(progress, 100)} className="h-2" />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Badge Showcase */}
            {showcasedBadges.length > 0 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-400" />
                    Badge Showcase
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {showcasedBadges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`relative group cursor-pointer bg-gradient-to-br ${getBadgeColor(badge.color)} p-4 rounded-xl aspect-square flex flex-col items-center justify-center`}>
                          <span className="text-4xl mb-2">{badge.icon}</span>
                          <p className="text-white font-bold text-xs text-center">{badge.name}</p>
                          <Badge className="absolute top-2 right-2 bg-amber-500">#{index + 1}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <Award className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-black text-white">{userBadges.length}</p>
                  <p className="text-xs text-slate-400">Badges</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-black text-white">{userPoints?.total_points || 0}</p>
                  <p className="text-xs text-slate-400">Points</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="learning" className="mt-6">
            <LearningPath userId={user?.id} />
          </TabsContent>

          {/* All Badges Tab */}
          <TabsContent value="badges" className="mt-6">
            <BadgeShowcase userId={user?.id} isOwnProfile={true} />
          </TabsContent>

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
          {/* Removed Subscription and Orders TabsContent */}
        </Tabs>
      </div>
    </div>
  );
}
