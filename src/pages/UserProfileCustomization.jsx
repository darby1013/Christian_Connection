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
import { Slider } from "@/components/ui/slider";
import {
  Palette, Eye, Save, RotateCcw, Code, Sparkles,
  Sun, Moon, Type, Square, Upload, Image as ImageIcon,
  Droplet, Layers
} from "lucide-react";
import { useTheme } from "../components/theme/ThemeProvider";

export default function UserProfileCustomization() {
  const [user, setUser] = useState(null);
  const { theme, updateTheme, toggleMode } = useTheme();
  const [customCSS, setCustomCSS] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundBlur, setBackgroundBlur] = useState(0);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [cardStyle, setCardStyle] = useState('glass');
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load user theme settings
        const userThemes = await base44.entities.UserTheme.filter({ user_id: currentUser.id });
        if (userThemes.length > 0) {
          const userTheme = userThemes[0];
          setCustomCSS(userTheme.custom_css || '');
          setBackgroundImage(userTheme.background_image || '');
          setBackgroundBlur(userTheme.background_blur || 0);
          setBackgroundOpacity(userTheme.background_opacity || 1);
          setCardStyle(userTheme.card_style || 'glass');
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBackgroundImage(file_url);
      
      // Save to database
      await saveThemeSettings({ background_image: file_url });
      alert('✅ Background image uploaded!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const saveThemeSettings = async (updates = {}) => {
    if (!user) return;
    
    try {
      const userThemes = await base44.entities.UserTheme.filter({ user_id: user.id });
      const themeData = {
        background_image: backgroundImage,
        background_blur: backgroundBlur,
        background_opacity: backgroundOpacity,
        card_style: cardStyle,
        custom_css: customCSS,
        ...updates
      };

      if (userThemes.length > 0) {
        await base44.entities.UserTheme.update(userThemes[0].id, themeData);
      } else {
        await base44.entities.UserTheme.create({
          user_id: user.id,
          ...themeData
        });
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const saveCustomCSS = async () => {
    await saveThemeSettings({ custom_css: customCSS });
    applyCustomCSS();
    alert('✅ Custom CSS saved!');
  };

  const applyCustomCSS = () => {
    const existingStyle = document.getElementById('user-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (customCSS) {
      const style = document.createElement('style');
      style.id = 'user-custom-css';
      style.textContent = customCSS;
      document.head.appendChild(style);
    }
  };

  const applyBackgroundSettings = async () => {
    await saveThemeSettings({
      background_blur: backgroundBlur,
      background_opacity: backgroundOpacity,
      card_style: cardStyle
    });
    alert('✅ Background settings saved!');
  };

  const colorPresets = [
    { name: 'Glory Wave', primary: '#22d3ee', secondary: '#a855f7', accent: '#ec4899', bg: '#0a0e27' },
    { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4', accent: '#0284c7', bg: '#0c4a6e' },
    { name: 'Sunset', primary: '#f59e0b', secondary: '#ef4444', accent: '#ec4899', bg: '#1e1b4b' },
    { name: 'Forest', primary: '#10b981', secondary: '#059669', accent: '#84cc16', bg: '#064e3b' },
    { name: 'Purple Rain', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ec4899', bg: '#1e1b4b' },
    { name: 'Crimson', primary: '#dc2626', secondary: '#f97316', accent: '#fbbf24', bg: '#450a0a' },
    { name: 'Cyberpunk', primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', bg: '#0a0015' },
    { name: 'Mint Fresh', primary: '#34d399', secondary: '#10b981', accent: '#6ee7b7', bg: '#064e3b' },
  ];

  const resetTheme = () => {
    updateTheme({
      primary_color: '#22d3ee',
      secondary_color: '#a855f7',
      accent_color: '#ec4899',
      background_color: '#0a0e27',
      font_family: 'Inter',
      border_radius: '0.5rem',
    });
    setBackgroundImage('');
    setBackgroundBlur(0);
    setBackgroundOpacity(1);
    setCardStyle('glass');
  };

  const cardStyles = [
    { name: 'Glass', value: 'glass', preview: 'bg-white/10 backdrop-blur-xl border-white/20' },
    { name: 'Solid', value: 'solid', preview: 'bg-slate-800 border-slate-700' },
    { name: 'Gradient', value: 'gradient', preview: 'bg-gradient-to-br from-purple-900/50 to-cyan-900/50 border-purple-500/30' },
    { name: 'Neumorphic', value: 'neumorphic', preview: 'bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]' },
  ];

  return (
    <div 
      className="min-h-screen py-12 px-4 relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-[#0a0e27]"
        style={{
          opacity: 1 - backgroundOpacity,
          backdropFilter: `blur(${backgroundBlur}px)`,
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              <Palette className="w-8 h-8 text-cyan-400" />
              Advanced Profile Customization
            </h2>
            <p className="text-slate-400 font-semibold">Create your unique visual identity with colors, backgrounds, and custom styles</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleMode}
              variant="outline"
              className="border-slate-700 text-slate-300 bg-slate-900/80 backdrop-blur-sm"
            >
              {theme.mode === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme.mode === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
            <Button onClick={resetTheme} variant="outline" className="border-slate-700 text-slate-300 bg-slate-900/80 backdrop-blur-sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customization Tools */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="colors">
              <TabsList className="bg-slate-900/80 backdrop-blur-sm border border-slate-700">
                <TabsTrigger value="colors" className="data-[state=active]:bg-cyan-500">
                  <Palette className="w-4 h-4 mr-2" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="background" className="data-[state=active]:bg-cyan-500">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Background
                </TabsTrigger>
                <TabsTrigger value="typography" className="data-[state=active]:bg-cyan-500">
                  <Type className="w-4 h-4 mr-2" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="layout" className="data-[state=active]:bg-cyan-500">
                  <Square className="w-4 h-4 mr-2" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="css" className="data-[state=active]:bg-cyan-500">
                  <Code className="w-4 h-4 mr-2" />
                  Custom CSS
                </TabsTrigger>
              </TabsList>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-6">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Color Scheme Presets</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-3">
                      {colorPresets.map((preset) => (
                        <Card
                          key={preset.name}
                          onClick={() => updateTheme({
                            primary_color: preset.primary,
                            secondary_color: preset.secondary,
                            accent_color: preset.accent,
                            background_color: preset.bg,
                          })}
                          className="cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all bg-slate-800/50 border-slate-700"
                        >
                          <CardContent className="p-3">
                            <div className="flex gap-1 mb-2">
                              <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primary }} />
                              <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.secondary }} />
                              <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent }} />
                            </div>
                            <p className="text-white font-semibold text-xs">{preset.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Custom Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white font-bold mb-2 block">Primary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={theme.primary_color}
                            onChange={(e) => updateTheme({ primary_color: e.target.value })}
                            className="w-16 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={theme.primary_color}
                            onChange={(e) => updateTheme({ primary_color: e.target.value })}
                            className="flex-1 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Secondary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={theme.secondary_color}
                            onChange={(e) => updateTheme({ secondary_color: e.target.value })}
                            className="w-16 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={theme.secondary_color}
                            onChange={(e) => updateTheme({ secondary_color: e.target.value })}
                            className="flex-1 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Accent Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={theme.accent_color}
                            onChange={(e) => updateTheme({ accent_color: e.target.value })}
                            className="w-16 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={theme.accent_color}
                            onChange={(e) => updateTheme({ accent_color: e.target.value })}
                            className="flex-1 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white font-bold mb-2 block">Background Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={theme.background_color}
                            onChange={(e) => updateTheme({ background_color: e.target.value })}
                            className="w-16 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={theme.background_color}
                            onChange={(e) => updateTheme({ background_color: e.target.value })}
                            className="flex-1 bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Background Tab */}
              <TabsContent value="background" className="space-y-6">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Background Image</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Upload Custom Background</Label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-cyan-500 transition-all cursor-pointer bg-slate-800/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="bg-upload"
                        />
                        <label htmlFor="bg-upload" className="cursor-pointer">
                          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-white font-semibold mb-1">
                            {uploading ? 'Uploading...' : 'Click to upload background image'}
                          </p>
                          <p className="text-slate-400 text-sm">PNG, JPG up to 10MB</p>
                        </label>
                      </div>
                    </div>

                    {backgroundImage && (
                      <div className="relative rounded-lg overflow-hidden border-2 border-cyan-500">
                        <img src={backgroundImage} alt="Background" className="w-full h-48 object-cover" />
                        <Button
                          onClick={() => {
                            setBackgroundImage('');
                            saveThemeSettings({ background_image: '' });
                          }}
                          size="sm"
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
                        >
                          Remove
                        </Button>
                      </div>
                    )}

                    <div>
                      <Label className="text-white font-bold mb-2 block">
                        Background Blur: {backgroundBlur}px
                      </Label>
                      <Slider
                        value={[backgroundBlur]}
                        max={20}
                        step={1}
                        onValueChange={([value]) => setBackgroundBlur(value)}
                        className="mb-2"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-2 block">
                        Background Opacity: {Math.round(backgroundOpacity * 100)}%
                      </Label>
                      <Slider
                        value={[backgroundOpacity * 100]}
                        max={100}
                        step={1}
                        onValueChange={([value]) => setBackgroundOpacity(value / 100)}
                        className="mb-2"
                      />
                    </div>

                    <div>
                      <Label className="text-white font-bold mb-3 block">Card Style</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {cardStyles.map((style) => (
                          <Card
                            key={style.value}
                            onClick={() => setCardStyle(style.value)}
                            className={`cursor-pointer transition-all ${
                              cardStyle === style.value
                                ? 'ring-2 ring-cyan-500'
                                : 'hover:ring-2 hover:ring-slate-600'
                            } ${style.preview}`}
                          >
                            <CardContent className="p-4 text-center">
                              <p className="text-white font-semibold">{style.name}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Button onClick={applyBackgroundSettings} className="w-full bg-green-500 hover:bg-green-600">
                      <Save className="w-4 h-4 mr-2" />
                      Save Background Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Typography Tab */}
              <TabsContent value="typography">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Typography Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Font Family</Label>
                      <select
                        value={theme.font_family}
                        onChange={(e) => updateTheme({ font_family: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2"
                      >
                        <option value="Inter">Inter (Default)</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Raleway">Raleway</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-800 rounded-lg" style={{ fontFamily: theme.font_family }}>
                      <p className="text-white text-2xl font-bold mb-2">Heading Example</p>
                      <p className="text-slate-300">This is how your text will look with the selected font family.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Layout Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Border Radius</Label>
                      <select
                        value={theme.border_radius}
                        onChange={(e) => updateTheme({ border_radius: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2"
                      >
                        <option value="0">None (0px)</option>
                        <option value="0.25rem">Small (4px)</option>
                        <option value="0.5rem">Medium (8px)</option>
                        <option value="0.75rem">Large (12px)</option>
                        <option value="1rem">Extra Large (16px)</option>
                        <option value="1.5rem">Rounded (24px)</option>
                        <option value="9999px">Pill (Full Round)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div 
                        className="h-20 bg-cyan-500"
                        style={{ borderRadius: theme.border_radius }}
                      />
                      <div 
                        className="h-20 bg-purple-500"
                        style={{ borderRadius: theme.border_radius }}
                      />
                      <div 
                        className="h-20 bg-pink-500"
                        style={{ borderRadius: theme.border_radius }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Custom CSS Tab */}
              <TabsContent value="css">
                <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white font-bold">Custom CSS</CardTitle>
                      <Button onClick={saveCustomCSS} className="bg-green-500 hover:bg-green-600">
                        <Save className="w-4 h-4 mr-2" />
                        Save CSS
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Textarea
                      value={customCSS}
                      onChange={(e) => setCustomCSS(e.target.value)}
                      placeholder="/* Add your custom CSS here */
.my-profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.custom-text {
  font-family: 'Georgia', serif;
  color: #ffd700;
}"
                      className="bg-slate-800 border-slate-700 text-cyan-400 font-mono text-sm h-96"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button 
                  className="w-full"
                  style={{ 
                    backgroundColor: theme.primary_color,
                    borderRadius: theme.border_radius,
                    fontFamily: theme.font_family
                  }}
                >
                  Primary Button
                </Button>

                <Button 
                  className="w-full"
                  style={{ 
                    backgroundColor: theme.secondary_color,
                    borderRadius: theme.border_radius,
                    fontFamily: theme.font_family
                  }}
                >
                  Secondary Button
                </Button>

                <div 
                  className="p-4 text-white"
                  style={{ 
                    backgroundColor: theme.accent_color,
                    borderRadius: theme.border_radius,
                    fontFamily: theme.font_family
                  }}
                >
                  <h3 className="font-bold mb-2">Accent Card</h3>
                  <p className="text-sm opacity-90">This is how accent colors will look</p>
                </div>

                <div 
                  className="p-4"
                  style={{ 
                    backgroundColor: theme.background_color,
                    borderRadius: theme.border_radius,
                    fontFamily: theme.font_family
                  }}
                >
                  <p className="text-white font-semibold mb-1">Background Color</p>
                  <p className="text-slate-400 text-sm">Main app background</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardHeader className="border-b border-purple-500/30">
                <CardTitle className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pro Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="text-purple-200 text-xs space-y-2">
                  <li>• Upload custom background images</li>
                  <li>• Adjust blur and opacity</li>
                  <li>• Choose from 4 card styles</li>
                  <li>• Add unlimited custom CSS</li>
                  <li>• 8+ color presets included</li>
                  <li>• Changes save automatically</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}