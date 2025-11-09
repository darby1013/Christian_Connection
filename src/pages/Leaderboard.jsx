
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Trophy, TrendingUp, Crown, Medal, Star, Zap,
  MessageSquare, Users, Heart, Award
} from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [user, setUser] = useState(null);

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

  const { data: allPoints = [] } = useQuery({
    queryKey: ['userPoints'],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.list('-total_points', 100);
      return points;
    },
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['usersForLeaderboard'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: allUserBadges = [] } = useQuery({
    queryKey: ['allUserBadges'],
    queryFn: () => base44.entities.UserBadge.list(),
    initialData: [],
  });

  // Merge points with user data
  const leaderboardData = allPoints.map(pointRecord => {
    const userData = users.find(u => u.id === pointRecord.user_id);
    const badgeCount = allUserBadges.filter(ub => ub.user_id === pointRecord.user_id).length;
    return {
      ...pointRecord,
      user_name: userData?.full_name || 'Unknown',
      user_image: userData?.profile_image,
      badge_count: badgeCount
    };
  });

  const getRankIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-slate-300 fill-slate-300" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
    return null;
  };

  const getRankColor = (position) => {
    if (position === 1) return "from-yellow-500 to-amber-500";
    if (position === 2) return "from-slate-300 to-slate-400";
    if (position === 3) return "from-amber-600 to-amber-700";
    return "from-slate-700 to-slate-800";
  };

  const userRank = leaderboardData.findIndex(p => p.user_id === user?.id) + 1;
  const userPoints = leaderboardData.find(p => p.user_id === user?.id);

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Leaderboard</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Celebrate the most engaged members of our community
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                {leaderboardData.length} Ranked
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Live Rankings
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* User's Rank Card */}
        {user && userPoints && (
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-4 border-purple-500/50">
                    <AvatarImage src={userPoints.user_image} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
                      {userPoints.user_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-slate-400 text-sm font-semibold">Your Rank</p>
                    <h3 className="text-white font-black text-2xl">#{userRank}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm font-semibold">Total Points</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
                    {userPoints.total_points}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700 w-full justify-center">
            <TabsTrigger value="overall" className="data-[state=active]:bg-cyan-500">
              <Trophy className="w-4 h-4 mr-2" />
              Overall
            </TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-cyan-500">
              <MessageSquare className="w-4 h-4 mr-2" />
              Top Posters
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-cyan-500">
              <Users className="w-4 h-4 mr-2" />
              Group Leaders
            </TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-cyan-500">
              <Heart className="w-4 h-4 mr-2" />
              Most Engaged
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-cyan-500">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="mt-8">
            {/* Top 3 Podium */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {leaderboardData.slice(0, 3).map((entry, index) => {
                const position = index + 1;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={position === 1 ? 'md:order-2' : position === 2 ? 'md:order-1' : 'md:order-3'}
                  >
                    <Card className={`bg-gradient-to-br ${getRankColor(position)} border-0 ${position === 1 ? 'md:scale-110 md:mt-0 mt-4' : 'md:mt-8'}`}>
                      <CardContent className="p-6 text-center">
                        <div className="mb-4">
                          {getRankIcon(position)}
                        </div>
                        <Avatar className={`w-24 h-24 mx-auto mb-4 border-4 ${position === 1 ? 'border-yellow-300' : 'border-white/30'}`}>
                          <AvatarImage src={entry.user_image} />
                          <AvatarFallback className="bg-white/20 text-white font-bold text-2xl">
                            {entry.user_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-white font-black text-xl mb-2">{entry.user_name}</h3>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Badge className="bg-white/20 text-white capitalize">{entry.rank}</Badge>
                          <Badge className="bg-white/20 text-white">Lvl {entry.level}</Badge>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-white/70 text-sm font-semibold">Total Points</p>
                          <p className="text-3xl font-black text-white">{entry.total_points}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Rest of Leaderboard */}
            <div className="space-y-3">
              {leaderboardData.slice(3).map((entry, index) => {
                const position = index + 4;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className={`bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all ${
                      entry.user_id === user?.id ? 'border-purple-500 border-2' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                            <span className="text-white font-black text-lg">#{position}</span>
                          </div>
                          
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={entry.user_image} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                              {entry.user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h4 className="text-white font-bold">{entry.user_name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-700 capitalize text-xs">{entry.rank}</Badge>
                              <span className="text-slate-400 text-sm">Level {entry.level}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                              {entry.total_points}
                            </p>
                            <p className="text-slate-400 text-xs">points</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-8">
            <div className="space-y-3">
              {leaderboardData
                .sort((a, b) => (b.points_breakdown?.posts || 0) - (a.points_breakdown?.posts || 0))
                .slice(0, 20)
                .map((entry, index) => (
                  <Card key={entry.id} className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-bold">#{index + 1}</span>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.user_image} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                              {entry.user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-bold">{entry.user_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          <span className="text-white font-bold">{entry.points_breakdown?.posts || 0}</span>
                          <span className="text-slate-400 text-sm">points</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="mt-8">
            <div className="space-y-3">
              {leaderboardData
                .sort((a, b) => (b.points_breakdown?.groups_joined || 0) - (a.points_breakdown?.groups_joined || 0))
                .slice(0, 20)
                .map((entry, index) => (
                  <Card key={entry.id} className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-bold">#{index + 1}</span>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.user_image} />
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold">
                              {entry.user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-bold">{entry.user_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-400" />
                          <span className="text-white font-bold">{entry.points_breakdown?.groups_joined || 0}</span>
                          <span className="text-slate-400 text-sm">groups</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="mt-8">
            <div className="space-y-3">
              {leaderboardData
                .sort((a, b) => {
                  const aTotal = (a.points_breakdown?.comments || 0) + (a.points_breakdown?.likes || 0);
                  const bTotal = (b.points_breakdown?.comments || 0) + (b.points_breakdown?.likes || 0);
                  return bTotal - aTotal;
                })
                .slice(0, 20)
                .map((entry, index) => {
                  const engagementScore = (entry.points_breakdown?.comments || 0) + (entry.points_breakdown?.likes || 0);
                  return (
                    <Card key={entry.id} className="bg-[#1a1f3a] border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-bold">#{index + 1}</span>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={entry.user_image} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold">
                                {entry.user_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-bold">{entry.user_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-400" />
                            <span className="text-white font-bold">{engagementScore}</span>
                            <span className="text-slate-400 text-sm">actions</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-8">
            {/* Top Badge Collectors */}
            <div className="mb-8">
              <h3 className="text-white font-bold text-xl mb-4">Top Badge Collectors</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {leaderboardData
                  .sort((a, b) => b.badge_count - a.badge_count)
                  .slice(0, 3)
                  .map((entry, index) => {
                    const position = index + 1;
                    return (
                      <Card key={entry.id} className={`bg-gradient-to-br ${getRankColor(position)} border-0`}>
                        <CardContent className="p-6 text-center">
                          <div className="mb-4">
                            {getRankIcon(position)}
                          </div>
                          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white/30">
                            <AvatarImage src={entry.user_image} />
                            <AvatarFallback className="bg-white/20 text-white font-bold text-xl">
                              {entry.user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="text-white font-black text-lg mb-2">{entry.user_name}</h3>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-white/70 text-sm font-semibold">Badges Earned</p>
                            <p className="text-3xl font-black text-white">{entry.badge_count}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Full Badge Leaderboard */}
            <div className="space-y-3">
              {leaderboardData
                .sort((a, b) => b.badge_count - a.badge_count)
                .slice(3)
                .map((entry, index) => {
                  const position = index + 4;
                  return (
                    <Card key={entry.id} className={`bg-[#1a1f3a] border-slate-700 hover:border-amber-500 transition-all ${
                      entry.user_id === user?.id ? 'border-purple-500 border-2' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                            <span className="text-white font-black text-lg">#{position}</span>
                          </div>
                          
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={entry.user_image} />
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold">
                              {entry.user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h4 className="text-white font-bold">{entry.user_name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-700 capitalize text-xs">{entry.rank}</Badge>
                              <span className="text-slate-400 text-sm">Level {entry.level}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <Award className="w-5 h-5 text-amber-400" />
                              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                {entry.badge_count}
                              </p>
                            </div>
                            <p className="text-slate-400 text-xs">badges</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
