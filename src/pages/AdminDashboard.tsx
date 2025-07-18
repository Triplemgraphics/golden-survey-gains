import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Crown, 
  LogOut, 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  reward: number;
  duration_minutes: number | null;
  status: string;
  created_at: string;
}

interface SurveyForm {
  title: string;
  description: string;
  category: string;
  reward: number;
  duration_minutes: number;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [surveyForm, setSurveyForm] = useState<SurveyForm>({
    title: "",
    description: "",
    category: "",
    reward: 0,
    duration_minutes: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchProfile(session.user.id);
      await fetchSurveys();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("surveys")
        .insert([{
          ...surveyForm,
          created_by: user?.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Survey created successfully",
      });

      setSurveyForm({
        title: "",
        description: "",
        category: "",
        reward: 0,
        duration_minutes: 0,
      });
      setShowCreateForm(false);
      fetchSurveys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create survey",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurvey) return;

    try {
      const { error } = await supabase
        .from("surveys")
        .update(surveyForm)
        .eq("id", editingSurvey.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Survey updated successfully",
      });

      setEditingSurvey(null);
      setSurveyForm({
        title: "",
        description: "",
        category: "",
        reward: 0,
        duration_minutes: 0,
      });
      fetchSurveys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update survey",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .delete()
        .eq("id", surveyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Survey deleted successfully",
      });

      fetchSurveys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete survey",
        variant: "destructive",
      });
    }
  };

  const startEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setSurveyForm({
      title: survey.title,
      description: survey.description || "",
      category: survey.category || "",
      reward: survey.reward,
      duration_minutes: survey.duration_minutes || 0,
    });
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <p>Access denied. Admin privileges required.</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                  Survey Africa
                </div>
                <div className="text-xs text-muted-foreground">Admin Dashboard</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                User Dashboard
              </Button>
              <div className="text-right">
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-sm text-muted-foreground">Administrator</p>
              </div>
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{surveys.length}</p>
                  <p className="text-sm text-muted-foreground">Total Surveys</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Ksh 0</p>
                  <p className="text-sm text-muted-foreground">Total Payouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Survey Management</h2>
            <Button 
              onClick={() => {
                setShowCreateForm(true);
                setEditingSurvey(null);
                setSurveyForm({
                  title: "",
                  description: "",
                  category: "",
                  reward: 0,
                  duration_minutes: 0,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Button>
          </div>

          {/* Create/Edit Form */}
          {(showCreateForm || editingSurvey) && (
            <Card className="border-border/50 shadow-elegant">
              <CardHeader>
                <CardTitle>
                  {editingSurvey ? "Edit Survey" : "Create New Survey"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingSurvey ? handleUpdateSurvey : handleCreateSurvey} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={surveyForm.title}
                        onChange={(e) => setSurveyForm({...surveyForm, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={surveyForm.category}
                        onChange={(e) => setSurveyForm({...surveyForm, category: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={surveyForm.description}
                      onChange={(e) => setSurveyForm({...surveyForm, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reward">Reward (Ksh)</Label>
                      <Input
                        id="reward"
                        type="number"
                        min="0"
                        step="0.01"
                        value={surveyForm.reward}
                        onChange={(e) => setSurveyForm({...surveyForm, reward: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={surveyForm.duration_minutes}
                        onChange={(e) => setSurveyForm({...surveyForm, duration_minutes: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingSurvey ? "Update Survey" : "Create Survey"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingSurvey(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Surveys List */}
          <div className="grid gap-4">
            {surveys.map((survey) => (
              <Card key={survey.id} className="border-border/50 shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{survey.title}</h3>
                        <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                          {survey.status}
                        </Badge>
                        {survey.category && (
                          <Badge variant="outline">{survey.category}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{survey.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Reward: Ksh {survey.reward}</span>
                        {survey.duration_minutes && (
                          <span>Duration: {survey.duration_minutes} mins</span>
                        )}
                        <span>Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEdit(survey)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteSurvey(survey.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {surveys.length === 0 && (
            <Card className="border-border/50 shadow-elegant">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No surveys created yet</h3>
                <p className="text-muted-foreground">Create your first survey to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;