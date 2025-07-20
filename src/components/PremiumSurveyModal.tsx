import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Star, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PremiumSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: {
    title: string;
    reward: number;
    description: string | null;
  };
  userCredits: number;
}

const PremiumSurveyModal = ({ isOpen, onClose, survey, userCredits }: PremiumSurveyModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const creditsNeeded = 5; // Credits needed to access premium survey

  const handlePurchaseCredits = () => {
    toast({
      title: "Credit Purchase",
      description: "Credit purchase system coming soon! Refer friends to earn credits.",
    });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Premium Survey Access
          </DialogTitle>
        </DialogHeader>
        
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
                Get More Credits
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
      </DialogContent>
    </Dialog>
  );
};

export default PremiumSurveyModal;