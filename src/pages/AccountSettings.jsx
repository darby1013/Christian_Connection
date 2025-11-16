import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfileForm({
          full_name: currentUser.full_name,
          email: currentUser.email
        });
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    fetchUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      alert('✅ Profile updated successfully!');
      queryClient.invalidateQueries(['user']);
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0e27] py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('CustomerAccount')}>
            <Button variant="outline" className="border-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-4xl font-black text-white">Account Settings</h1>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-cyan-400" />
                <h2 className="text-white font-black text-xl">Profile Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Full Name</Label>
                  <Input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="bg-slate-900 border-slate-700 text-white opacity-50"
                  />
                  <p className="text-slate-400 text-sm mt-1">Email cannot be changed</p>
                </div>
                <Button 
                  onClick={() => updateProfileMutation.mutate(profileForm)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 font-bold"
                >
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-cyan-400" />
                <h2 className="text-white font-black text-xl">Email Preferences</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-bold">Order Updates</p>
                    <p className="text-slate-400 text-sm">Receive notifications about your orders</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-bold">Promotional Emails</p>
                    <p className="text-slate-400 text-sm">Get updates on sales and new products</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-bold">Newsletter</p>
                    <p className="text-slate-400 text-sm">Weekly newsletter with tips and content</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-cyan-400" />
                <h2 className="text-white font-black text-xl">Security</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-white font-bold mb-2">Password</p>
                  <p className="text-slate-400 text-sm mb-3">Last changed 3 months ago</p>
                  <Button variant="outline" className="border-slate-600">
                    Change Password
                  </Button>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-white font-bold mb-2">Two-Factor Authentication</p>
                  <p className="text-slate-400 text-sm mb-3">Add an extra layer of security</p>
                  <Button variant="outline" className="border-slate-600">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}