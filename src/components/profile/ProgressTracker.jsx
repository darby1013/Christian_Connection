import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgressTracker({ userId }) {
  const { data: userPoints } = useQuery({
    queryKey: ['userPoints', userId],
    queryFn: async () => {
      const result = await base44.entities.UserPoints.filter({ user_id: userId });
      return result[0];
    },
    enabled: !!userId,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', userId],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: userId }),
    initialData: [],
    enabled: !!userId,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
    initialData: [],
  });

  if (!userPoints) {
    return null;
  }

  const currentLevel = userPoints.level || 1;
  const currentPoints = userPoints.total_points || 0;
  const nextLevelPoints = userPoints.next_level_points || (currentLevel * 1000);
  const progressPercent = (currentPoints / nextLevelPoints) * 100;

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  const nextBadges = allBadges
    .filter(badge => !earnedBadgeIds.includes(badge.id))
    .slice(0, 3);

  const getRankColor = (rank) => {
    const colors = {
      newcomer: "from-slate-500 to-slate-600",
      member: "from-blue-500 to-cyan-500",
      contributor: "from-purple-500 to-pink-500",
      champion: "from-amber-500 to-orange-500",
      legend: "from-red-500 to-rose-500"
    };
    return colors[rank] || colors.newcomer;
  };

  return (
    <div className="space-y-4">
      {/* Level Progress */}
      <Card className={`bg-gradient-to-r ${getRankColor(userPoints.rank)} border-0`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-semibold mb-1">Current Level</p>
              <p className="text-4xl font-black text-white">{currentLevel}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white capitalize mb-2">
                {userPoints.rank}
              </Badge>
              <p className="text-white/80 text-sm">{currentPoints} points</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Progress to Level {currentLevel + 1}</span>
              <span className="text-white font-bold">{Math.floor(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3 bg-white/20" />
            <p className="text-white/70 text-xs">
              {nextLevelPoints - currentPoints} points to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Points Breakdown */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-6">
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Points Breakdown
          </h4>
          <div className="space-y-3">
            {userPoints.points_breakdown && Object.entries(userPoints.points_breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-slate-400 text-sm capitalize">{key.replace('_', ' ')}</span>
                <Badge className="bg-cyan-500">{value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Badges */}
      {nextBadges.length > 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-6">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Next Badges to Earn
            </h4>
            <div className="space-y-3">
              {nextBadges.map((badge, index) => {
                const progress = Math.floor(Math.random() * 80); // Replace with real progress calculation
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-slate-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xl">{badge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{badge.name}</p>
                        <p className="text-slate-400 text-xs">{badge.description}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-slate-500">
                        {badge.requirement_count - Math.floor(badge.requirement_count * progress / 100)} more {badge.requirement_type} needed
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}