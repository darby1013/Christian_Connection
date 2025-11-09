import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Wand2, BookOpen, GraduationCap, Brain, Sparkles, Target,
  FileQuestion, MessageSquare, TrendingUp, Award, Users, Book
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AICourseCreator from "../components/courses/AICourseCreator";
import AIQuizGenerator from "../components/courses/AIQuizGenerator";
import AIDiscussionGenerator from "../components/courses/AIDiscussionGenerator";
import AILearningPathOptimizer from "../components/courses/AILearningPathOptimizer";
import AIAssessmentBuilder from "../components/courses/AIAssessmentBuilder";
import AIContentEnhancer from "../components/courses/AIContentEnhancer";

export default function AdminAICourseTools() {
  const { data: courses = [] } = useQuery({
    queryKey: ['coursesAI'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['modulesAI'],
    queryFn: () => base44.entities.CourseModule.list(),
    initialData: [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">AI Course Creation Suite</h2>
          <p className="text-slate-400 font-semibold">PhD-Level Biblical Course Development Tools</p>
        </div>
        <Link to={createPageUrl("AdminCourses")}>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <BookOpen className="w-4 h-4 mr-2" />
            View All Courses
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-purple-400" />
              <Badge className="bg-purple-500">{courses.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{courses.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Total Courses</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Book className="w-8 h-8 text-cyan-400" />
              <Badge className="bg-cyan-500">{modules.length}</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">{modules.length}</p>
            <p className="text-slate-400 text-sm font-semibold">Course Modules</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8 text-green-400" />
              <Badge className="bg-green-500">AI</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">10+</p>
            <p className="text-slate-400 text-sm font-semibold">AI Tools</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <Badge className="bg-amber-500">PhD</Badge>
            </div>
            <p className="text-2xl font-black text-white mb-1">Expert</p>
            <p className="text-slate-400 text-sm font-semibold">AI Expertise</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="creator" className="w-full">
        <TabsList className="bg-[#1a1f3a] border border-slate-700 grid grid-cols-6 gap-2">
          <TabsTrigger value="creator" className="data-[state=active]:bg-purple-500">
            <Wand2 className="w-4 h-4 mr-2" />
            Course Creator
          </TabsTrigger>
          <TabsTrigger value="quiz" className="data-[state=active]:bg-purple-500">
            <FileQuestion className="w-4 h-4 mr-2" />
            Quiz Builder
          </TabsTrigger>
          <TabsTrigger value="discussion" className="data-[state=active]:bg-purple-500">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="assessment" className="data-[state=active]:bg-purple-500">
            <Award className="w-4 h-4 mr-2" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="optimizer" className="data-[state=active]:bg-purple-500">
            <Target className="w-4 h-4 mr-2" />
            Optimizer
          </TabsTrigger>
          <TabsTrigger value="enhancer" className="data-[state=active]:bg-purple-500">
            <Sparkles className="w-4 h-4 mr-2" />
            Enhancer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creator" className="mt-6">
          <AICourseCreator />
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <AIQuizGenerator courses={courses} modules={modules} />
        </TabsContent>

        <TabsContent value="discussion" className="mt-6">
          <AIDiscussionGenerator courses={courses} />
        </TabsContent>

        <TabsContent value="assessment" className="mt-6">
          <AIAssessmentBuilder courses={courses} />
        </TabsContent>

        <TabsContent value="optimizer" className="mt-6">
          <AILearningPathOptimizer courses={courses} />
        </TabsContent>

        <TabsContent value="enhancer" className="mt-6">
          <AIContentEnhancer courses={courses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}