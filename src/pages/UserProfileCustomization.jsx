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
import {
  Palette, Eye, Save, RotateCcw, Code, Sparkles,
  Sun, Moon, Type, Square
} from "lucide-react";
import { useTheme } from "../components/theme/ThemeProvider";

export default function UserProfileCustomization() {
  const [user, setUser] = useState(null);
  const { theme, updateTheme, toggleMode } = useTheme();
  const [customCSS, setCustomCSS] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load custom CSS
        const userThemes = await base44.entities.UserTheme.filter({ user_id: currentUser.id });
        if (userThemes.length > 0 && userThemes[0].custom_css) {
          setCustomCSS(userThemes[0].custom_css);
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const saveCustomCSS = async () => {
    if (!user) return;
    
    try {
      const userThemes = await base44.entities.UserTheme.filter({ user_id: user.id });
      if (userThemes.length > 0) {
        await base44.entities.UserTheme.update(userThemes[0].id, { custom_css: customCSS });
      } else {
        await base44.entities.UserTheme.create({
          user_id: user.id,
          custom_css: customCSS,
        });
      }
      
      // Apply custom CSS
      applyCustomCSS();
      alert('✅ Custom CSS saved!');
    } catch (error) {
      console.error('Failed to save CSS:', error);
      alert('❌ Failed to save CSS');
    }
  };

  const applyCustomCSS = () => {
    // Remove existing custom CSS
    const existingStyle = document.getElementById('user-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new custom CSS
    if (customCSS) {
      const style = document.createElement('style');
      style.id = 'user-custom-css';
      style.textContent = customCSS;
      document.head.appendChild(style);
    }
  };

  const colorPresets = [
    { name: 'Glory Wave', primary: '#22d3ee', secondary: '#a855f7', accent: '#ec4899', bg: '#0a0e27' },
    { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#06b6d4', accent: '#0284c7', bg: '#0c4a6e' },
    { name: 'Sunset', primary: '#f59e0b', secondary: '#ef4444', accent: '#ec4899', bg: '#1e1b4b' },
    { name: 'Forest', primary: '#10b981', secondary: '#059669', accent: '#84cc16', bg: '#064e3b' },
    { name: 'Purple Rain', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ec4899', bg: '#1e1b4b' },
    { name: 'Crimson', primary: '#dc2626', secondary: '#f97316', accent: '#fbbf24', bg: '#450a0a' },
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
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              <Palette className="w-8 h-8 text-cyan-400" />
              Profile Customization
            </h2>
            <p className="text-slate-400 font-semibold">Personalize your profile with colors and custom styles</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleMode}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              {theme.mode === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme.mode === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
            <Button onClick={resetTheme} variant="outline" className="border-slate-700 text-slate-300">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customization Tools */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="colors">
              <TabsList className="bg-[#1a1f3a] border border-slate-700">
                <TabsTrigger value="colors" className="data-[state=active]:bg-cyan-500">
                  <Palette className="w-4 h-4 mr-2" />
                  Colors
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
                {/* Color Presets */}
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Color Scheme Presets</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      {colorPresets.map((preset) => (
                        <Card
                          key={preset.name}
                          onClick={() => updateTheme({
                            primary_color: preset.primary,
                            secondary_color: preset.secondary,
                            accent_color: preset.accent,
                            background_color: preset.bg,
                          })}
                          className="cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all bg-slate-900/50 border-slate-700"
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-2 mb-3">
                              <div className="w-8 h-8 rounded" style={{ backgroundColor: preset.primary }} />
                              <div className="w-8 h-8 rounded" style={{ backgroundColor: preset.secondary }} />
                              <div className="w-8 h-8 rounded" style={{ backgroundColor: preset.accent }} />
                              <div className="w-8 h-8 rounded" style={{ backgroundColor: preset.bg }} />
                            </div>
                            <p className="text-white font-semibold text-sm">{preset.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Colors */}
                <Card className="bg-[#1a1f3a] border-slate-700">
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
                            className="flex-1 bg-slate-900 border-slate-700 text-white"
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
                            className="flex-1 bg-slate-900 border-slate-700 text-white"
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
                            className="flex-1 bg-slate-900 border-slate-700 text-white"
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
                            className="flex-1 bg-slate-900 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Typography Tab */}
              <TabsContent value="typography">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Typography Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Font Family</Label>
                      <select
                        value={theme.font_family}
                        onChange={(e) => updateTheme({ font_family: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                      >
                        <option value="Inter">Inter (Default)</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-900 rounded-lg" style={{ fontFamily: theme.font_family }}>
                      <p className="text-white text-2xl font-bold mb-2">Heading Example</p>
                      <p className="text-slate-300">This is how your text will look with the selected font family.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout">
                <Card className="bg-[#1a1f3a] border-slate-700">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white font-bold">Layout Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-white font-bold mb-2 block">Border Radius</Label>
                      <select
                        value={theme.border_radius}
                        onChange={(e) => updateTheme({ border_radius: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                      >
                        <option value="0">None (0px)</option>
                        <option value="0.25rem">Small (4px)</option>
                        <option value="0.5rem">Medium (8px)</option>
                        <option value="0.75rem">Large (12px)</option>
                        <option value="1rem">Extra Large (16px)</option>
                        <option value="1.5rem">Rounded (24px)</option>
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
                <Card className="bg-[#1a1f3a] border-slate-700">
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
.my-profile {
  background: linear-gradient(to right, #667eea, #764ba2);
}

.custom-button {
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}"
                      className="bg-slate-900 border-slate-700 text-cyan-400 font-mono text-sm h-96"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Primary Button */}
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

                {/* Secondary Button */}
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

                {/* Accent Card */}
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

                {/* Background Preview */}
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

            {/* Tips */}
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardHeader className="border-b border-blue-500/30">
                <CardTitle className="text-blue-300 font-bold text-sm">💡 Customization Tips</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="text-blue-200 text-xs space-y-2">
                  <li>• Use color presets for quick themes</li>
                  <li>• Custom CSS applies to your profile only</li>
                  <li>• Changes are saved automatically</li>
                  <li>• Toggle dark/light mode anytime</li>
                  <li>• Reset to defaults if needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}