import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Edit, Trash2, GripVertical, Play, FileText, Upload,
  ChevronDown, ChevronUp, Lock, Unlock, Video, File
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AdminCourseBuilder() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order: 1,
    is_locked: false
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content_type: 'video',
    video_url: '',
    text_content: '',
    resource_url: '',
    duration_minutes: 0,
    order: 1,
    is_preview: false
  });

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

  const createModuleMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseModule.create({ ...data, course_id: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      setModuleDialogOpen(false);
      resetModuleForm();
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseModule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules'] });
      setModuleDialogOpen(false);
      resetModuleForm();
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseModule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules'] });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseLesson.create({ ...data, course_id: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseLessons'] });
      queryClient.invalidateQueries({ queryKey: ['courseModules'] });
      setLessonDialogOpen(false);
      resetLessonForm();
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseLesson.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseLessons'] });
      setLessonDialogOpen(false);
      resetLessonForm();
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseLesson.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseLessons'] });
    },
  });

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        const duration = Math.floor(video.duration / 60);
        setLessonForm(prev => ({ 
          ...prev, 
          video_url: file_url,
          duration_minutes: duration
        }));
        setUploadingVideo(false);
      };
    } catch (error) {
      alert('Error uploading video: ' + error.message);
      setUploadingVideo(false);
    }
  };

  const handleResourceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLessonForm(prev => ({ ...prev, resource_url: file_url }));
    } catch (error) {
      alert('Error uploading resource: ' + error.message);
    }
  };

  const handleModuleSubmit = () => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: moduleForm });
    } else {
      createModuleMutation.mutate(moduleForm);
    }
  };

  const handleLessonSubmit = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: lessonForm });
    } else {
      createLessonMutation.mutate({ ...lessonForm, module_id: selectedModuleId });
    }
  };

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      order: modules.length + 1,
      is_locked: false
    });
    setEditingModule(null);
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      content_type: 'video',
      video_url: '',
      text_content: '',
      resource_url: '',
      duration_minutes: 0,
      order: 1,
      is_preview: false
    });
    setEditingLesson(null);
  };

  const getModuleLessons = (moduleId) => {
    return lessons.filter(l => l.module_id === moduleId).sort((a, b) => a.order - b.order);
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  if (!course) {
    return <div className="text-white text-center p-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">{course.title}</h2>
          <p className="text-slate-400 font-semibold">Build course structure and content</p>
        </div>
        <Button onClick={() => window.history.back()} variant="outline" className="border-slate-700">
          Back to Courses
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <p className="text-slate-400 text-sm mb-1">Modules</p>
            <p className="text-2xl font-black text-white">{modules.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <p className="text-slate-400 text-sm mb-1">Lessons</p>
            <p className="text-2xl font-black text-white">{lessons.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1f3a] border-0">
          <CardContent className="p-5">
            <p className="text-slate-400 text-sm mb-1">Total Duration</p>
            <p className="text-2xl font-black text-white">
              {lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)} min
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-white font-black text-xl">Course Structure</h3>
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white font-black">
                {editingModule ? 'Edit Module' : 'Add New Module'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Module Title *</Label>
                <Input
                  placeholder="e.g., Introduction to the Gospel"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Textarea
                  placeholder="Module description"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-24"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Order</Label>
                <Input
                  type="number"
                  value={moduleForm.order}
                  onChange={(e) => setModuleForm({...moduleForm, order: parseInt(e.target.value)})}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={moduleForm.is_locked}
                  onChange={(e) => setModuleForm({...moduleForm, is_locked: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Lock until previous modules completed</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModuleDialogOpen(false); resetModuleForm(); }} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleModuleSubmit} disabled={!moduleForm.title} className="bg-purple-500 hover:bg-purple-600">
                {editingModule ? 'Update' : 'Create'} Module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-3">
        {sortedModules.map((module, idx) => {
          const moduleLessons = getModuleLessons(module.id);
          
          return (
            <AccordionItem key={module.id} value={module.id} className="bg-[#1a1f3a] border-slate-700 rounded-lg px-5">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black">{idx + 1}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-bold text-lg">{module.title}</h4>
                    <p className="text-slate-400 text-sm">{moduleLessons.length} lessons</p>
                  </div>
                  {module.is_locked && <Lock className="w-4 h-4 text-amber-400" />}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule(module);
                        setModuleForm(module);
                        setModuleDialogOpen(true);
                      }}
                      className="border-slate-700"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this module and all its lessons?')) {
                          deleteModuleMutation.mutate(module.id);
                        }
                      }}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {moduleLessons.map((lesson, lessonIdx) => (
                    <div key={lesson.id} className="p-4 bg-slate-900/30 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-bold">{lessonIdx + 1}</span>
                        {lesson.content_type === 'video' ? (
                          <Video className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-green-400" />
                        )}
                        <div>
                          <h5 className="text-white font-semibold">{lesson.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-slate-700 text-xs">
                              {lesson.duration_minutes} min
                            </Badge>
                            {lesson.is_preview && <Badge className="bg-cyan-500 text-xs">Preview</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingLesson(lesson);
                            setLessonForm(lesson);
                            setSelectedModuleId(module.id);
                            setLessonDialogOpen(true);
                          }}
                          className="border-slate-700"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Delete this lesson?')) {
                              deleteLessonMutation.mutate(lesson.id);
                            }
                          }}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={() => {
                      setSelectedModuleId(module.id);
                      setLessonForm({...lessonForm, order: moduleLessons.length + 1});
                      setLessonDialogOpen(true);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black">
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-white mb-2 block">Lesson Title *</Label>
              <Input
                placeholder="e.g., Understanding Grace"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Content Type</Label>
              <select
                value={lessonForm.content_type}
                onChange={(e) => setLessonForm({...lessonForm, content_type: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
              >
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="quiz">Quiz</option>
                <option value="resource">Resource</option>
              </select>
            </div>

            {lessonForm.content_type === 'video' && (
              <div>
                <Label className="text-white mb-2 block">Video File *</Label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                {uploadingVideo && <Badge className="bg-amber-500 mt-2">Uploading...</Badge>}
                {lessonForm.video_url && (
                  <p className="text-green-400 text-sm mt-2">✓ Video uploaded</p>
                )}
              </div>
            )}

            {lessonForm.content_type === 'text' && (
              <div>
                <Label className="text-white mb-2 block">Text Content</Label>
                <Textarea
                  placeholder="Lesson content"
                  value={lessonForm.text_content}
                  onChange={(e) => setLessonForm({...lessonForm, text_content: e.target.value})}
                  className="bg-slate-900/50 border-slate-700 text-white h-48"
                />
              </div>
            )}

            <div>
              <Label className="text-white mb-2 block">Duration (minutes)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm({...lessonForm, duration_minutes: parseInt(e.target.value)})}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Downloadable Resources</Label>
              <Input
                type="file"
                onChange={handleResourceUpload}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              {lessonForm.resource_url && (
                <p className="text-green-400 text-sm mt-2">✓ Resource uploaded</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lessonForm.is_preview}
                onChange={(e) => setLessonForm({...lessonForm, is_preview: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-white">Free preview (accessible to all)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLessonDialogOpen(false); resetLessonForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleLessonSubmit} disabled={!lessonForm.title} className="bg-cyan-500 hover:bg-cyan-600">
              {editingLesson ? 'Update' : 'Create'} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}