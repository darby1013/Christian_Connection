import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy, TrendingUp, Star, Award, Crown, Medal, Target,
  Zap, Flame, Users, Activity
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Leaderboard() {
  const { data: userPoints = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.UserPoints.list('-total_points', 50),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const getUserData = (userId) => {
    return users.find(u => u.id === userId);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-slate-500 font-bold">#{rank}</span>;
    }
  };

  const getLevelColor = (level) => {
    if (level >= 20) return 'from-purple-600 to-pink-600';
    if (level >= 15) return 'from-cyan-600 to-blue-600';
    if (level >= 10) return 'from-green-600 to-emerald-600';
    if (level >= 5) return 'from-amber-600 to-orange-600';
    return 'from-slate-600 to-slate-700';
  };

  const topEngagers = [...userPoints]
    .sort((a, b) => (b.points_breakdown?.content_created || 0) - (a.points_breakdown?.content_created || 0))
    .slice(0, 10);

  const topSocial = [...userPoints]
    .sort((a, b) => {
      const aTotal = (b.points_breakdown?.comments || 0) + (b.points_breakdown?.likes || 0);
      const bTotal = (a.points_breakdown?.comments || 0) + (a.points_breakdown?.likes || 0);
      return bTotal - aTotal;
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-black text-white">Leaderboard</h1>
          </div>
          <p className="text-xl text-slate-300">
            Celebrate our most active community members
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {userPoints.slice(0, 3).map((userPoint, idx) => {
            const user = getUserData(userPoint.user_id);
            const rank = idx + 1;
            
            return (
              <Card 
                key={userPoint.id} 
                className={`bg-[#1a1f3a] border-slate-700 ${rank === 1 ? 'md:order-2 transform md:scale-110 z-10' : rank === 2 ? 'md:order-1' : 'md:order-3'}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    {getRankIcon(rank)}
                  </div>
                  <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-cyan-500">
                    <AvatarFallback className={`bg-gradient-to-br ${getLevelColor(userPoint.level)} text-white text-2xl font-bold`}>
                      {user?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-white font-bold text-xl mb-2">{user?.full_name || 'Anonymous'}</h3>
                  <Badge className={`bg-gradient-to-r ${getLevelColor(userPoint.level)} mb-3`}>
                    Level {userPoint.level}
                  </Badge>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-3xl font-black text-white">{userPoint.total_points.toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 text-sm capitalize">{userPoint.rank}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="bg-[#1a1f3a] border border-slate-700 mb-6">
            <TabsTrigger value="overall" className="data-[state=active]:bg-cyan-500">
              <Trophy className="w-4 h-4 mr-2" />
              Overall
            </TabsTrigger>
            <TabsTrigger value="creators" className="data-[state=active]:bg-cyan-500">
              <Star className="w-4 h-4 mr-2" />
              Top Creators
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-cyan-500">
              <Users className="w-4 h-4 mr-2" />
              Most Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {userPoints.map((userPoint, idx) => {
                    const user = getUserData(userPoint.user_id);
                    const rank = idx + 1;
                    
                    return (
                      <div 
                        key={userPoint.id}
                        className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="w-12 text-center">
                          {rank <= 3 ? getRankIcon(rank) : <span className="text-slate-500 font-bold">#{rank}</span>}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-cyan-500/30">
                          <AvatarFallback className={`bg-gradient-to-br ${getLevelColor(userPoint.level)} text-white font-bold`}>
                            {user?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{user?.full_name || 'Anonymous'}</h4>
                          <p className="text-slate-400 text-sm capitalize">{userPoint.rank} • Level {userPoint.level}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-black text-lg">{userPoint.total_points.toLocaleString()}</span>
                          </div>
                          <p className="text-slate-400 text-xs">points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creators">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {topEngagers.map((userPoint, idx) => {
                    const user = getUserData(userPoint.user_id);
                    const contentPoints = userPoint.points_breakdown?.content_created || 0;
                    
                    return (
                      <div 
                        key={userPoint.id}
                        className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-lg"
                      >
                        <div className="w-12 text-center">
                          {idx < 3 ? getRankIcon(idx + 1) : <span className="text-slate-500 font-bold">#{idx + 1}</span>}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-purple-500/30">
                          <AvatarFallback className={`bg-gradient-to-br ${getLevelColor(userPoint.level)} text-white font-bold`}>
                            {user?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{user?.full_name || 'Anonymous'}</h4>
                          <p className="text-slate-400 text-sm">Content Creator</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-4 h-4 text-purple-400" />
                            <span className="text-white font-black text-lg">{contentPoints.toLocaleString()}</span>
                          </div>
                          <p className="text-slate-400 text-xs">creation points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {topSocial.map((userPoint, idx) => {
                    const user = getUserData(userPoint.user_id);
                    const socialPoints = (userPoint.points_breakdown?.comments || 0) + (userPoint.points_breakdown?.likes || 0);
                    
                    return (
                      <div 
                        key={userPoint.id}
                        className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-lg"
                      >
                        <div className="w-12 text-center">
                          {idx < 3 ? getRankIcon(idx + 1) : <span className="text-slate-500 font-bold">#{idx + 1}</span>}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-pink-500/30">
                          <AvatarFallback className={`bg-gradient-to-br ${getLevelColor(userPoint.level)} text-white font-bold`}>
                            {user?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{user?.full_name || 'Anonymous'}</h4>
                          <p className="text-slate-400 text-sm">Social Butterfly</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Users className="w-4 h-4 text-pink-400" />
                            <span className="text-white font-black text-lg">{socialPoints.toLocaleString()}</span>
                          </div>
                          <p className="text-slate-400 text-xs">social points</p>
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