import React from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp } from "lucide-react";

export default function TipTicker({ tips }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-y border-amber-500/30 py-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <span className="text-white font-bold text-sm">Recent Support</span>
      </div>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="flex gap-6"
      >
        {[...tips, ...tips].map((tip, idx) => (
          <div
            key={`${tip.id}-${idx}`}
            className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full whitespace-nowrap"
          >
            <Heart className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-white font-bold text-sm">
              {tip.is_anonymous ? "Anonymous" : tip.tipper_name}
            </span>
            <span className="text-amber-400 font-black text-sm">${tip.amount}</span>
            {tip.message && (
              <span className="text-slate-300 text-sm italic max-w-xs truncate">
                "{tip.message}"
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}