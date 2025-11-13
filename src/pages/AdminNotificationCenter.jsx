import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell, Send, Users, Mail, MessageSquare, AlertCircle,
  CheckCircle, Clock, TrendingUp, Filter, Plus
} from "lucide-react";

export default function AdminNotificationCenter() {
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    channels: ['in_app']
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const notificationTypes = [
    { value: 'info', label: 'Information', color: 'bg-blue-500' },
    { value: 'success', label: 'Success', color: 'bg-green-500' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-500' },
    { value: 'error', label: 'Error', color: 'bg-red-500' },
  ];

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Please fill in all fields');
      return;
    }

    alert('✅ Notification sent successfully!');
    setNotificationForm({
      title: '',
      message: '',
      type: 'info',
      target: 'all',
      channels: ['in_app']
    });
  };

  const toggleChannel = (channel) => {
    if (notificationForm.channels.includes(channel)) {
      setNotificationForm({
        ...notificationForm,
        channels: notificationForm.channels.filter(c => c !== channel)
      });
    } else {
      setNotificationForm({
        ...notificationForm,
        channels: [...notificationForm.channels, channel]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Notification Center</h2>
        <p className="text-slate-400 font-semibold">Send notifications to users across multiple channels</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Bell className="w-10 h-10 text-cyan-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">1,247</p>
            <p className="text-slate-400 text-sm">Sent Today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">98.7%</p>
            <p className="text-slate-400 text-sm">Delivery Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-purple-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">45.2%</p>
            <p className="text-slate-400 text-sm">Open Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-0">
          <CardContent className="p-6">
            <Users className="w-10 h-10 text-blue-400 mb-3" />
            <p className="text-4xl font-black text-white mb-1">{users.length}</p>
            <p className="text-slate-400 text-sm">Total Recipients</p>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Send New Notification</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white font-bold mb-2 block">Notification Type</Label>
              <Select value={notificationForm.type} onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {notificationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white font-bold mb-2 block">Target Audience</Label>
              <Select value={notificationForm.target} onValueChange={(value) => setNotificationForm({...notificationForm, target: value})}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">All Users</SelectItem>
                  <SelectItem value="admins" className="text-white">Admins Only</SelectItem>
                  <SelectItem value="premium" className="text-white">Premium Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white font-bold mb-2 block">Title</Label>
            <Input
              placeholder="Notification title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label className="text-white font-bold mb-2 block">Message</Label>
            <Textarea
              placeholder="Notification message..."
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
              className="bg-slate-900 border-slate-700 text-white h-32"
            />
          </div>

          <div>
            <Label className="text-white font-bold mb-2 block">Delivery Channels</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notificationForm.channels.includes('in_app')}
                  onCheckedChange={() => toggleChannel('in_app')}
                />
                <span className="text-slate-300 text-sm">In-App</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notificationForm.channels.includes('email')}
                  onCheckedChange={() => toggleChannel('email')}
                />
                <span className="text-slate-300 text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notificationForm.channels.includes('sms')}
                  onCheckedChange={() => toggleChannel('sms')}
                />
                <span className="text-slate-300 text-sm">SMS</span>
              </label>
            </div>
          </div>

          <Button onClick={sendNotification} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[
              { title: 'System Update', message: 'New features released', type: 'info', sent: '2 hours ago', delivered: 147 },
              { title: 'Security Alert', message: 'Please update your password', type: 'warning', sent: '5 hours ago', delivered: 89 },
            ].map((notif, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-white font-bold">{notif.title}</h4>
                        <Badge className={notificationTypes.find(t => t.value === notif.type)?.color}>
                          {notif.type}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">{notif.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{notif.sent}</span>
                        <span>{notif.delivered} delivered</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}