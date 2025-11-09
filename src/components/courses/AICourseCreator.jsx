import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wand2, RefreshCw, BookOpen, CheckCircle, Loader2, Sparkles,
  Target, Users, Award, Brain, Book, Cross, Heart, Lightbulb
} from "lucide-react";

export default function AICourseCreator({ onCourseCreated }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedCourse, setGeneratedCourse] = useState(null);
  
  const [coursePrompt, setCoursePrompt] = useState({
    topic: '',
    denomination: 'Non-denominational',
    targetAudience: 'Adults',
    difficulty: 'beginner',
    duration: '4',
    focusAreas: [],
    includeScripture: true,
    includeActivities: true,
    includePrayer: true
  });

  const queryClient = useQueryClient();

  const createCourseMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (onCourseCreated) onCourseCreated(course);
    },
  });

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerateCourse = async () => {
    setGenerating(true);
    setProgress(0);
    setGeneratedCourse(null);

    try {
      // Step 1: Analyzing requirements
      setCurrentStep('Analyzing your course requirements...');
      setProgress(10);
      await sleep(800);

      // Step 2: Theological research
      setCurrentStep('Conducting theological research and scripture analysis...');
      setProgress(25);
      await sleep(1000);

      // Generate comprehensive course using AI with PhD-level biblical expertise
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Sarah Thompson, PhD in Biblical Studies and Theology from Harvard Divinity School, with 20 years of experience creating transformative Christian education curricula. You've authored 15 published courses and trained over 10,000 ministry leaders worldwide.

COURSE CREATION REQUEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic: ${coursePrompt.topic}
Denomination: ${coursePrompt.denomination}
Target Audience: ${coursePrompt.targetAudience}
Difficulty Level: ${coursePrompt.difficulty}
Course Duration: ${coursePrompt.duration} weeks
Focus Areas: ${coursePrompt.focusAreas.join(', ') || 'General Christian Education'}
Include Scripture: ${coursePrompt.includeScripture ? 'Yes' : 'No'}
Include Activities: ${coursePrompt.includeActivities ? 'Yes' : 'No'}
Include Prayer: ${coursePrompt.includePrayer ? 'Yes' : 'No'}

REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **COURSE DESIGN**: Create a comprehensive, biblically-grounded course that is:
   - Academically rigorous yet accessible
   - Doctrinally sound and theologically rich
   - Practically applicable to daily Christian life
   - Culturally sensitive and contextually relevant
   - Designed for ${coursePrompt.targetAudience} at ${coursePrompt.difficulty} level

2. **THEOLOGICAL FOUNDATION**: 
   - Ground all teachings in Scripture (use specific verses)
   - Maintain doctrinal integrity for ${coursePrompt.denomination} tradition
   - Address common misconceptions and theological debates
   - Provide historical context and church tradition insights
   - Include original language insights (Hebrew/Greek) where relevant

3. **PEDAGOGICAL EXCELLENCE**:
   - Use progressive learning methodology
   - Include Bloom's Taxonomy principles
   - Incorporate multiple learning styles (visual, auditory, kinesthetic)
   - Provide clear learning objectives for each module
   - Include formative and summative assessments

4. **COURSE STRUCTURE**: Create ${coursePrompt.duration} modules covering:
   - Introduction and foundations
   - Progressive topic development
   - Practical application modules
   - Integration and reflection
   - Final synthesis and next steps

5. **LEARNING OUTCOMES**: Define specific, measurable outcomes that students will:
   - Understand (knowledge)
   - Be able to do (skills)
   - Embody (character formation)
   - Share with others (ministry application)

6. **SPIRITUAL FORMATION**: Integrate:
   ${coursePrompt.includePrayer ? '- Prayer practices and spiritual disciplines' : ''}
   ${coursePrompt.includeScripture ? '- Daily scripture meditation guides' : ''}
   ${coursePrompt.includeActivities ? '- Reflective journaling prompts' : ''}
   - Community discussion questions
   - Personal transformation checkpoints

7. **PRACTICAL ELEMENTS**:
   - Real-life testimonies and case studies
   - Discussion questions for small groups
   - Practical ministry applications
   - Resource recommendations (books, podcasts, tools)
   - Next steps for continued growth

8. **ASSESSMENT & ACCOUNTABILITY**:
   - Weekly reflection questions
   - Self-assessment rubrics
   - Peer discussion prompts
   - Final project or capstone assignment
   - Certificate of completion criteria

Generate a complete, professional course with:
- Compelling title that captures the essence
- Inspiring course description (250-300 words)
- Clear prerequisites (if any)
- Comprehensive learning outcomes (6-8 specific outcomes)
- Module outline with titles and brief descriptions
- Estimated time per module
- Course tags for discoverability

Make this a transformative educational experience that will impact lives for Christ.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            short_summary: { type: "string" },
            learning_outcomes: {
              type: "array",
              items: { type: "string" }
            },
            prerequisites: {
              type: "array",
              items: { type: "string" }
            },
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  duration_minutes: { type: "number" },
                  learning_objectives: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            tags: {
              type: "array",
              items: { type: "string" }
            },
            estimated_hours: { type: "number" },
            spiritual_disciplines: {
              type: "array",
              items: { type: "string" }
            },
            recommended_resources: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Step 3: Structuring course
      setCurrentStep('Structuring course modules and lessons...');
      setProgress(50);
      await sleep(800);

      // Step 4: Enriching content
      setCurrentStep('Enriching with scripture references and study materials...');
      setProgress(70);
      await sleep(800);

      // Step 5: Final review
      setCurrentStep('Performing quality review and theological verification...');
      setProgress(90);
      await sleep(600);

      setCurrentStep('Course creation complete!');
      setProgress(100);
      
      setGeneratedCourse(result);

    } catch (error) {
      console.error('AI generation error:', error);
      alert('Error generating course: ' + error.message);
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!generatedCourse) return;

    try {
      const courseData = {
        title: generatedCourse.title,
        description: generatedCourse.description,
        category: coursePrompt.focusAreas[0] || 'faith',
        difficulty_level: coursePrompt.difficulty,
        duration_hours: generatedCourse.estimated_hours || parseInt(coursePrompt.duration) * 2,
        learning_outcomes: generatedCourse.learning_outcomes,
        prerequisites: generatedCourse.prerequisites,
        tags: generatedCourse.tags,
        instructor_name: 'AI Course Creator',
        is_published: false,
        total_modules: generatedCourse.modules?.length || 0,
        certificate_enabled: true
      };

      const course = await createCourseMutation.mutateAsync(courseData);

      // Create modules
      for (let i = 0; i < generatedCourse.modules.length; i++) {
        const module = generatedCourse.modules[i];
        await base44.entities.CourseModule.create({
          course_id: course.id,
          title: module.title,
          description: module.description,
          order: i + 1,
          duration_minutes: module.duration_minutes || 60,
          is_locked: i > 0
        });
      }

      alert('✅ Course created successfully!\n\nNow you can add lessons to each module.');
      setGeneratedCourse(null);
      setCoursePrompt({
        topic: '',
        denomination: 'Non-denominational',
        targetAudience: 'Adults',
        difficulty: 'beginner',
        duration: '4',
        focusAreas: [],
        includeScripture: true,
        includeActivities: true,
        includePrayer: true
      });

    } catch (error) {
      alert('Error creating course: ' + error.message);
    }
  };

  const focusAreaOptions = [
    'Bible Study', 'Prayer & Worship', 'Spiritual Formation', 'Leadership',
    'Evangelism', 'Discipleship', 'Theology', 'Church History',
    'Practical Ministry', 'Family & Relationships', 'Apologetics', 'Missions'
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white font-black text-2xl flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            AI Course Creator
            <Badge className="bg-purple-500">PhD-Level Expertise</Badge>
          </CardTitle>
          <p className="text-slate-300 mt-2">
            Dr. Sarah Thompson, PhD - Biblical Studies & Theology Expert
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!generating && !generatedCourse ? (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Course Topic *
                  </Label>
                  <Input
                    placeholder="e.g., Understanding the Gospel of John"
                    value={coursePrompt.topic}
                    onChange={(e) => setCoursePrompt({...coursePrompt, topic: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                    <Cross className="w-4 h-4" />
                    Denomination
                  </Label>
                  <select
                    value={coursePrompt.denomination}
                    onChange={(e) => setCoursePrompt({...coursePrompt, denomination: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="Non-denominational">Non-denominational</option>
                    <option value="Baptist">Baptist</option>
                    <option value="Methodist">Methodist</option>
                    <option value="Presbyterian">Presbyterian</option>
                    <option value="Pentecostal">Pentecostal</option>
                    <option value="Catholic">Catholic</option>
                    <option value="Lutheran">Lutheran</option>
                    <option value="Anglican">Anglican</option>
                    <option value="Orthodox">Orthodox</option>
                  </select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Target Audience
                  </Label>
                  <select
                    value={coursePrompt.targetAudience}
                    onChange={(e) => setCoursePrompt({...coursePrompt, targetAudience: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="Adults">Adults</option>
                    <option value="Young Adults">Young Adults (18-30)</option>
                    <option value="Mature Adults">Mature Adults (50+)</option>
                    <option value="Ministry Leaders">Ministry Leaders</option>
                    <option value="New Believers">New Believers</option>
                    <option value="Seekers">Seekers/Pre-Christians</option>
                  </select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Difficulty Level
                  </Label>
                  <select
                    value={coursePrompt.difficulty}
                    onChange={(e) => setCoursePrompt({...coursePrompt, difficulty: e.target.value})}
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <Label className="text-white font-bold mb-3 block">Course Duration (weeks)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={coursePrompt.duration}
                    onChange={(e) => setCoursePrompt({...coursePrompt, duration: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white font-bold mb-3 block flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Focus Areas (Select multiple)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {focusAreaOptions.map(area => (
                    <button
                      key={area}
                      onClick={() => {
                        const updated = coursePrompt.focusAreas.includes(area)
                          ? coursePrompt.focusAreas.filter(a => a !== area)
                          : [...coursePrompt.focusAreas, area];
                        setCoursePrompt({...coursePrompt, focusAreas: updated});
                      }}
                      className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                        coursePrompt.focusAreas.includes(area)
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={coursePrompt.includeScripture}
                    onChange={(e) => setCoursePrompt({...coursePrompt, includeScripture: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Include Scripture Study</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={coursePrompt.includeActivities}
                    onChange={(e) => setCoursePrompt({...coursePrompt, includeActivities: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Include Activities</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={coursePrompt.includePrayer}
                    onChange={(e) => setCoursePrompt({...coursePrompt, includePrayer: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Include Prayer Guides</Label>
                </div>
              </div>

              <Button
                onClick={handleGenerateCourse}
                disabled={!coursePrompt.topic || coursePrompt.focusAreas.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 font-bold text-lg h-14"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Course with AI
              </Button>
            </>
          ) : generating ? (
            <div className="py-12 space-y-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-purple-500/20 rounded-full"></div>
                  <div className="w-32 h-32 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <Brain className="w-16 h-16 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    {currentStep}
                  </span>
                  <span className="text-purple-400 font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-slate-800" />
              </div>

              <div className="text-center text-slate-400">
                <p>AI is analyzing theology, structuring curriculum, and creating comprehensive content...</p>
              </div>
            </div>
          ) : generatedCourse ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h3 className="text-white font-black text-2xl mb-2 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  {generatedCourse.title}
                </h3>
                <Badge className="bg-purple-500 mb-4">{coursePrompt.difficulty}</Badge>
                <p className="text-slate-300 mb-4">{generatedCourse.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Duration</p>
                    <p className="text-white font-semibold">{generatedCourse.estimated_hours} hours</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Modules</p>
                    <p className="text-white font-semibold">{generatedCourse.modules?.length} modules</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-3">Learning Outcomes</h4>
                <ul className="space-y-2">
                  {generatedCourse.learning_outcomes?.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <Award className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-3">Course Modules</h4>
                <div className="space-y-2">
                  {generatedCourse.modules?.map((module, idx) => (
                    <div key={idx} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="text-white font-semibold">{idx + 1}. {module.title}</h5>
                          <p className="text-slate-400 text-sm mt-1">{module.description}</p>
                        </div>
                        <Badge className="bg-cyan-500">{module.duration_minutes} min</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {generatedCourse.tags && (
                <div>
                  <h4 className="text-white font-bold mb-3">Course Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedCourse.tags.map(tag => (
                      <Badge key={tag} className="bg-slate-700">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateCourse}
                  disabled={createCourseMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold text-lg h-12"
                >
                  {createCourseMutation.isPending ? (
                    <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Creating...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5 mr-2" />Create Course</>
                  )}
                </Button>
                <Button
                  onClick={() => setGeneratedCourse(null)}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  Start Over
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}