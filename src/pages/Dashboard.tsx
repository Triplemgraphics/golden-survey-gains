
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Award, Users, Wallet, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TestSurvey from "@/components/TestSurvey";
import FreeSurvey from "@/components/FreeSurvey";
import PremiumSurveyModal from "@/components/PremiumSurveyModal";
import WalletComponent from "@/components/Wallet";
import SubscriptionModal from "@/components/SubscriptionModal";
import { DailyLoginBonus } from "@/components/DailyLoginBonus";
import { ExtraSurveyUnlock } from "@/components/ExtraSurveyUnlock";
import { SurveyList } from "@/components/SurveyList";
import type { User } from "@supabase/supabase-js";

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
  const [showFreeSurvey, setShowFreeSurvey] = useState(false);
  const [showTestSurvey, setShowTestSurvey] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [dailySurveysCompleted, setDailySurveysCompleted] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  
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
      await fetchProfile(session.user);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (currentUser: User) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Check if user needs to complete test survey
      if (!data.test_survey_completed) {
        setShowTestSurvey(true);
        return;
      }

      // Check if demographics survey is completed
      const { data: freeSurveyData } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("survey_id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();
      
      if (!freeSurveyData) {
        setShowFreeSurvey(true);
      }

      await fetchSurveys();
      await fetchTodayStats(currentUser);
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
        .order("reward", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  const fetchTodayStats = async (currentUser: User) => {
    if (!currentUser) return;

    try {
      // Get today's earnings
      const { data: todayEarningsData } = await supabase
        .from("earnings")
        .select("amount")
        .eq("user_id", currentUser.id)
        .gte("created_at", new Date().toISOString().split('T')[0]);

      const totalToday = todayEarningsData?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      setTodayEarnings(totalToday);

      // Get today's completed surveys
      const { data: todaySurveys } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_id", currentUser.id)
        .gte("completed_at", new Date().toISOString().split('T')[0]);

      setDailySurveysCompleted(todaySurveys?.length || 0);
    } catch (error) {
      console.error("Error fetching today's stats:", error);
    }
  };

  const startSurvey = async (survey: Survey) => {
    try {
      const { data: canAccess, error } = await supabase.rpc('can_access_survey', {
        user_id_param: user?.id,
        survey_id_param: survey.id,
        survey_reward: survey.reward
      });

      if (error) throw error;

      if (!canAccess) {
        if (survey.reward >= 50) {
          toast({
            title: "Premium Survey",
            description: "This survey requires a premium subscription or you've reached your daily limit.",
            variant: "destructive",
          });
          setSubscriptionModalOpen(true);
        } else {
          toast({
            title: "Daily Limit Reached",
            description: "You can only complete one free survey per day. Try again tomorrow!",
            variant: "destructive",
          });
        }
        return;
      }

      setSelectedSurvey(survey);
      setPremiumModalOpen(true);
    } catch (error) {
      console.error('Error checking survey access:', error);
      toast({
        title: "Error",
        description: "Failed to start survey. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (showTestSurvey) {
    return (
      <div className="min-h-screen p-4">
        <TestSurvey 
          onComplete={(score) => {
            setShowTestSurvey(false);
            fetchProfile(user!);
            toast({
              title: "Test Complete!",
              description: `You scored ${score}%. Welcome to Survey Africa!`,
            });
          }}
          onSkip={() => {
            setShowTestSurvey(false);
            fetchProfile(user!);
          }}
        />
      </div>
    );
  }

  if (showFreeSurvey) {
    return (
      <div className="min-h-screen p-4">
        <FreeSurvey 
          onComplete={() => {
            setShowFreeSurvey(false);
            fetchProfile(user!);
          }}
          onBack={() => setShowFreeSurvey(false)}
          userId={user?.id || ""}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Survey Africa</h1>
            <p className="text-muted-foreground">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setWalletModalOpen(true)}>
              <Wallet className="w-4 h-4 mr-2" />
              KES {profile?.total_earnings || 0}
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="surveys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="surveys">Surveys</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Daily Login Bonus */}
          {user && (
            <DailyLoginBonus userId={user.id} />
          )}

          <TabsContent value="surveys" className="space-y-6">
            {/* Extra Survey Unlock */}
            {user && profile && (
              <ExtraSurveyUnlock 
                userId={user.id} 
                userCredits={profile.credits || 0}
                onUnlockSuccess={() => fetchProfile(user)}
              />
            )}

            {/* Survey List */}
            {user && profile && (
              <SurveyList 
                userId={user.id}
                userCredits={profile.credits || 0}
                onSurveyStart={startSurvey}
              />
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {profile?.total_earnings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +KES {todayEarnings} from today
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.credits || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    10 credits = 1 extra survey
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Surveys Completed</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.surveys_completed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dailySurveysCompleted} completed today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{profile?.referral_code || 'Loading...'}</div>
                  <p className="text-xs text-muted-foreground">
                    Share to earn 5 credits per referral
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-lg">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-lg">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Referral Code</label>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono bg-muted px-3 py-2 rounded">{profile?.referral_code}</p>
                    <Button variant="outline" size="sm" onClick={copyReferralCode}>
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share this code to earn 5 credits per referral
                  </p>
                </div>
                <div className="pt-4">
                  <Button onClick={() => setWalletModalOpen(true)}>
                    <Wallet className="w-4 h-4 mr-2" />
                    View Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
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
          userId={user?.id || ""}
        />
      )}

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        userId={user?.id || ''}
      />

      <WalletComponent
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        userId={user?.id || ''}
        currentBalance={profile?.total_earnings || 0}
        subscription={null}
      />
    </div>
  );
};

export default Dashboard;
