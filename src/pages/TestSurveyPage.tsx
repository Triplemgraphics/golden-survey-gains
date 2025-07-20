import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TestSurvey from "@/components/TestSurvey";

const TestSurveyPage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      // Check if user already took the test
      const { data } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("survey_id", (await getTestSurveyId()));

      if (data && data.length > 0) {
        // Already took test, go to dashboard
        navigate("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const getTestSurveyId = async () => {
    const { data } = await supabase
      .from("surveys")
      .select("id")
      .eq("title", "Kenya Companies Knowledge Test")
      .single();
    
    return data?.id;
  };

  const handleComplete = async (score: number) => {
    if (!user) return;

    try {
      const testSurveyId = await getTestSurveyId();
      
      if (testSurveyId) {
        // Save test response
        await supabase
          .from("survey_responses")
          .insert({
            user_id: user.id,
            survey_id: testSurveyId,
            responses: { score, completed: true, test_type: "knowledge_assessment" }
          });

        // Mark test as completed in profile
        await supabase
          .from("profiles")
          .update({ test_survey_completed: true })
          .eq("user_id", user.id);
      }

      toast({
        title: "Test completed",
        description: "Welcome to Survey Africa! You can now start earning from surveys.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving test response:", error);
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    toast({
      title: "Test skipped",
      description: "You can take the knowledge test later from your dashboard.",
    });
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading test...</p>
        </div>
      </div>
    );
  }

  return <TestSurvey onComplete={handleComplete} onSkip={handleSkip} />;
};

export default TestSurveyPage;