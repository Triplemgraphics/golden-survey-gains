import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Unlock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExtraSurveyUnlockProps {
  userId: string;
  userCredits: number;
  onUnlockSuccess?: () => void;
}

export const ExtraSurveyUnlock = ({ userId, userCredits, onUnlockSuccess }: ExtraSurveyUnlockProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const creditsNeeded = 10;

  const handleUnlockSurvey = async () => {
    if (userCredits < creditsNeeded) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits to unlock an extra survey. You have ${userCredits} credits.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('unlock_extra_survey', {
        user_id_param: userId
      });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({
          title: "Extra Survey Unlocked! 🔓",
          description: `You've unlocked 1 extra survey for today using ${(data as any).credits_used} credits!`,
        });
        onUnlockSuccess?.();
      } else {
        toast({
          title: "Failed to Unlock",
          description: (data as any)?.message || "Unable to unlock extra survey.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error unlocking extra survey:', error);
      toast({
        title: "Error",
        description: "Failed to unlock extra survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canUnlock = userCredits >= creditsNeeded;

  return (
    <Card className={`border-2 ${canUnlock ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Unlock className="h-5 w-5" />
          Unlock Extra Survey
        </CardTitle>
        <CardDescription>
          Use credits to unlock additional surveys beyond your daily limit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Coins className="h-4 w-4" />
            Cost: {creditsNeeded} credits
          </span>
          <span className="text-sm text-muted-foreground">
            You have: {userCredits} credits
          </span>
        </div>
        
        <Button
          onClick={handleUnlockSurvey}
          disabled={!canUnlock || loading}
          className="w-full"
          variant={canUnlock ? "default" : "secondary"}
        >
          {loading ? "Unlocking..." : `Unlock for ${creditsNeeded} Credits`}
        </Button>
        
        {!canUnlock && (
          <p className="text-sm text-muted-foreground text-center">
            You need {creditsNeeded - userCredits} more credits to unlock an extra survey
          </p>
        )}
      </CardContent>
    </Card>
  );
};