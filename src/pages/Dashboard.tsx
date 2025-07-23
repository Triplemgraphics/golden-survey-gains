import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Crown, 
  LogOut, 
  DollarSign, 
  FileText, 
  Clock, 
  TrendingUp,
  Settings,
  CheckCircle,
  Star,
  Copy,
  Users,
  CreditCard,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import PremiumSurveyModal from "@/components/PremiumSurveyModal";
import PaymentMethodModal from "@/components/PaymentMethodModal";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  total_earnings: number;
  surveys_completed: number;
  credits: number;
  referral_code: string | null;
  test_survey_completed: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  reward: number;
  duration_minutes: number | null;
  status: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
      
      // Check if user needs to take test survey first
      const { data: profileData } = await supabase
        .from("profiles")
        .select("test_survey_completed")
        .eq("user_id", session.user.id)
        .single();

      if (!profileData?.test_survey_completed) {
        navigate("/test-survey");
        return;
      }

      await fetchSurveys();
    } catch (error) {
      console.error("Error checking user:", error);
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
        .eq("status", "active")
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

  const startSurvey = (survey: Survey) => {
    // Check if it's the test survey
    if (survey.title === "Kenya Companies Knowledge Test") {
      navigate("/test-survey");
      return;
    }
    
    // Check if it's a premium survey (reward > 50)
    if (survey.reward > 50) {
      setSelectedSurvey(survey);
      setPremiumModalOpen(true);
    } else {
      toast({
        title: "Survey Started",
        description: "Survey functionality will be available soon!",
      });
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const handlePaymentMethodSuccess = () => {
    toast({
      title: "Success",
      description: "Payment method updated successfully!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Loading your dashboard...</p>
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
                <div className="text-xs text-muted-foreground">Dashboard</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
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
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Ksh {profile?.total_earnings || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.surveys_completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{surveys.length}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.credits || 0}</p>
                  <p className="text-sm text-muted-foreground">Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="surveys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Available Surveys</h2>
              {surveys.length === 0 ? (
                <Card className="border-border/50 shadow-elegant">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No surveys available</h3>
                    <p className="text-muted-foreground">Check back later for new opportunities!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {surveys.map((survey) => (
                    <Card key={survey.id} className="border-border/50 shadow-elegant hover:shadow-lg transition-shadow relative">
                      {survey.reward > 50 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-2 shadow-lg">
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{survey.title}</h3>
                              {survey.reward > 50 && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
                                  Premium
                                </Badge>
                              )}
                              {survey.category && (
                                <Badge variant="secondary">{survey.category}</Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-4">{survey.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span className={survey.reward > 50 ? "text-yellow-600 font-semibold" : ""}>
                                  Ksh {survey.reward}
                                </span>
                              </div>
                              {survey.duration_minutes && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{survey.duration_minutes} mins</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button 
                            onClick={() => startSurvey(survey)}
                            className={`ml-4 ${survey.reward > 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700' : ''}`}
                          >
                            {survey.reward > 50 ? (
                              <>
                                <Crown className="w-4 h-4 mr-2" />
                                Premium
                              </>
                            ) : (
                              "Start Survey"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Survey History</h2>
              <Card className="border-border/50 shadow-elegant">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed surveys yet</h3>
                  <p className="text-muted-foreground">Complete your first survey to see your history here!</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Referral Program</h2>
              <div className="grid gap-6">
                <Card className="border-border/50 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Your Referral Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input 
                        value={profile?.referral_code || ""} 
                        readOnly 
                        className="font-mono text-lg"
                      />
                      <Button onClick={copyReferralCode} size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this code with friends and earn 10 credits for each successful signup!
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-elegant">
                  <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">1</div>
                      <div>
                        <p className="font-medium">Share your code</p>
                        <p className="text-sm text-muted-foreground">Send your referral code to friends</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">2</div>
                      <div>
                        <p className="font-medium">They sign up</p>
                        <p className="text-sm text-muted-foreground">Friends use your code during registration</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">3</div>
                      <div>
                        <p className="font-medium">You both earn</p>
                        <p className="text-sm text-muted-foreground">Get 10 credits for each successful referral</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
              <Card className="border-border/50 shadow-elegant">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <p className="text-lg">{profile?.first_name || "Not set"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <p className="text-lg">{profile?.last_name || "Not set"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-lg">{profile?.email || "Not set"}</p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button onClick={() => setPaymentModalOpen(true)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {selectedSurvey && (
        <PremiumSurveyModal
          isOpen={premiumModalOpen}
          onClose={() => setPremiumModalOpen(false)}
          survey={selectedSurvey}
          userCredits={profile?.credits || 0}
        />
      )}

      <PaymentMethodModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentMethodSuccess}
      />
    </div>
  );
};

export default Dashboard;