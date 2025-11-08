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
      title: "LIVE STREAMING",
      description: "Watch worship services, Bible studies, and special events in real-time",
      link: createPageUrl("LiveStreams"),
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Radio,
      title: "PODCASTS",
      description: "Listen to sermons, teachings, and inspiring conversations anytime",
      link: createPageUrl("Podcasts"),
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Users,
      title: "SMALL GROUPS",
      description: "Find your community in Bible study groups and fellowship circles",
      link: createPageUrl("Groups"),
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Calendar,
      title: "EVENTS",
      description: "Stay updated on church events, conferences, and gatherings",
      link: createPageUrl("Events"),
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: BookOpen,
      title: "BLOG & RESOURCES",
      description: "Read devotionals, articles, and resources for spiritual growth",
      link: createPageUrl("Blog"),
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Heart,
      title: "GIVE & SUPPORT",
      description: "Support ministries and make a difference in the community",
      link: createPageUrl("Donate"),
      color: "from-rose-500 to-red-600"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-white via-orange-50 to-amber-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-full font-black text-sm mb-4 shadow-lg">
            EVERYTHING YOU NEED
          </div>
          <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">TOOLS TO GROW IN FAITH</h2>
          <p className="text-xl text-slate-600 font-bold">Connect • Worship • Serve Together</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link}>
              <Card className="group hover:shadow-2xl transition-all duration-300 border-3 border-orange-200 hover:border-orange-400 shadow-xl h-full overflow-hidden">
                <CardContent className="p-8">
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 group-hover:text-orange-600 transition-colors tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 font-semibold leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}