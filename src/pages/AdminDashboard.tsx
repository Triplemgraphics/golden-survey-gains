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
  Settings,
  Check,
  X,
  Clock,
  Wallet,
  CreditCard
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

interface PendingSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price: number;
  mpesa_code: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface PendingPayment {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  total_pending: number;
  earnings_count: number;
  earnings: Array<{
    id: string;
    amount: number;
    survey_id: string;
    created_at: string;
  }>;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
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
      await fetchPendingSubscriptions();
      await fetchPendingPayments();
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

  const fetchPendingSubscriptions = async () => {
    try {
      // First get subscriptions with plan details
      const { data: subscriptionsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          mpesa_code,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      if (!subscriptionsData || subscriptionsData.length === 0) {
        setPendingSubscriptions([]);
        return;
      }

      // Get plan details and user profiles separately
      const planIds = subscriptionsData.map(sub => sub.plan_id);
      const userIds = subscriptionsData.map(sub => sub.user_id);

      const [{ data: plansData }, { data: profilesData }] = await Promise.all([
        supabase.from('subscription_plans').select('id, name, price').in('id', planIds),
        supabase.from('profiles').select('user_id, first_name, last_name, email').in('user_id', userIds)
      ]);

      // Combine the data
      const formatted = subscriptionsData.map(sub => {
        const plan = plansData?.find(p => p.id === sub.plan_id);
        const profile = profilesData?.find(p => p.user_id === sub.user_id);
        
        return {
          id: sub.id,
          user_id: sub.user_id,
          plan_name: plan?.name || 'Unknown',
          plan_price: plan?.price || 0,
          mpesa_code: sub.mpesa_code || '',
          created_at: sub.created_at,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          email: profile?.email,
        };
      });

      setPendingSubscriptions(formatted);
    } catch (error) {
      console.error("Error fetching pending subscriptions:", error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      // Get all pending earnings with user details
      const { data: earningsData, error } = await supabase
        .from('earnings')
        .select(`
          id,
          user_id,
          survey_id,
          amount,
          created_at,
          profiles!inner (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const groupedPayments: { [key: string]: PendingPayment } = {};
      
      earningsData?.forEach((earning: any) => {
        const userId = earning.user_id;
        if (!groupedPayments[userId]) {
          groupedPayments[userId] = {
            user_id: userId,
            first_name: earning.profiles.first_name,
            last_name: earning.profiles.last_name,
            email: earning.profiles.email,
            total_pending: 0,
            earnings_count: 0,
            earnings: []
          };
        }
        
        groupedPayments[userId].total_pending += Number(earning.amount);
        groupedPayments[userId].earnings_count += 1;
        groupedPayments[userId].earnings.push({
          id: earning.id,
          amount: Number(earning.amount),
          survey_id: earning.survey_id,
          created_at: earning.created_at
        });
      });

      setPendingPayments(Object.values(groupedPayments));
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    }
  };

  const handleMarkAsPaid = async (userId: string) => {
    try {
      const now = new Date().toISOString();
      
      // Update all pending earnings for this user to paid
      const { error: earningsError } = await supabase
        .from('earnings')
        .update({
          status: 'paid',
          paid_at: now
        })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (earningsError) throw earningsError;

      // Get the user's current profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_earnings')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Calculate total pending amount for this user
      const userPayment = pendingPayments.find(p => p.user_id === userId);
      if (!userPayment) return;

      // Update user's total earnings and reset credits
      const newTotalEarnings = (Number(profileData.total_earnings) || 0) + userPayment.total_pending;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_earnings: newTotalEarnings,
          credits: 0 // Reset current earnings
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Payment processed successfully. User earnings updated.`,
      });

      // Refresh the data
      await fetchPendingPayments();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
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

  const handleApproveSubscription = async (subscriptionId: string) => {
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          approved_by: user?.id
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription approved successfully",
      });

      fetchPendingSubscriptions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve subscription",
        variant: "destructive",
      });
    }
  };

  const handleRejectSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'rejected',
          approved_by: user?.id
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription rejected",
      });

      fetchPendingSubscriptions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject subscription",
        variant: "destructive",
      });
    }
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
        <Tabs defaultValue="surveys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="surveys">Survey Management</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscription Requests ({pendingSubscriptions.length})</TabsTrigger>
            <TabsTrigger value="payments">Payment Management ({pendingPayments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-6">
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
                      </div>
                      {survey.category && (
                        <Badge variant="outline" className="mb-2">
                          {survey.category}
                        </Badge>
                      )}
                      <p className="text-muted-foreground mb-4">{survey.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>Reward: Ksh {survey.reward}</span>
                        {survey.duration_minutes && (
                          <span>Duration: {survey.duration_minutes} min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(survey)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSurvey(survey.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Payment Management</h2>
              {pendingPayments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending payments</h3>
                    <p className="text-muted-foreground">All user payments have been processed.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingPayments.map((payment) => (
                    <Card key={payment.user_id} className="border-border/50 shadow-elegant">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {payment.first_name} {payment.last_name}
                              </h3>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {payment.earnings_count} Pending Surveys
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{payment.email}</p>
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              Ksh {payment.total_pending.toFixed(2)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Total pending earnings from {payment.earnings_count} completed surveys
                            </p>
                            <div className="mt-3 text-xs text-muted-foreground">
                              Latest earning: {new Date(payment.earnings[0]?.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleMarkAsPaid(payment.user_id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </Button>
                            <div className="text-xs text-center text-muted-foreground">
                              Will reset user credits
                            </div>
                          </div>
                        </div>
                        
                        {/* Earnings breakdown */}
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-sm font-medium mb-2">Recent Earnings:</p>
                          <div className="grid gap-1">
                            {payment.earnings.slice(0, 3).map((earning) => (
                              <div key={earning.id} className="flex justify-between text-xs text-muted-foreground">
                                <span>Survey completion</span>
                                <span>Ksh {earning.amount.toFixed(2)}</span>
                              </div>
                            ))}
                            {payment.earnings.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{payment.earnings.length - 3} more earnings...
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Subscription Requests</h2>
              {pendingSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                    <p className="text-muted-foreground">All subscription requests have been processed.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingSubscriptions.map((subscription) => (
                    <Card key={subscription.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{subscription.first_name} {subscription.last_name}</h3>
                            <p className="text-sm text-muted-foreground">{subscription.email}</p>
                            <Badge className="mt-2">{subscription.plan_name} - Ksh {subscription.plan_price}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">M-Pesa Code: {subscription.mpesa_code}</p>
                            <p className="text-xs text-muted-foreground">Submitted: {new Date(subscription.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveSubscription(subscription.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectSubscription(subscription.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;