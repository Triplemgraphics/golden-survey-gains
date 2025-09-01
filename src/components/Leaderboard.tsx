import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  total_earnings: number;
  surveys_completed: number;
  referral_count?: number;
}

export const Leaderboard = () => {
  const [topEarners, setTopEarners] = useState<LeaderboardEntry[]>([]);
  const [topReferrers, setTopReferrers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Fetch top earners
      const { data: earners, error: earnersError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, total_earnings, surveys_completed')
        .order('total_earnings', { ascending: false })
        .limit(10);

      if (earnersError) throw earnersError;

      // Fetch top referrers
      const { data: referrers, error: referrersError } = await supabase
        .from('profiles')
        .select(`
          user_id, 
          first_name, 
          last_name, 
          email,
          total_earnings,
          surveys_completed
        `)
        .order('total_earnings', { ascending: false })
        .limit(10);

      if (referrersError) throw referrersError;

      setTopEarners(earners || []);
      setTopReferrers(referrers || []); // Note: We'll need to add referral counting logic
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">#{rank}</span>;
    }
  };

  const formatName = (entry: LeaderboardEntry) => {
    if (entry.first_name || entry.last_name) {
      return `${entry.first_name || ''} ${entry.last_name || ''}`.trim();
    }
    return entry.email?.split('@')[0] || 'Anonymous';
  };

  const renderLeaderboardList = (entries: LeaderboardEntry[], type: 'earnings' | 'referrals') => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-100 rounded">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center space-x-3 p-3 rounded-lg border ${
              index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(index + 1)}
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {formatName(entry).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <p className="font-medium text-sm">{formatName(entry)}</p>
              <p className="text-xs text-muted-foreground">
                {type === 'earnings' 
                  ? `KES ${entry.total_earnings} • ${entry.surveys_completed} surveys`
                  : `${entry.referral_count || 0} referrals • KES ${entry.total_earnings}`
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="earnings">Top Earners</TabsTrigger>
            <TabsTrigger value="referrers">Top Referrers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="earnings" className="mt-4">
            {renderLeaderboardList(topEarners, 'earnings')}
          </TabsContent>
          
          <TabsContent value="referrers" className="mt-4">
            {renderLeaderboardList(topReferrers, 'referrals')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};