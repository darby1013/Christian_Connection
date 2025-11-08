import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video, Radio, Users, Calendar, BookOpen, Heart
} from "lucide-react";

export default function FeaturesGrid() {
  const features = [
    {
      icon: Video,
      title: "Watch Live",
      description: "Experience worship services and teachings in real-time with our community",
      link: createPageUrl("LiveStreams"),
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Join upcoming gatherings, conferences, and special services",
      link: createPageUrl("Events"),
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with small groups and fellowship circles near you",
      link: createPageUrl("Groups"),
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: BookOpen,
      title: "Resources",
      description: "Access devotionals, sermons, and materials for spiritual growth",
      link: createPageUrl("Blog"),
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Radio,
      title: "Podcasts",
      description: "Listen to teachings and conversations anytime, anywhere",
      link: createPageUrl("Podcasts"),
      color: "from-indigo-500 to-blue-600"
    },
    {
      icon: Heart,
      title: "Give",
      description: "Support the ministry and make a difference in lives",
      link: createPageUrl("Donate"),
      color: "from-rose-500 to-red-600"
    }
  ];

  return (
    <section className="py-24 bg-[#0f1629]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-5 py-2 rounded-full font-bold text-sm mb-4">
            Everything You Need
          </div>
          <h2 className="text-5xl font-black text-white mb-4">Connect & Grow</h2>
          <p className="text-xl text-slate-400 font-medium">Tools to deepen your faith journey</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link}>
              <Card className="group hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 bg-[#1a1f3a] border-slate-700 h-full">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-white group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}