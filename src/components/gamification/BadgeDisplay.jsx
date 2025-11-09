import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Zap, Award, Crown, Heart } from "lucide-react";

export default function BadgeDisplay({ badges, size = "default", limit = null }) {
  const displayBadges = limit ? badges.slice(0, limit) : badges;

  const getBadgeIcon = (icon) => {
    const iconMap = {
      "🏆": Trophy,
      "⭐": Star,
      "⚡": Zap,
      "🏅": Award,
      "👑": Crown,
      "❤️": Heart
    };
    return iconMap[icon] || Trophy;
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: "from-blue-500 to-cyan-500",
      purple: "from-purple-500 to-pink-500",
      green: "from-green-500 to-emerald-500",
      amber: "from-amber-500 to-orange-500",
      red: "from-red-500 to-rose-500",
      pink: "from-pink-500 to-fuchsia-500"
    };
    return colorMap[color] || colorMap.blue;
  };

  if (!badges || badges.length === 0) return null;

  if (size === "compact") {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayBadges.map((badge, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColorClass(badge.badge_color)} flex items-center justify-center text-white shadow-lg`}
            title={badge.badge_name}
          >
            <span className="text-xs">{badge.badge_icon}</span>
          </div>
        ))}
        {limit && badges.length > limit && (
          <Badge className="bg-slate-700 text-xs">+{badges.length - limit}</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {displayBadges.map((badge, idx) => {
        const IconComponent = getBadgeIcon(badge.badge_icon);
        return (
          <Card
            key={idx}
            className={`bg-gradient-to-br ${getColorClass(badge.badge_color)} border-0 overflow-hidden group hover:scale-105 transition-transform`}
          >
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-bold text-sm mb-1">{badge.badge_name}</h4>
              {badge.level > 1 && (
                <Badge className="bg-white/30 text-white text-xs">Level {badge.level}</Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}