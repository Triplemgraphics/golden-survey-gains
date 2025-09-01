import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyLoginBonusProps {
  userId: string;
}

export const DailyLoginBonus = ({ userId }: DailyLoginBonusProps) => {
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    handleDailyLogin();
  }, [userId]);

  const handleDailyLogin = async () => {
    try {
      const { data, error } = await supabase.rpc('handle_daily_login', {
        user_id_param: userId
      });

      if (error) throw error;

      if ((data as any)?.bonus_awarded) {
        setBonusAwarded(true);
        toast({
          title: "Daily Login Bonus! 🎁",
          description: `You've earned ${(data as any).credits} credits for logging in today!`,
        });
      }
    } catch (error) {
      console.error('Error handling daily login:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (bonusAwarded) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Gift className="h-5 w-5" />
            Daily Login Bonus Earned!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">+1 credit added to your wallet! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return null;
};