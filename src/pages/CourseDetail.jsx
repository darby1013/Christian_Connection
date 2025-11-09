
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, Star, Users, Clock, BookOpen, Award, Play,
  Check, Lock, Video, FileText, ChevronDown, ChevronUp, Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CourseReviews from "../components/courses/CourseReviews";

export default function CourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const [user, setUser] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }).then(res => res[0]),
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => base44.entities.CourseModule.filter({ course_id: courseId }),
    enabled: !!courseId,
    initialData: [],
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: () => base44.entities.CourseLesson.filter({ course_id: courseId }),
    enabled: !!courseId,
    initialData: [],
  });

  const { data: progress } = useQuery({
    queryKey: ['courseProgress', user?.id, courseId],
    queryFn: () => base44.entities.CourseProgress.filter({ user_id: user.id, course_id: courseId }).then(res => res[0]),
    enabled: !!user && !!courseId,
  });

  useEffect(() => {
    setIsEnrolled(!!progress);
  }, [progress]);

  const enrollMutation = useMutation({
    mutationFn: () => base44.entities.CourseProgress.create({
      user_id: user.id,
      course_id: courseId,
      enrolled_date: new Date().toISOString(),
      completed_lessons: [],
      progress_percentage: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
      setIsEnrolled(true);
    },
  });

  const handleEnroll = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    enrollMutation.mutate();
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  const getModuleLessons = (moduleId) => {
    return lessons.filter(l => l.module_id === moduleId).sort((a, b) => a.order - b.order);
  };

  const isLessonCompleted = (lessonId) => {
    return progress?.completed_lessons?.includes(lessonId) || false;
  };

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500',
      intermediate: 'bg-amber-500',
      advanced: 'bg-red-500'
    };
    return colors[level] || 'bg-slate-500';
  };

  if (!course) {
    return <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] flex items-center justify-center">
      <p className="text-white text-xl">Loading...</p>
    </div>;
  }

  const totalLessons = lessons.length;
  const completedLessons = progress?.completed_lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f3a] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={getDifficultyColor(course.difficulty_level)}>
                {course.difficulty_level}
              </Badge>
              <Badge className="bg-purple-500">{course.category}</Badge>
            </div>
            <h1 className="text-4xl font-black text-white mb-4">{course.title}</h1>
            <p className="text-xl text-slate-300 mb-6">{course.description}</p>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-white font-bold">{course.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-slate-400">({course.review_count || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-5 h-5" />
                <span>{course.enrollment_count || 0} students</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.duration_hours} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{modules.length} modules</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                <span>{totalLessons} lessons</span>
              </div>
            </div>
          </div>

          <div>
            <Card className="bg-[#1a1f3a] border-slate-700 sticky top-24">
              <CardContent className="p-6">
                {course.thumbnail_url && (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full aspect-video object-cover rounded-lg mb-4" />
                )}
                
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Your Progress</span>
                        <span className="text-cyan-400 font-bold">{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2 bg-slate-700" />
                      <p className="text-slate-400 text-sm mt-2">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>
                    <Link to={createPageUrl("CoursePlayer") + `?id=${courseId}`}>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600">
                        <Play className="w-5 h-5 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {course.price > 0 ? (
                      <div className="text-center mb-4">
                        <p className="text-3xl font-black text-white">${course.price}</p>
                        <p className="text-slate-400 text-sm">One-time payment</p>
                      </div>
                    ) : (
                      <Badge className="bg-green-500 text-lg px-4 py-2 mb-4">FREE Course</Badge>
                    )}
                    <Button 
                      onClick={handleEnroll}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
                    >
                      <GraduationCap className="w-5 h-5 mr-2" />
                      {course.price > 0 ? 'Purchase Course' : 'Enroll Now'}
                    </Button>
                  </div>
                )}

                {course.certificate_enabled && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold text-sm">Certificate of Completion</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-[#1a1f3a] border-slate-700 mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-white mb-4">What You'll Learn</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {course.learning_outcomes?.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{outcome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1f3a] border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-white mb-4">Course Content</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {sortedModules.map((module, idx) => {
                    const moduleLessons = getModuleLessons(module.id);
                    const completedInModule = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
                    
                    return (
                      <AccordionItem key={module.id} value={module.id} className="bg-slate-900/30 border-slate-700 rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">{idx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-bold">{module.title}</h4>
                              <p className="text-slate-400 text-sm">
                                {moduleLessons.length} lessons • {module.duration_minutes || 0} min
                                {isEnrolled && ` • ${completedInModule}/${moduleLessons.length} completed`}
                              </p>
                            </div>
                            {module.is_locked && !isEnrolled && <Lock className="w-4 h-4 text-amber-400" />}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {moduleLessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded">
                                <div className="flex items-center gap-3">
                                  {lesson.content_type === 'video' ? (
                                    <Video className="w-4 h-4 text-cyan-400" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-green-400" />
                                  )}
                                  <div>
                                    <p className="text-white font-semibold text-sm">{lesson.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className="bg-slate-700 text-xs">
                                        {lesson.duration_minutes} min
                                      </Badge>
                                      {lesson.is_preview && <Badge className="bg-cyan-500 text-xs">Preview</Badge>}
                                    </div>
                                  </div>
                                </div>
                                {isEnrolled && isLessonCompleted(lesson.id) && (
                                  <Check className="w-5 h-5 text-green-400" />
                                )}
                                {!isEnrolled && !lesson.is_preview && (
                                  <Lock className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-[#1a1f3a] border-slate-700 mb-6">
              <CardContent className="p-6">
                <h3 className="text-white font-black text-lg mb-4">Instructor</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{course.instructor_name?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{course.instructor_name}</p>
                    <p className="text-slate-400 text-sm">Course Instructor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card className="bg-[#1a1f3a] border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-white font-black text-lg mb-4">Prerequisites</h3>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <CourseReviews courseId={courseId} user={user} />
        </div>
      </div>
    </div>
  );
}
