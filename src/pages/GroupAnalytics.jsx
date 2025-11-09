import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TrendingUp, Users, MessageSquare, Calendar, FileText,
  BarChart3, PieChart, Activity, Hash, Star
} from "lucide-react";
import { format } from "date-fns";

export default function GroupAnalytics() {
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  // Get groups created by current user
  const { data: myGroups = [] } = useQuery({
    queryKey: ['myCreatedGroups', user?.id],
    queryFn: () => base44.entities.Group.filter({ creator_id: user.id }),
    initialData: [],
    enabled: !!user,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['groupMembers', selectedGroup],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: selectedGroup }),
    initialData: [],
    enabled: !!selectedGroup,
  });

  const { data: groupPosts = [] } = useQuery({
    queryKey: ['groupPosts', selectedGroup],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: selectedGroup }),
    initialData: [],
    enabled: !!selectedGroup,
  });

  const { data: groupEvents = [] } = useQuery({
    queryKey: ['groupEvents', selectedGroup],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: selectedGroup }),
    initialData: [],
    enabled: !!selectedGroup,
  });

  const { data: groupFiles = [] } = useQuery({
    queryKey: ['groupFiles', selectedGroup],
    queryFn: () => base44.entities.GroupFile.filter({ group_id: selectedGroup }),
    initialData: [],
    enabled: !!selectedGroup,
  });

  const { data: groupPolls = [] } = useQuery({
    queryKey: ['groupPolls', selectedGroup],
    queryFn: () => base44.entities.GroupPoll.filter({ group_id: selectedGroup }),
    initialData: [],
    enabled: !!selectedGroup,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 p-8">
          <p className="text-white">Please sign in to view group analytics</p>
        </Card>
      </div>
    );
  }

  if (myGroups.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-[#1a1f3a] border-slate-700 p-8 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-xl mb-2">No Groups Created</h3>
          <p className="text-slate-400">Create a group to see analytics</p>
        </Card>
      </div>
    );
  }

  const group = myGroups.find(g => g.id === selectedGroup) || myGroups[0];
  const activeMembers = groupMembers.filter(m => m.is_active).length;
  const growthRate = ((groupMembers.length / Math.max(group.member_count || 1, 1)) * 100 - 100).toFixed(1);
  const engagementRate = ((activeMembers / Math.max(groupMembers.length, 1)) * 100).toFixed(1);
  
  // Calculate total event attendance
  const totalAttendees = groupEvents.reduce((sum, event) => 
    sum + (event.rsvp_yes?.length || 0), 0
  );

  // Extract topics from posts
  const topicCounts = {};
  groupPosts.forEach(post => {
    const words = (post.content || '').toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 5) {
        topicCounts[word] = (topicCounts[word] || 0) + 1;
      }
    });
  });
  
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Group Analytics</h1>
            <p className="text-lg text-slate-400">Track your group's growth and engagement</p>
          </div>
        </div>

        {/* Group Selector */}
        <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
          <CardContent className="p-6">
            <p className="text-white font-bold mb-3">Select Group</p>
            <div className="grid md:grid-cols-3 gap-3">
              {myGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    (selectedGroup || myGroups[0].id) === g.id
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <p className="text-white font-bold mb-1">{g.name}</p>
                  <p className="text-slate-400 text-sm">{g.member_count || 0} members</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-semibold mb-1">Total Members</p>
                  <p className="text-3xl font-black text-white">{groupMembers.length}</p>
                  <Badge className={`mt-2 ${parseFloat(growthRate) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {growthRate}%
                  </Badge>
                </div>
                <Users className="w-12 h-12 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-semibold mb-1">Active Members</p>
                  <p className="text-3xl font-black text-white">{activeMembers}</p>
                  <Badge className="mt-2 bg-purple-500">
                    {engagementRate}% rate
                  </Badge>
                </div>
                <Activity className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-semibold mb-1">Total Posts</p>
                  <p className="text-3xl font-black text-white">{groupPosts.length}</p>
                  <p className="text-slate-400 text-sm mt-2">
                    {(groupPosts.length / Math.max(groupMembers.length, 1)).toFixed(1)} per member
                  </p>
                </div>
                <MessageSquare className="w-12 h-12 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-semibold mb-1">Events Hosted</p>
                  <p className="text-3xl font-black text-white">{groupEvents.length}</p>
                  <p className="text-slate-400 text-sm mt-2">
                    {totalAttendees} attendees
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500">Overview</TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-cyan-500">Members</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-cyan-500">Content</TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-cyan-500">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Growth Chart Placeholder */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Growth Overview
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Member Growth</p>
                    <p className="text-2xl font-black text-white">{growthRate}%</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Engagement Rate</p>
                    <p className="text-2xl font-black text-white">{engagementRate}%</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Avg Posts/Day</p>
                    <p className="text-2xl font-black text-white">
                      {(groupPosts.length / 30).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-purple-400" />
                  Popular Discussion Topics
                </h3>
                <div className="space-y-2">
                  {topTopics.map(([topic, count], index) => (
                    <div key={topic} className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold w-6">#{index + 1}</span>
                      <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold capitalize">{topic}</span>
                          <Badge className="bg-purple-500">{count} mentions</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-4">Member Activity</h3>
                <div className="space-y-3">
                  {groupMembers.slice(0, 10).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-bold">{member.user_name?.[0]}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{member.user_name}</p>
                          <p className="text-slate-400 text-sm capitalize">{member.role}</p>
                        </div>
                      </div>
                      <Badge className={member.is_active ? 'bg-green-500' : 'bg-slate-600'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-semibold mb-1">Posts</p>
                  <p className="text-4xl font-black text-white">{groupPosts.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-semibold mb-1">Files Shared</p>
                  <p className="text-4xl font-black text-white">{groupFiles.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <PieChart className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-semibold mb-1">Polls Created</p>
                  <p className="text-4xl font-black text-white">{groupPolls.length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-lg mb-4">Event Performance</h3>
                <div className="space-y-3">
                  {groupEvents.map((event) => {
                    const yesCount = event.rsvp_yes?.length || 0;
                    const maybeCount = event.rsvp_maybe?.length || 0;
                    const totalResponses = yesCount + maybeCount + (event.rsvp_no?.length || 0);
                    
                    return (
                      <div key={event.id} className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-white font-bold">{event.event_title}</h4>
                            <p className="text-slate-400 text-sm">
                              {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className="bg-green-500">{yesCount} attending</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                          <div>
                            <p className="text-green-400 font-bold">{yesCount}</p>
                            <p className="text-slate-400">Yes</p>
                          </div>
                          <div>
                            <p className="text-amber-400 font-bold">{maybeCount}</p>
                            <p className="text-slate-400">Maybe</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold">{totalResponses}</p>
                            <p className="text-slate-400">Total</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}