import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  reward: number;
  duration_minutes: number | null;
  status: string;
}

interface UserSubscription {
  plan_name: string;
  daily_survey_limit: number;
  status: string;
  end_date: string;
}

interface SurveyListProps {
  userId: string;
  userCredits: number;
  onSurveyStart: (survey: Survey) => void;
}

export const SurveyList = ({ userId, userCredits, onSurveyStart }: SurveyListProps) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [dailySurveyCount, setDailySurveyCount] = useState(0);
  const [extraSurveysUnlocked, setExtraSurveysUnlocked] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSurveys(),
        fetchUserSubscription(),
        fetchDailySurveyCount(),
        fetchExtraSurveysUnlocked()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    const { data, error } = await supabase
      .from("surveys")
      .select("*")
      .eq("status", "active")
      .order("reward", { ascending: false });

    if (error) throw error;
    setSurveys(data || []);
  };

  const fetchUserSubscription = async () => {
    const { data } = await supabase.rpc('get_user_current_subscription', {
      user_id_param: userId
    });
    
    setUserSubscription(data?.[0] || null);
  };

  const fetchDailySurveyCount = async () => {
    const { data } = await supabase.rpc('get_daily_survey_count', {
      user_id_param: userId
    });
    
    setDailySurveyCount(data || 0);
  };

  const fetchExtraSurveysUnlocked = async () => {
    const { data } = await supabase
      .from('extra_survey_unlocks')
      .select('surveys_unlocked')
      .eq('user_id', userId)
      .eq('unlock_date', new Date().toISOString().split('T')[0]);
    
    const total = data?.reduce((sum, unlock) => sum + (unlock.surveys_unlocked || 0), 0) || 0;
    setExtraSurveysUnlocked(total);
  };

  const canAccessSurvey = async (survey: Survey) => {
    try {
      const { data: canAccess, error } = await supabase.rpc('can_access_survey', {
        user_id_param: userId,
        survey_id_param: survey.id,
        survey_reward: survey.reward
      });

      if (error) throw error;
      return canAccess;
    } catch (error) {
      console.error('Error checking survey access:', error);
      return false;
    }
  };

  const handleSurveyClick = async (survey: Survey) => {
    const hasAccess = await canAccessSurvey(survey);
    
    if (!hasAccess) {
      if (survey.reward >= 50) {
        toast({
          title: "Premium Survey",
          description: "This survey requires a premium subscription or you've reached your daily limit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Access Restricted",
          description: "You've reached your daily survey limit or this survey has a 24-hour cooldown.",
          variant: "destructive",
        });
      }
      return;
    }

    onSurveyStart(survey);
  };

  const getSurveyAccess = (survey: Survey) => {
    if (survey.reward < 50) {
      return { canAccess: true, reason: "Free survey available to all users" };
    }
    
    if (!userSubscription) {
      return { canAccess: false, reason: "Premium subscription required" };
    }
    
    const totalAllowed = userSubscription.daily_survey_limit + extraSurveysUnlocked;
    if (dailySurveyCount >= totalAllowed) {
      return { canAccess: false, reason: "Daily limit reached" };
    }
    
    return { canAccess: true, reason: "Available with your subscription" };
  };

  if (loading) {
    return <div className="text-center">Loading surveys...</div>;
  }

  const freeSurveys = surveys.filter(s => s.reward < 50);
  const premiumSurveys = surveys.filter(s => s.reward >= 50);

  return (
    <div className="space-y-6">
      {/* Daily Limit Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Daily Survey Status</h3>
              <p className="text-sm text-muted-foreground">
                Completed: {dailySurveyCount} | 
                Limit: {userSubscription ? userSubscription.daily_survey_limit + extraSurveysUnlocked : 1} | 
                Plan: {userSubscription?.plan_name || "Free"}
              </p>
            </div>
            <Badge variant={dailySurveyCount < (userSubscription?.daily_survey_limit || 1) + extraSurveysUnlocked ? "default" : "secondary"}>
              {dailySurveyCount < (userSubscription?.daily_survey_limit || 1) + extraSurveysUnlocked ? "Available" : "Limit Reached"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Free Surveys */}
      {freeSurveys.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Free Surveys (Available to All)</h2>
          <div className="grid gap-4">
            {freeSurveys.map((survey) => {
              const access = getSurveyAccess(survey);
              return (
                <Card key={survey.id} className={access.canAccess ? "hover:shadow-md transition-shadow" : "opacity-60"}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {survey.title}
                        {!access.canAccess && <Lock className="w-4 h-4" />}
                      </CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Free
                      </Badge>
                    </div>
                    <CardDescription>{survey.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>KES {survey.reward}</span>
                        </div>
                        {survey.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{survey.duration_minutes} mins</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Button 
                          onClick={() => handleSurveyClick(survey)}
                          disabled={!access.canAccess}
                          variant={access.canAccess ? "default" : "secondary"}
                        >
                          {access.canAccess ? "Start Survey" : "Restricted"}
                        </Button>
                        {!access.canAccess && (
                          <p className="text-xs text-muted-foreground">{access.reason}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Premium Surveys */}
      {premiumSurveys.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Premium Surveys (Subscription Required)</h2>
          <div className="grid gap-4">
            {premiumSurveys.map((survey) => {
              const access = getSurveyAccess(survey);
              return (
                <Card key={survey.id} className={access.canAccess ? "hover:shadow-md transition-shadow border-orange-200" : "opacity-60 border-gray-200"}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {survey.title}
                        {!access.canAccess && <Lock className="w-4 h-4" />}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                        Premium
                      </Badge>
                    </div>
                    <CardDescription>{survey.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>KES {survey.reward}</span>
                        </div>
                        {survey.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{survey.duration_minutes} mins</span>
                          </div>
                        )}
                        {survey.category && (
                          <Badge variant="outline" className="text-xs">
                            {survey.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Button 
                          onClick={() => handleSurveyClick(survey)}
                          disabled={!access.canAccess}
                          variant={access.canAccess ? "default" : "secondary"}
                        >
                          {access.canAccess ? "Start Survey" : "Restricted"}
                        </Button>
                        {!access.canAccess && (
                          <p className="text-xs text-muted-foreground">{access.reason}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};