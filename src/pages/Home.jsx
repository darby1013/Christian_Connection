import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Video, Users, ArrowRight, Sparkles
} from "lucide-react";
import LiveStreamSection from "../components/home/LiveStreamSection";
import FeaturesGrid from "../components/home/FeaturesGrid";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1920')] opacity-10 bg-cover bg-center"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Welcome to our Community</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Experience Faith
              <span className="block bg-gradient-to-r from-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                Together Online
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Join live worship, connect with believers worldwide, and grow in your spiritual journey
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl("LiveStreams")}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all">
                  <Video className="w-5 h-5 mr-2" />
                  Watch Live Now
                </Button>
              </Link>
              <Link to={createPageUrl("Groups")}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 backdrop-blur-md">
                  <Users className="w-5 h-5 mr-2" />
                  Join a Group
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <LiveStreamSection />

      <FeaturesGrid />

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of believers connecting, growing, and serving together online
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}