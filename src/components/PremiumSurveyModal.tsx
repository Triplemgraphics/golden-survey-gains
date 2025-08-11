import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Star, CreditCard, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  daily_survey_limit: number;
  duration_days: number;
  benefits?: string[];
}

interface PremiumSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: {
    title: string;
    reward: number;
    description: string | null;
  };
  userCredits: number;
  userId: string;
}

const PremiumSurveyModal = ({ isOpen, onClose, survey, userCredits, userId }: PremiumSurveyModalProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const { toast } = useToast();
  const creditsNeeded = 5; // Credits needed to access premium survey

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: false }); // Highest to lowest

      if (error) throw error;
      
      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        benefits: Array.isArray(plan.benefits) ? plan.benefits : 
                 typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : []
      }));
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handlePurchaseCredits = () => {
    setShowPlans(true);
  };

  const handleAccessSurvey = async () => {
    if (userCredits < creditsNeeded) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits to access this premium survey.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // TODO: Implement credit deduction and survey access
    toast({
      title: "Premium Survey Access",
      description: "Premium survey functionality coming soon!",
    });
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            {showPlans ? 'Choose Your Premium Plan' : 'Premium Survey Access'}
          </DialogTitle>
        </DialogHeader>
        
        {!showPlans ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{survey.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{survey.description}</p>
              <div className="flex items-center justify-center gap-2 text-lg font-bold text-green-600">
                <Star className="w-5 h-5" />
                Ksh {survey.reward}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credits Required:</span>
                <span className="font-bold">{creditsNeeded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Credits:</span>
                <span className={`font-bold ${userCredits >= creditsNeeded ? 'text-green-600' : 'text-red-500'}`}>
                  {userCredits}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {userCredits >= creditsNeeded ? (
                <Button 
                  onClick={handleAccessSurvey} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Accessing..." : "Access Premium Survey"}
                </Button>
              ) : (
                <Button 
                  onClick={handlePurchaseCredits}
                  className="w-full"
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Get Premium Access
                </Button>
              )}
              <Button variant="ghost" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>💡 Tip: Refer friends to earn 10 credits per signup!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Upgrade to premium and unlock more surveys with higher rewards!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="relative cursor-pointer hover:border-primary transition-colors"
                >
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      {plan.name}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-primary">Ksh {plan.price}</span>
                      <span className="text-sm text-muted-foreground">/30 days</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Up to {plan.daily_survey_limit} surveys per day</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Access to premium surveys</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Higher reward amounts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Priority support</span>
                      </div>
                      {plan.benefits && plan.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full">
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowPlans(false)} className="flex-1">
                Back
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>All plans are valid for 30 days from activation</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PremiumSurveyModal;