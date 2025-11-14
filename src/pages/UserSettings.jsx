import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User, Mail, Bell, Shield, Link2, Save, Eye, EyeOff,
  Settings, Globe, Moon, Sun, Smartphone, Monitor, Lock,
  CheckCircle, AlertCircle, Zap, MessageSquare, Heart,
  Calendar, ShoppingBag, Video, Radio, Mic2, Database,
  Activity, TrendingUp, Award, Crown, Gift, Star
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    profile_image: '',
    bio: '',
    phone: '',
    location: '',
    website: ''
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    live_stream_alerts: true,
    podcast_releases: true,
    event_reminders: true,
    order_updates: true,
    donation_receipts: true,
    community_activity: true,
    marketing_emails: false,
    weekly_digest: true,
    product_recommendations: true
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    show_activity: true,
    show_purchases: false,
    show_donations: false,
    allow_messages: true,
    allow_friend_requests: true,
    searchable: true,
    show_online_status: true
  });

  // Display Preferences
  const [display, setDisplay] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    currency: 'USD'
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load user settings
        setProfileData({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
          profile_image: currentUser.profile_image || '',
          bio: currentUser.bio || '',
          phone: currentUser.phone || '',
          location: currentUser.location || '',
          website: currentUser.website || ''
        });

        // Load saved preferences
        if (currentUser.notification_preferences) {
          setNotifications({ ...notifications, ...currentUser.notification_preferences });
        }
        if (currentUser.privacy_settings) {
          setPrivacy({ ...privacy, ...currentUser.privacy_settings });
        }
        if (currentUser.display_preferences) {
          setDisplay({ ...display, ...currentUser.display_preferences });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: connectedAccounts = [] } = useQuery({
    queryKey: ['connectedAccounts', user?.id],
    queryFn: async () => {
      // In real implementation, fetch from ConnectedAccounts entity
      return [];
    },
    enabled: !!user,
    initialData: []
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      alert('✅ Profile updated successfully!');
    },
    onError: (error) => {
      alert('❌ Failed to update profile: ' + error.message);
    }
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync(profileData);
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({ notification_preferences: notifications });
      alert('✅ Notification preferences saved!');
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({ privacy_settings: privacy });
      alert('✅ Privacy settings saved!');
    } finally {
      setSaving(false);
    }
  };

  const saveDisplay = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({ display_preferences: display });
      alert('✅ Display preferences saved!');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileData({ ...profileData, profile_image: file_url });
    } catch (error) {
      alert('Failed to upload image: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Account Settings</h1>
          <p className="text-slate-400 font-semibold">Manage your profile, notifications, privacy, and preferences</p>
        </div>

        {/* User Info Card */}
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-cyan-500/30">
                  <AvatarImage src={profileData.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-3xl font-bold">
                    {profileData.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1e293b]"></div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white mb-1">{profileData.full_name}</h2>
                <p className="text-slate-400 mb-2">{profileData.email}</p>
                <div className="flex gap-2">
                  <Badge className="bg-cyan-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                  <Badge className="bg-purple-500">
                    <Star className="w-3 h-3 mr-1" />
                    {user?.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-[#1e293b] border border-slate-700 p-1 grid grid-cols-2 md:grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-500">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-cyan-500">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="display" className="data-[state=active]:bg-cyan-500">
              <Monitor className="w-4 h-4 mr-2" />
              Display
            </TabsTrigger>
            <TabsTrigger value="connected" className="data-[state=active]:bg-cyan-500">
              <Link2 className="w-4 h-4 mr-2" />
              Connected
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-white font-bold mb-2 block">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 border-2 border-cyan-500/30">
                      <AvatarImage src={profileData.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-2xl font-bold">
                        {profileData.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="bg-slate-900 border-slate-700 text-white mb-2"
                      />
                      <p className="text-xs text-slate-400">Recommended: Square image, at least 400x400px</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold mb-2 block">Full Name</Label>
                    <Input
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Email</Label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="your@email.com"
                      type="email"
                    />
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Phone</Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block">Location</Label>
                    <Input
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Website</Label>
                  <Input
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold mb-2 block">Bio</Label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white h-32"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold h-12"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Delivery Methods
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-white font-semibold">Email Notifications</p>
                          <p className="text-xs text-slate-400">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.email_notifications}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-semibold">Push Notifications</p>
                          <p className="text-xs text-slate-400">Browser and mobile alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.push_notifications}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, push_notifications: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-semibold">SMS Notifications</p>
                          <p className="text-xs text-slate-400">Text message alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.sms_notifications}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, sms_notifications: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Content & Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Radio className="w-5 h-5 text-red-400" />
                        <span className="text-white">Live Stream Alerts</span>
                      </div>
                      <Switch
                        checked={notifications.live_stream_alerts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, live_stream_alerts: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mic2 className="w-5 h-5 text-purple-400" />
                        <span className="text-white">Podcast Releases</span>
                      </div>
                      <Switch
                        checked={notifications.podcast_releases}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, podcast_releases: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Event Reminders</span>
                      </div>
                      <Switch
                        checked={notifications.event_reminders}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, event_reminders: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-green-400" />
                        <span className="text-white">Order Updates</span>
                      </div>
                      <Switch
                        checked={notifications.order_updates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, order_updates: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-pink-400" />
                        <span className="text-white">Donation Receipts</span>
                      </div>
                      <Switch
                        checked={notifications.donation_receipts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, donation_receipts: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <span className="text-white">Community Activity</span>
                      </div>
                      <Switch
                        checked={notifications.community_activity}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, community_activity: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-amber-400" />
                        <span className="text-white">Product Recommendations</span>
                      </div>
                      <Switch
                        checked={notifications.product_recommendations}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, product_recommendations: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Marketing & Digest
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Marketing Emails</span>
                      </div>
                      <Switch
                        checked={notifications.marketing_emails}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, marketing_emails: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-purple-400" />
                        <span className="text-white">Weekly Digest</span>
                      </div>
                      <Switch
                        checked={notifications.weekly_digest}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, weekly_digest: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={saveNotifications}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold h-12"
                >
                  {saving ? 'Saving...' : 'Save Notification Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Privacy & Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-white font-bold mb-4">Profile Visibility</h3>
                  <div>
                    <Label className="text-white font-bold mb-2 block">Who can see your profile?</Label>
                    <Select value={privacy.profile_visibility} onValueChange={(value) => setPrivacy({ ...privacy, profile_visibility: value })}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="public" className="text-white">Public - Everyone</SelectItem>
                        <SelectItem value="members" className="text-white">Members Only</SelectItem>
                        <SelectItem value="private" className="text-white">Private - Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-4">Information Display</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Show Email Address</span>
                      <Switch
                        checked={privacy.show_email}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, show_email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Show Phone Number</span>
                      <Switch
                        checked={privacy.show_phone}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, show_phone: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Show Activity Status</span>
                      <Switch
                        checked={privacy.show_activity}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, show_activity: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Show Purchase History</span>
                      <Switch
                        checked={privacy.show_purchases}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, show_purchases: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Show Donation History</span>
                      <Switch
                        checked={privacy.show_donations}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, show_donations: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Show Online Status</span>
                      <Switch
                        checked={privacy.show_online_status}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, show_online_status: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-4">Interaction Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Allow Direct Messages</span>
                      <Switch
                        checked={privacy.allow_messages}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, allow_messages: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Allow Friend Requests</span>
                      <Switch
                        checked={privacy.allow_friend_requests}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, allow_friend_requests: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-white">Searchable Profile</span>
                      <Switch
                        checked={privacy.searchable}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, searchable: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={savePrivacy}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold h-12"
                >
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Display Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white font-bold mb-2 block flex items-center gap-2">
                      {display.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      Theme
                    </Label>
                    <Select value={display.theme} onValueChange={(value) => setDisplay({ ...display, theme: value })}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="light" className="text-white">Light</SelectItem>
                        <SelectItem value="dark" className="text-white">Dark</SelectItem>
                        <SelectItem value="auto" className="text-white">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </Label>
                    <Select value={display.language} onValueChange={(value) => setDisplay({ ...display, language: value })}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="en" className="text-white">English</SelectItem>
                        <SelectItem value="es" className="text-white">Español</SelectItem>
                        <SelectItem value="fr" className="text-white">Français</SelectItem>
                        <SelectItem value="de" className="text-white">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Timezone
                    </Label>
                    <Select value={display.timezone} onValueChange={(value) => setDisplay({ ...display, timezone: value })}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="America/New_York" className="text-white">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago" className="text-white">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver" className="text-white">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles" className="text-white">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London" className="text-white">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris" className="text-white">Paris (CET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date Format
                    </Label>
                    <Select value={display.date_format} onValueChange={(value) => setDisplay({ ...display, date_format: value })}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="MM/DD/YYYY" className="text-white">MM/DD/YYYY (US)</SelectItem>
                        <SelectItem value="DD/MM/YYYY" className="text-white">DD/MM/YYYY (UK)</SelectItem>
                        <SelectItem value="YYYY-MM-DD" className="text-white">YYYY-MM-DD (ISO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-bold mb-2 block flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Currency
                    </Label>
                    <Select value={display.currency} onValueChange={(value) => setDisplay({ ...display, currency: value })}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="USD" className="text-white">USD ($)</SelectItem>
                        <SelectItem value="EUR" className="text-white">EUR (€)</SelectItem>
                        <SelectItem value="GBP" className="text-white">GBP (£)</SelectItem>
                        <SelectItem value="CAD" className="text-white">CAD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={saveDisplay}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-bold h-12"
                >
                  {saving ? 'Saving...' : 'Save Display Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connected Accounts Tab */}
          <TabsContent value="connected" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold">Connected Accounts & Integrations</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Link2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">No Connected Accounts</h3>
                  <p className="text-slate-400 mb-6">Connect your social media and third-party accounts for easier access</p>
                  <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Globe className="w-4 h-4 mr-2" />
                      Connect Google
                    </Button>
                    <Button className="bg-slate-800 hover:bg-slate-700">
                      <Globe className="w-4 h-4 mr-2" />
                      Connect GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}