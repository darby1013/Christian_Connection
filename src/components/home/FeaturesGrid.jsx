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
      title: "Live Streaming",
      description: "Watch worship services, Bible studies, and special events in real-time",
      link: createPageUrl("LiveStreams"),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Radio,
      title: "Podcasts",
      description: "Listen to sermons, teachings, and inspiring conversations anytime",
      link: createPageUrl("Podcasts"),
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Small Groups",
      description: "Find your community in Bible study groups and fellowship circles",
      link: createPageUrl("Groups"),
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Stay updated on church events, conferences, and gatherings",
      link: createPageUrl("Events"),
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BookOpen,
      title: "Blog & Resources",
      description: "Read devotionals, articles, and resources for spiritual growth",
      link: createPageUrl("Blog"),
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: Heart,
      title: "Give & Support",
      description: "Support ministries and make a difference in the community",
      link: createPageUrl("Donate"),
      color: "from-rose-500 to-pink-500"
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
          <p className="text-xl text-slate-600">Tools to connect, grow, and serve together</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link}>
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg h-full">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}