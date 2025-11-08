
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Film, Image as ImageIcon, Palette, Upload, Save, Trash2, Eye
} from "lucide-react";

export default function AdminSiteSettings() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list(),
    initialData: [],
  });

  const createSettingMutation = useMutation({
    mutationFn: (settingData) => base44.entities.SiteSettings.create(settingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      alert('Setting saved successfully!');
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SiteSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      alert('Setting updated successfully!');
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: (id) => base44.entities.SiteSettings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    },
  });

  const handleFileUpload = async (file, settingKey, settingType) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const existingSetting = settings.find(s => s.setting_key === settingKey);
      
      if (existingSetting) {
        await updateSettingMutation.mutateAsync({
          id: existingSetting.id,
          data: { setting_value: file_url }
        });
      } else {
        await createSettingMutation.mutateAsync({
          setting_key: settingKey,
          setting_value: file_url,
          setting_type: settingType,
          category: 'hero',
          description: `${settingKey} file`
        });
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const heroVideo = settings.find(s => s.setting_key === 'hero_video');
  const heroImage = settings.find(s => s.setting_key === 'hero_image');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Site Settings</h2>
          <p className="text-slate-400 font-semibold">Manage your website appearance and content</p>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-[#1a1f3a] border border-slate-700">
          <TabsTrigger value="hero" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-bold">
            <Film className="w-4 h-4 mr-2" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="theme" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white font-bold">
            <Palette className="w-4 h-4 mr-2" />
            Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          {/* Hero Video Upload */}
          <Card className="admin-card border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
                <Film className="w-6 h-6 text-cyan-400" />
                Hero Video Background
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white font-bold mb-2 block">Upload Video</Label>
                    <p className="text-sm text-slate-400 mb-3 font-semibold">
                      Upload a short video clip (MP4 format recommended, max 50MB)
                    </p>
                    <Input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file, 'hero_video', 'video');
                      }}
                      disabled={uploading}
                      className="bg-slate-800/50 border-slate-700 text-white font-semibold"
                    />
                  </div>
                  
                  {heroVideo && (
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Current Video URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={heroVideo.setting_value}
                          readOnly
                          className="bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteSettingMutation.mutate(heroVideo.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
                      <p className="text-white font-bold mt-4">Uploading...</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-white font-bold">Preview</Label>
                  {heroVideo?.setting_value ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border-2 border-cyan-500/30 shadow-xl">
                      <video
                        src={heroVideo.setting_value}
                        className="w-full h-full object-cover"
                        controls
                        muted
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-slate-900 border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                      <div className="text-center">
                        <Film className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold">No video uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Image Upload (Fallback) */}
          <Card className="admin-card border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
                <ImageIcon className="w-6 h-6 text-cyan-400" />
                Hero Image Fallback
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white font-bold mb-2 block">Upload Image</Label>
                    <p className="text-sm text-slate-400 mb-3 font-semibold">
                      Upload a backup image (JPG, PNG formats, max 5MB)
                    </p>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(file, 'hero_image', 'image');
                      }}
                      disabled={uploading}
                      className="bg-slate-800/50 border-slate-700 text-white font-semibold"
                    />
                  </div>
                  
                  {heroImage && (
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Current Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={heroImage.setting_value}
                          readOnly
                          className="bg-slate-800/50 border-slate-700 text-white font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteSettingMutation.mutate(heroImage.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-white font-bold">Preview</Label>
                  {heroImage?.setting_value ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-cyan-500/30 shadow-xl">
                      <img
                        src={heroImage.setting_value}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-slate-900 border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold">No image uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="admin-card border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-lg mb-1">Preview Changes</h3>
                  <p className="text-sm text-slate-400 font-semibold">See how your site looks with the new settings</p>
                </div>
                <Button
                  onClick={() => window.open('/', '_blank')}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card className="admin-card border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white font-black text-xl">Theme Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Palette className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Theme Customization</h3>
                <p className="text-slate-400 font-semibold">Advanced theme options coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
