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
  Plus,
  Wallet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import PremiumSurveyModal from "@/components/PremiumSurveyModal";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import SubscriptionModal from "@/components/SubscriptionModal";
import FreeSurvey from "@/components/FreeSurvey";
import WalletComponent from "@/components/Wallet";

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

interface PaymentMethod {
  id: string;
  method_type: string;
  details: any;
  is_default: boolean;
}

interface Subscription {
  plan_name: string;
  daily_survey_limit: number;
  status: string;
  end_date: string;
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
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dailySurveyCount, setDailySurveyCount] = useState(0);
  const [showFreeSurvey, setShowFreeSurvey] = useState(false);
  const [freeSurveyCompleted, setFreeSurveyCompleted] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
      await fetchSubscription(session.user.id);
      await fetchDailySurveyCount(session.user.id);
      await fetchPaymentMethods(session.user.id);
      
      // Check if free survey is completed
      const { data: freeSurveyData } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("survey_id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();
      
      if (freeSurveyData) {
        setFreeSurveyCompleted(true);
      }
      
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

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_current_subscription', { user_id_param: userId });

      if (error) throw error;
      if (data && data.length > 0) {
        setSubscription(data[0]);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const fetchDailySurveyCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_daily_survey_count', { user_id_param: userId });

      if (error) throw error;
      setDailySurveyCount(data || 0);
    } catch (error) {
      console.error("Error fetching daily survey count:", error);
    }
  };

  const fetchPaymentMethods = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
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

  const startSurvey = async (survey: Survey) => {
    // Check if it's the test survey
    if (survey.title === "Kenya Companies Knowledge Test") {
      navigate("/test-survey");
      return;
    }

    // Check daily limits
    const maxDaily = subscription ? subscription.daily_survey_limit : 1;
    if (dailySurveyCount >= maxDaily) {
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your daily limit of ${maxDaily} surveys. ${!subscription ? 'Upgrade to premium for more surveys!' : 'Try again tomorrow.'}`,
        variant: "destructive",
      });
      if (!subscription) {
        setSubscriptionModalOpen(true);
      }
      return;
    }

    // Check if free user trying to access premium survey
    if (!subscription && survey.reward >= 50) {
      toast({
        title: "Premium Survey",
        description: "This survey requires a premium subscription. Upgrade to access high-reward surveys!",
        variant: "destructive",
      });
      setSubscriptionModalOpen(true);
      return;
    }
    
    // Record survey access
    try {
      await supabase
        .from('daily_survey_access')
        .insert({
          user_id: user?.id,
          survey_id: survey.id
        });
      
      // Refresh daily count
      if (user?.id) {
        await fetchDailySurveyCount(user.id);
      }
      
      toast({
        title: "Survey Started",
        description: "Survey functionality will be available soon!",
      });
    } catch (error) {
      console.error('Error recording survey access:', error);
      toast({
        title: "Error",
        description: "Failed to start survey. Please try again.",
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

  const handlePaymentMethodSuccess = () => {
    toast({
      title: "Success",
      description: "Payment method updated successfully!",
    });
    // Refresh payment methods
    if (user?.id) {
      fetchPaymentMethods(user.id);
    }
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
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 sm:w-6 h-4 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm sm:text-lg bg-gradient-primary bg-clip-text text-transparent truncate">
                  Survey Africa
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">Dashboard</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setWalletModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Wallet className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden xs:inline">Ksh </span>{profile?.total_earnings || 0}
              </Button>
              <div className="text-right hidden md:block min-w-0">
                <p className="font-medium text-sm truncate">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-shrink-0">
                <LogOut className="w-3 sm:w-4 h-3 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        {/* Subscription Status */}
        {subscription ? (
          <Card className="border-border/50 shadow-elegant mb-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Premium Active: {subscription.plan_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Daily surveys used: {dailySurveyCount}/{subscription.daily_survey_limit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <Progress value={(dailySurveyCount / subscription.daily_survey_limit) * 100} className="w-24 mb-2" />
                  <p className="text-xs text-muted-foreground">Usage Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-elegant mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Free Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Daily surveys used: {dailySurveyCount}/1 • Surveys under Ksh 50 only
                    </p>
                  </div>
                </div>
                <Button onClick={() => setSubscriptionModalOpen(true)} className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-full sm:w-auto">
                  <Crown className="w-4 h-4 mr-2" />
                  Go Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* Main Content */}
        <Tabs defaultValue="surveys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto lg:mx-0">
            <TabsTrigger value="surveys" className="text-xs sm:text-sm">Surveys</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="referrals" className="text-xs sm:text-sm">Referrals</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-6">
            {showFreeSurvey ? (
              <div>
                <FreeSurvey 
                  onComplete={() => {
                    setShowFreeSurvey(false);
                    setFreeSurveyCompleted(true);
                    if (user?.id) {
                      fetchProfile(user.id);
                    }
                  }}
                  onBack={() => setShowFreeSurvey(false)}
                  userId={user?.id || ""}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">Available Surveys</h2>
                
                {/* Free Survey Card - Always at top */}
                <Card className={`border-border/50 shadow-elegant hover:shadow-lg transition-shadow mb-6 ${
                  freeSurveyCompleted 
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                }`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">Free Demographics Survey</h3>
                          {freeSurveyCompleted ? (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Free
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">Demographics</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4 text-sm">
                          {freeSurveyCompleted 
                            ? "You have successfully completed the demographics survey. Thank you for your participation!"
                            : "Share your basic demographic information to help us understand our community better. Complete this survey to earn your first reward!"
                          }
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span className={freeSurveyCompleted ? "text-gray-600" : "text-green-600 font-semibold"}>Ksh 25</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>5-8 minutes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>No subscription required</span>
                          </div>
                        </div>
                      </div>
                       <div className="flex flex-col gap-2 flex-shrink-0">
                         <Button 
                           onClick={() => {
                             if (freeSurveyCompleted) {
                               toast({
                                 title: "Survey Completed",
                                 description: "You have already completed this survey. Each user can only complete it once.",
                               });
                             } else {
                               setShowFreeSurvey(true);
                             }
                           }}
                           className={freeSurveyCompleted 
                             ? "bg-gray-400 hover:bg-gray-500 cursor-not-allowed w-full sm:w-auto" 
                             : "bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                           }
                           disabled={freeSurveyCompleted}
                           size="sm"
                         >
                           {freeSurveyCompleted ? "Done" : "Start Survey"}
                         </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
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
                       <CardContent className="p-4 sm:p-6">
                         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                           <div className="flex-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-2 mb-2">
                               <h3 className="font-semibold text-lg">{survey.title}</h3>
                               {survey.reward > 50 && (
                                 <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 text-xs">
                                   Premium
                                 </Badge>
                               )}
                               {survey.category && (
                                 <Badge variant="secondary" className="text-xs">{survey.category}</Badge>
                               )}
                             </div>
                             <p className="text-muted-foreground mb-4 text-sm">{survey.description}</p>
                             <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                             className={`w-full sm:w-auto sm:ml-4 flex-shrink-0 ${survey.reward > 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700' : ''}`}
                             size="sm"
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
           )}
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
                  
                  {/* Payment Methods Section */}
                  <div className="mt-6">
                    <label className="text-sm font-medium">Payment Methods</label>
                    {paymentMethods.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize">{method.method_type}</span>
                                {method.is_default && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {method.method_type === 'mpesa' && `••••${method.details.phone?.slice(-4) || ''}`}
                                {method.method_type === 'bank_transfer' && `${method.details.bank_name || ''} ••••${method.details.account_number?.slice(-4) || ''}`}
                                {method.method_type === 'paypal' && method.details.email}
                                {(method.method_type === 'pi_network' || method.method_type === 'usdt') && method.details.wallet_address}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-2">No payment methods added</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button 
                      onClick={() => setWalletModalOpen(true)}
                      variant="outline"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet
                    </Button>
                    <Button onClick={() => setPaymentModalOpen(true)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {paymentMethods.length > 0 ? "Update Payment Method" : "Add Payment Method"}
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
        subscription={subscription}
      />
    </div>
  );
};

export default Dashboard;