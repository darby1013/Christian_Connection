import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Award, Star, Crown, Zap, Heart, MessageSquare,
  Users, TrendingUp, Trophy
} from "lucide-react";
import { motion } from "framer-motion";

export default function UserBadges({ userId }) {
  const { data: userBadges = [] } = useQuery({
    queryKey: ['userBadges', userId],
    queryFn: () => base44.entities.UserBadge.filter({ user_id: userId, is_displayed: true }, '-earned_date'),
    initialData: [],
    enabled: !!userId,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: () => base44.entities.Badge.filter({ is_active: true }),
    initialData: [],
  });

  const getBadgeIcon = (category) => {
    const icons = {
      engagement: Heart,
      content: MessageSquare,
      social: Users,
      milestone: Star,
      achievement: Trophy
    };
    const Icon = icons[category] || Award;
    return Icon;
  };

  const getBadgeColor = (color) => {
    const colors = {
      blue: "from-blue-500 to-cyan-500",
      purple: "from-purple-500 to-pink-500",
      green: "from-green-500 to-emerald-500",
      amber: "from-amber-500 to-orange-500",
      red: "from-red-500 to-rose-500",
      pink: "from-pink-500 to-fuchsia-500"
    };
    return colors[color] || colors.blue;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: "bg-slate-600",
      rare: "bg-blue-500",
      epic: "bg-purple-500",
      legendary: "bg-amber-500"
    };
    return colors[rarity] || colors.common;
  };

  if (userBadges.length === 0) {
    return (
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardContent className="p-8 text-center">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No badges earned yet</p>
          <p className="text-slate-500 text-sm">Start engaging to earn your first badge!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <div>
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Earned Badges ({userBadges.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userBadges.map((userBadge, index) => {
            const badgeData = allBadges.find(b => b.id === userBadge.badge_id);
            const Icon = getBadgeIcon(badgeData?.category || userBadge.badge_color);
            
            return (
              <motion.div
                key={userBadge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-gradient-to-br ${getBadgeColor(userBadge.badge_color)} border-0 hover:scale-105 transition-transform cursor-pointer`}>
                  <CardContent className="p-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-3xl">{userBadge.badge_icon}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">{userBadge.badge_name}</h4>
                    {badgeData && (
                      <Badge className={`${getRarityColor(badgeData.rarity)} text-xs capitalize`}>
                        {badgeData.rarity}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Towards Next Badges */}
      {allBadges.length > userBadges.length && (
        <div>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            In Progress
          </h3>
          <div className="space-y-3">
            {allBadges
              .filter(badge => !userBadges.some(ub => ub.badge_id === badge.id))
              .slice(0, 3)
              .map((badge) => {
                const Icon = getBadgeIcon(badge.category);
                const progress = Math.floor(Math.random() * 80); // In production, calculate real progress
                
                return (
                  <Card key={badge.id} className="bg-[#1a1f3a] border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getBadgeColor(badge.color)} flex items-center justify-center`}>
                          <span className="text-2xl">{badge.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-sm">{badge.name}</h4>
                          <p className="text-slate-400 text-xs">{badge.description}</p>
                        </div>
                        <Badge className={getRarityColor(badge.rarity)} variant="outline">
                          {badge.rarity}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-cyan-400 font-bold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-slate-500">
                          {badge.requirement_count - Math.floor(badge.requirement_count * progress / 100)} more {badge.requirement_type} needed
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}