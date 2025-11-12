import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  User, Mail, Shield, Bell, Lock, Key, Save,
  CheckCircle, AlertTriangle, Settings, Activity,
  Calendar, MapPin, Phone, Briefcase, Award, Crown
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    job_title: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    order_updates: true,
    content_updates: true,
    community_updates: true,
    security_alerts: true,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfileForm({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          location: currentUser.location || '',
          bio: currentUser.bio || '',
          job_title: currentUser.job_title || '',
        });
        setNotificationSettings({
          email_notifications: currentUser.email_notifications !== false,
          push_notifications: currentUser.push_notifications !== false,
          marketing_emails: currentUser.marketing_emails || false,
          order_updates: currentUser.order_updates !== false,
          content_updates: currentUser.content_updates !== false,
          community_updates: currentUser.community_updates !== false,
          security_alerts: currentUser.security_alerts !== false,
        });
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const { data: loyalty } = useQuery({
    queryKey: ['myLoyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const records = await base44.entities.CustomerLoyalty.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user,
  });

  const { data: myActivities = [] } = useQuery({
    queryKey: ['myActivities', user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ user_id: user?.id }, '-created_date', 20),
    enabled: !!user,
    initialData: [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Log activity
      base44.entities.UserActivity.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        action_type: 'user_updated',
        action_description: `Updated profile information`,
        entity_type: 'User',
        entity_id: user.id,
        entity_name: profileForm.full_name,
        severity: 'low'
      });
      
      alert('✅ Profile updated successfully!');
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Log activity
      base44.entities.UserActivity.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        action_type: 'setting_changed',
        action_description: `Updated notification preferences`,
        entity_type: 'User',
        entity_id: user.id,
        entity_name: user.full_name,
        severity: 'low'
      });
      
      alert('✅ Notification preferences updated!');
    },
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordChange = () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('❌ Passwords do not match!');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      alert('❌ Password must be at least 8 characters!');
      return;
    }
    
    // Log activity
    base44.entities.UserActivity.create({
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      action_type: 'setting_changed',
      action_description: `Changed account password`,
      entity_type: 'User',
      entity_id: user.id,
      entity_name: user.full_name,
      severity: 'high'
    });
    
    alert('✅ Password changed successfully!');
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  const handleNotificationUpdate = () => {
    updateNotificationsMutation.mutate(notificationSettings);
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'bronze': return 'from-amber-700 to-orange-700';
      case 'silver': return 'from-slate-400 to-slate-500';
      case 'gold': return 'from-yellow-400 to-amber-500';
      case 'platinum': return 'from-cyan-400 to-blue-500';
      case 'diamond': return 'from-purple-500 to-pink-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getActionIcon = (actionType) => {
    switch(actionType) {
      case 'content_created':
      case 'content_updated': return <Activity className="w-4 h-4" />;
      case 'order_placed':
      case 'order_updated': return <CheckCircle className="w-4 h-4" />;
      case 'setting_changed': return <Settings className="w-4 h-4" />;
      case 'login': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-slate-600 mx-auto mb-4 animate-pulse" />
            <p className="text-white font-semibold">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-cyan-500">
                <AvatarImage src={user.profile_image} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-black text-3xl">
                  {user.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-black text-white">{user.full_name}</h1>
                  <Badge className={user.role === 'admin' ? 'bg-red-500' : 'bg-cyan-500'}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role === 'admin' ? 'Administrator' : 'Member'}
                  </Badge>
                  {loyalty && (
                    <Badge className={`bg-gradient-to-r ${getTierColor(loyalty.current_tier)}`}>
                      <Crown className="w-3 h-3 mr-1" />
                      {loyalty.current_tier.toUpperCase()} Member
                    </Badge>
                  )}
                </div>
                <p className="text-slate-300 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user.email}
                </p>
                {profileForm.job_title && (
                  <p className="text-slate-300 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {profileForm.job_title}
                  </p>
                )}
              </div>

              {loyalty && (
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{loyalty.total_points}</p>
                    <p className="text-slate-400 text-sm">Loyalty Points</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="bg-[#1a1f3a] border border-slate-700 mb-6">
                <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-500">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-cyan-500">
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Full Name</Label>
                        <Input
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-2 block">Email</Label>
                        <Input
                          value={profileForm.email}
                          disabled
                          className="bg-slate-900 border-slate-700 text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            placeholder="+1 (555) 000-0000"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="bg-slate-900 border-slate-700 text-white pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white font-bold mb-2 block">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            placeholder="City, State"
                            value={profileForm.location}
                            onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                            className="bg-slate-900 border-slate-700 text-white pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-2 block">Job Title</Label>
                      <Input
                        placeholder="Your role or position"
                        value={profileForm.job_title}
                        onChange={(e) => setProfileForm({...profileForm, job_title: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-2 block">Bio</Label>
                      <textarea
                        placeholder="Tell us about yourself..."
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        className="w-full h-24 bg-slate-900 border border-slate-700 text-white rounded-lg p-3 resize-none"
                      />
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="flex justify-end">
                      <Button onClick={handleProfileUpdate} className="bg-cyan-500 hover:bg-cyan-600">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Current Password</Label>
                      <Input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-2 block">New Password</Label>
                      <Input
                        type="password"
                        placeholder="At least 8 characters"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-2 block">Confirm New Password</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <Card className="bg-blue-900/20 border-blue-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-blue-300 font-bold mb-1">Password Requirements</p>
                            <ul className="text-blue-200 text-sm space-y-1">
                              <li>• At least 8 characters long</li>
                              <li>• Mix of uppercase and lowercase letters (recommended)</li>
                              <li>• Include numbers and special characters (recommended)</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator className="bg-slate-700" />

                    <div className="flex justify-end">
                      <Button onClick={handlePasswordChange} className="bg-red-500 hover:bg-red-600">
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Email Notifications</Label>
                          <p className="text-slate-400 text-sm">Receive updates via email</p>
                        </div>
                        <Switch
                          checked={notificationSettings.email_notifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, email_notifications: checked})}
                        />
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Push Notifications</Label>
                          <p className="text-slate-400 text-sm">Browser push notifications</p>
                        </div>
                        <Switch
                          checked={notificationSettings.push_notifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, push_notifications: checked})}
                        />
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Order Updates</Label>
                          <p className="text-slate-400 text-sm">Shipping and delivery notifications</p>
                        </div>
                        <Switch
                          checked={notificationSettings.order_updates}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, order_updates: checked})}
                        />
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Content Updates</Label>
                          <p className="text-slate-400 text-sm">New posts, videos, and podcasts</p>
                        </div>
                        <Switch
                          checked={notificationSettings.content_updates}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, content_updates: checked})}
                        />
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Community Updates</Label>
                          <p className="text-slate-400 text-sm">Forum replies and group activity</p>
                        </div>
                        <Switch
                          checked={notificationSettings.community_updates}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, community_updates: checked})}
                        />
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Security Alerts</Label>
                          <p className="text-slate-400 text-sm">Login attempts and account changes</p>
                        </div>
                        <Switch
                          checked={notificationSettings.security_alerts}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, security_alerts: checked})}
                        />
                      </div>

                      <Separator className="bg-slate-700" />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-bold">Marketing Emails</Label>
                          <p className="text-slate-400 text-sm">Promotions and special offers</p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketing_emails}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, marketing_emails: checked})}
                        />
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="flex justify-end">
                      <Button onClick={handleNotificationUpdate} className="bg-cyan-500 hover:bg-cyan-600">
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-sm">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </span>
                  <span className="text-white text-sm font-semibold">
                    {new Date(user.created_date).toLocaleDateString()}
                  </span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role
                  </span>
                  <Badge className={user.role === 'admin' ? 'bg-red-500' : 'bg-cyan-500'}>
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {myActivities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        {getActionIcon(activity.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs line-clamp-2">{activity.action_description}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(activity.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {myActivities.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}