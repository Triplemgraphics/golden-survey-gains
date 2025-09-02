
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  type: 'multiple_choice' | 'open_ended' | 'rating' | 'yes_no';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyData {
  title: string;
  description: string;
  category: string;
  reward: number;
  duration_minutes: number;
  questions: Question[];
}

export const SurveyCreator = () => {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    title: '',
    description: '',
    category: '',
    reward: 0,
    duration_minutes: 5,
    questions: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'multiple_choice' ? [''] : undefined,
      required: true
    };
    setSurveyData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      )
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt) 
            }
          : q
      )
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.filter((_, idx) => idx !== optionIndex) 
            }
          : q
      )
    }));
  };

  const createSurvey = async () => {
    if (!surveyData.title || !surveyData.description || surveyData.questions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one question.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          category: surveyData.category,
          reward: surveyData.reward,
          duration_minutes: surveyData.duration_minutes,
          questions: surveyData.questions,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Survey Created",
        description: "Survey has been created successfully!",
      });

      // Reset form
      setSurveyData({
        title: '',
        description: '',
        category: '',
        reward: 0,
        duration_minutes: 5,
        questions: []
      });
    } catch (error) {
      console.error('Error creating survey:', error);
      toast({
        title: "Error",
        description: "Failed to create survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Survey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Survey Title</Label>
                  <Input
                    id="title"
                    value={surveyData.title}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter survey title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={surveyData.category}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Consumer, Health, Technology"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={surveyData.description}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this survey is about"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reward">Reward (KES)</Label>
                  <Input
                    id="reward"
                    type="number"
                    value={surveyData.reward}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, reward: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={surveyData.duration_minutes}
                    onChange={(e) => setSurveyData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => addQuestion('multiple_choice')}>
                  + Multiple Choice
                </Button>
                <Button variant="outline" onClick={() => addQuestion('open_ended')}>
                  + Open Ended
                </Button>
                <Button variant="outline" onClick={() => addQuestion('rating')}>
                  + Rating
                </Button>
                <Button variant="outline" onClick={() => addQuestion('yes_no')}>
                  + Yes/No
                </Button>
              </div>

              <div className="space-y-4">
                {surveyData.questions.map((question, index) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">
                        Question {index + 1} - {question.type.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Input
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        placeholder="Enter your question"
                      />

                      {question.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(question.id, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(question.id)}
                          >
                            + Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <Card className="p-6">
                <h3 className="text-2xl font-bold mb-2">{surveyData.title || 'Survey Title'}</h3>
                <p className="text-muted-foreground mb-4">{surveyData.description || 'Survey description'}</p>
                <div className="flex gap-4 mb-6">
                  <Badge>KES {surveyData.reward}</Badge>
                  <Badge variant="outline">{surveyData.duration_minutes} mins</Badge>
                  {surveyData.category && <Badge variant="secondary">{surveyData.category}</Badge>}
                </div>
                
                <div className="space-y-4">
                  {surveyData.questions.map((question, index) => (
                    <div key={question.id} className="border rounded p-4">
                      <p className="font-medium mb-2">
                        {index + 1}. {question.question || 'Question text'}
                      </p>
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input type="radio" disabled />
                              <span>{option || `Option ${optIndex + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'open_ended' && (
                        <textarea className="w-full p-2 border rounded" rows={3} disabled />
                      )}
                      {question.type === 'rating' && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(num => (
                            <button key={num} className="w-8 h-8 border rounded" disabled>
                              {num}
                            </button>
                          ))}
                        </div>
                      )}
                      {question.type === 'yes_no' && (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input type="radio" disabled /> Yes
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" disabled /> No
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button onClick={createSurvey} disabled={isCreating}>
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Survey'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
