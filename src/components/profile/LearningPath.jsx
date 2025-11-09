import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, BookOpen, Play, CheckCircle, Clock, Award,
  TrendingUp, Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LearningPath({ userId }) {
  const { data: progress = [] } = useQuery({
    queryKey: ['userCourseProgress', userId],
    queryFn: () => base44.entities.CourseProgress.filter({ user_id: userId }, '-last_accessed_date'),
    enabled: !!userId,
    initialData: [],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['userCourses'],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['allModules'],
    queryFn: () => base44.entities.CourseModule.list(),
    initialData: [],
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['allLessons'],
    queryFn: () => base44.entities.CourseLesson.list(),
    initialData: [],
  });

  const enrolledCourses = progress.map(p => {
    const course = courses.find(c => c.id === p.course_id);
    const courseModules = modules.filter(m => m.course_id === p.course_id);
    const courseLessons = lessons.filter(l => l.course_id === p.course_id);
    
    return {
      ...p,
      course,
      totalModules: courseModules.length,
      totalLessons: courseLessons.length
    };
  }).filter(item => item.course);

  const completedCourses = enrolledCourses.filter(e => e.is_completed);
  const inProgressCourses = enrolledCourses.filter(e => !e.is_completed);
  const totalHoursLearned = completedCourses.reduce((sum, e) => sum + (e.course.duration_hours || 0), 0);
  const certificatesEarned = completedCourses.filter(e => e.certificate_issued).length;

  return (
    <div className="space-y-6">
      {/* Learning Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">{enrolledCourses.length}</p>
            <p className="text-slate-300 text-sm font-semibold">Enrolled Courses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">{completedCourses.length}</p>
            <p className="text-slate-300 text-sm font-semibold">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-600/20 border-cyan-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">{totalHoursLearned}</p>
            <p className="text-slate-300 text-sm font-semibold">Hours Learned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-600/20 border-amber-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white mb-1">{certificatesEarned}</p>
            <p className="text-slate-300 text-sm font-semibold">Certificates</p>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Courses */}
      {inProgressCourses.length > 0 && (
        <div>
          <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            In Progress
          </h3>
          <div className="space-y-3">
            {inProgressCourses.map((enrollment) => (
              <Card key={enrollment.id} className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex-shrink-0 overflow-hidden">
                      {enrollment.course.thumbnail_url ? (
                        <img src={enrollment.course.thumbnail_url} alt={enrollment.course.title} className="w-full h-full object-cover" />
                      ) : (
                        <GraduationCap className="w-12 h-12 text-white m-auto mt-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg mb-2">{enrollment.course.title}</h4>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-purple-500 text-xs">
                          {enrollment.totalModules} modules
                        </Badge>
                        <Badge className="bg-cyan-500 text-xs">
                          {enrollment.completed_lessons?.length || 0}/{enrollment.totalLessons} lessons
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-sm">Progress</span>
                          <span className="text-cyan-400 font-bold">{Math.round(enrollment.progress_percentage || 0)}%</span>
                        </div>
                        <Progress value={enrollment.progress_percentage || 0} className="h-2 bg-slate-700" />
                      </div>
                      <Link to={createPageUrl("CoursePlayer") + `?id=${enrollment.course_id}`}>
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-cyan-500">
                          <Play className="w-3 h-3 mr-1" />
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div>
          <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Completed Courses
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {completedCourses.map((enrollment) => (
              <Card key={enrollment.id} className="bg-[#1a1f3a] border-green-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-white font-bold mb-1">{enrollment.course.title}</h4>
                      <p className="text-slate-400 text-sm">
                        Completed {enrollment.completion_date && new Date(enrollment.completion_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {enrollment.certificate_issued && (
                    <Badge className="bg-amber-500 mb-3">
                      <Award className="w-3 h-3 mr-1" />
                      Certificate Earned
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Link to={createPageUrl("CourseDetail") + `?id=${enrollment.course_id}`}>
                      <Button size="sm" variant="outline" className="border-slate-700">
                        View Course
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {enrolledCourses.length === 0 && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No Courses Yet</h3>
            <p className="text-slate-400 mb-6">Start learning today</p>
            <Link to={createPageUrl("Courses")}>
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-500">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}