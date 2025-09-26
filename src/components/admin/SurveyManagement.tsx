import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Save, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  type: 'multiple_choice' | 'open_ended' | 'rating' | 'yes_no';
  question: string;
  options?: string[];
  required: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  category: string;
  reward: number;
  duration_minutes: number;
  questions: Question[];
  status: string;
  created_at: string;
}

export const SurveyManagement = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys((data || []).map(survey => ({
        ...survey,
        questions: Array.isArray(survey.questions) ? survey.questions as unknown as Question[] : []
      })));
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch surveys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) throw error;

      setSurveys(prev => prev.filter(s => s.id !== surveyId));
      toast({
        title: "Survey Deleted",
        description: "Survey has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast({
        title: "Error",
        description: "Failed to delete survey",
        variant: "destructive",
      });
    }
  };

  const updateSurvey = async () => {
    if (!editingSurvey) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('surveys')
        .update({
          title: editingSurvey.title,
          description: editingSurvey.description,
          category: editingSurvey.category,
          reward: editingSurvey.reward,
          duration_minutes: editingSurvey.duration_minutes,
          questions: editingSurvey.questions as any,
          status: editingSurvey.status
        })
        .eq('id', editingSurvey.id);

      if (error) throw error;

      setSurveys(prev => prev.map(s => s.id === editingSurvey.id ? editingSurvey : s));
      setEditingSurvey(null);
      toast({
        title: "Survey Updated",
        description: "Survey has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating survey:', error);
      toast({
        title: "Error",
        description: "Failed to update survey",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (type: Question['type']) => {
    if (!editingSurvey) return;
    
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'multiple_choice' ? [''] : undefined,
      required: true
    };
    
    setEditingSurvey(prev => prev ? {
      ...prev,
      questions: [...prev.questions, newQuestion]
    } : null);
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!editingSurvey) return;
    
    setEditingSurvey(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    } : null);
  };

  const removeQuestion = (questionId: string) => {
    if (!editingSurvey) return;
    
    setEditingSurvey(prev => prev ? {
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    } : null);
  };

  const addOption = (questionId: string) => {
    if (!editingSurvey) return;
    
    setEditingSurvey(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      )
    } : null);
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    if (!editingSurvey) return;
    
    setEditingSurvey(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt) 
            }
          : q
      )
    } : null);
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    if (!editingSurvey) return;
    
    setEditingSurvey(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.filter((_, idx) => idx !== optionIndex) 
            }
          : q
      )
    } : null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading surveys...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">{survey.title}</TableCell>
                  <TableCell>{survey.category}</TableCell>
                  <TableCell>KES {survey.reward}</TableCell>
                  <TableCell>
                    <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                      {survey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{survey.questions?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingSurvey(survey)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Survey</DialogTitle>
                            <DialogDescription>
                              Make changes to the survey details and questions
                            </DialogDescription>
                          </DialogHeader>
                          
                          {editingSurvey && (
                            <Tabs defaultValue="basic" className="space-y-4">
                              <TabsList>
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="questions">Questions</TabsTrigger>
                              </TabsList>

                              <TabsContent value="basic" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-title">Survey Title</Label>
                                    <Input
                                      id="edit-title"
                                      value={editingSurvey.title}
                                      onChange={(e) => setEditingSurvey(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-category">Category</Label>
                                    <Input
                                      id="edit-category"
                                      value={editingSurvey.category}
                                      onChange={(e) => setEditingSurvey(prev => prev ? { ...prev, category: e.target.value } : null)}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editingSurvey.description}
                                    onChange={(e) => setEditingSurvey(prev => prev ? { ...prev, description: e.target.value } : null)}
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor="edit-reward">Reward (KES)</Label>
                                    <Input
                                      id="edit-reward"
                                      type="number"
                                      value={editingSurvey.reward}
                                      onChange={(e) => setEditingSurvey(prev => prev ? { ...prev, reward: Number(e.target.value) } : null)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-duration">Duration (minutes)</Label>
                                    <Input
                                      id="edit-duration"
                                      type="number"
                                      value={editingSurvey.duration_minutes}
                                      onChange={(e) => setEditingSurvey(prev => prev ? { ...prev, duration_minutes: Number(e.target.value) } : null)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-status">Status</Label>
                                    <select 
                                      id="edit-status"
                                      className="w-full p-2 border border-input rounded-md"
                                      value={editingSurvey.status}
                                      onChange={(e) => setEditingSurvey(prev => prev ? { ...prev, status: e.target.value } : null)}
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                      <option value="draft">Draft</option>
                                    </select>
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
                                  {editingSurvey.questions?.map((question, index) => (
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
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ))}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => addOption(question.id)}
                                            >
                                              <Plus className="h-4 w-4 mr-1" />
                                              Add Option
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}

                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setEditingSurvey(null)}>
                              Cancel
                            </Button>
                            <Button onClick={updateSurvey} disabled={saving}>
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{survey.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSurvey(survey.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};