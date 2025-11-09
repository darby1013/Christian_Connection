import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Search, MapPin, Mail, MessageSquare, Heart,
  Facebook, Twitter, Instagram, Lock, Crown
} from "lucide-react";
import { motion } from "framer-motion";

export default function MemberDirectory() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Not logged in');
      }
    };
    fetchUser();
  }, []);

  const { data: members = [] } = useQuery({
    queryKey: ['memberDirectory'],
    queryFn: () => base44.entities.MemberDirectory.filter({ is_public: true }, '-created_date'),
    initialData: [],
    enabled: !!user,
  });

  const filteredMembers = members.filter(member =>
    member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.interests?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 max-w-lg">
          <CardContent className="p-12 text-center">
            <Lock className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-white font-black text-2xl mb-3">Members Only</h3>
            <p className="text-slate-300 mb-6">
              Sign in to access the member directory and connect with the community
            </p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600 font-bold">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Member Directory</h1>
            <p className="text-xl text-slate-400 mb-6 max-w-2xl mx-auto">
              Connect with fellow believers in our community
            </p>
            <Badge className="bg-white/20 backdrop-blur-sm text-white text-base px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              {members.length} Active Members
            </Badge>
          </motion.div>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search by name, interests, or ministry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-[#1a1f3a] border-slate-700 hover:border-cyan-500 transition-all">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-cyan-500/30">
                      <AvatarImage src={member.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold text-2xl">
                        {member.display_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-white font-bold text-xl mb-1">{member.display_name}</h3>
                    {member.location && (
                      <div className="flex items-center justify-center gap-1 text-slate-400 text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        {member.location}
                      </div>
                    )}
                  </div>

                  {member.bio && (
                    <p className="text-slate-400 text-sm text-center mb-4 line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {member.interests && member.interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-xs font-semibold mb-2">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {member.interests.slice(0, 3).map((interest, idx) => (
                          <Badge key={idx} variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.ministry_involvement && member.ministry_involvement.length > 0 && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-xs font-semibold mb-2">Ministry Involvement</p>
                      <div className="flex flex-wrap gap-1">
                        {member.ministry_involvement.slice(0, 2).map((ministry, idx) => (
                          <Badge key={idx} className="bg-purple-500 text-xs">
                            {ministry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 mb-4">
                    {member.social_links?.facebook && (
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400">
                        <Facebook className="w-4 h-4" />
                      </Button>
                    )}
                    {member.social_links?.twitter && (
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
                        <Twitter className="w-4 h-4" />
                      </Button>
                    )}
                    {member.social_links?.instagram && (
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-pink-400">
                        <Instagram className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {member.allow_messages && (
                      <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-slate-700">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <Card className="bg-[#1a1f3a] border-slate-700">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">No members found</h3>
              <p className="text-slate-400">Try adjusting your search</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}