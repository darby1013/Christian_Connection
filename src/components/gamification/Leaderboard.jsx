import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Star, Zap, Users } from "lucide-react";
import MembershipBadge from "../ui/MembershipBadge";

export default function Leaderboard() {
  const { data: topUsers = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const points = await base44.entities.UserPoints.list('-total_points', 50);
      return points;
    },
    initialData: [],
  });

  const getRankIcon = (index) => {
    if (index === 0) return { icon: "🥇", color: "from-amber-500 to-yellow-500" };
    if (index === 1) return { icon: "🥈", color: "from-slate-400 to-slate-300" };
    if (index === 2) return { icon: "🥉", color: "from-orange-600 to-amber-700" };
    return { icon: index + 1, color: "from-slate-700 to-slate-600" };
  };

  const getRankBadgeColor = (rank) => {
    const colorMap = {
      "Legend": "bg-gradient-to-r from-purple-600 to-pink-600",
      "Champion": "bg-gradient-to-r from-amber-500 to-orange-600",
      "Contributor": "bg-gradient-to-r from-blue-500 to-cyan-500",
      "Regular": "bg-gradient-to-r from-green-500 to-emerald-500",
      "Member": "bg-gradient-to-r from-slate-500 to-slate-400",
      "Newcomer": "bg-gradient-to-r from-gray-600 to-gray-500"
    };
    return colorMap[rank] || colorMap["Newcomer"];
  };

  return (
    <Card className="bg-[#1a1f3a] border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white font-black text-2xl flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Community Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="w-full bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="points" className="flex-1 data-[state=active]:bg-cyan-500">
              <TrendingUp className="w-4 h-4 mr-2" />
              Points
            </TabsTrigger>
            <TabsTrigger value="level" className="flex-1 data-[state=active]:bg-cyan-500">
              <Star className="w-4 h-4 mr-2" />
              Level
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-cyan-500">
              <Zap className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="mt-6 space-y-2">
            {topUsers.map((user, index) => {
              const rankInfo = getRankIcon(index);
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-slate-800/50 ${
                    index < 3 ? 'bg-slate-800/30 border-2 border-amber-500/20' : 'bg-slate-900/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankInfo.color} flex items-center justify-center font-black text-white shadow-lg flex-shrink-0`}>
                    {typeof rankInfo.icon === 'string' ? rankInfo.icon : rankInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-bold truncate">{user.user_name}</h4>
                      <Badge className={`${getRankBadgeColor(user.rank)} text-white text-xs`}>
                        {user.rank}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Level {user.level}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {user.activity_breakdown?.views || 0} views
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-cyan-400">{user.total_points.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="level" className="mt-6 space-y-2">
            {[...topUsers].sort((a, b) => b.level - a.level).map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-slate-500">#{index + 1}</span>
                  <div>
                    <h4 className="text-white font-bold">{user.user_name}</h4>
                    <Badge className={`${getRankBadgeColor(user.rank)} text-white text-xs`}>
                      {user.rank}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-purple-400">Level {user.level}</p>
                  <p className="text-xs text-slate-400">{user.total_points} pts</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-2">
            {[...topUsers]
              .sort((a, b) => (b.activity_breakdown?.views || 0) - (a.activity_breakdown?.views || 0))
              .slice(0, 20)
              .map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-slate-500">#{index + 1}</span>
                    <div>
                      <h4 className="text-white font-bold">{user.user_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{user.activity_breakdown?.comments || 0} comments</span>
                        <span>•</span>
                        <span>{user.activity_breakdown?.likes || 0} likes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-green-400">
                      {user.activity_breakdown?.views || 0}
                    </p>
                    <p className="text-xs text-slate-400">actions</p>
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}