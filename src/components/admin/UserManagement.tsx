import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserWithSubscription {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  total_earnings: number;
  surveys_completed: number;
  credits: number;
  created_at: string;
  current_plan: string | null;
  plan_status: string | null;
  plan_end_date: string | null;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersWithSubscriptions();
  }, []);

  const fetchUsersWithSubscriptions = async () => {
    try {
      // First get all users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Get current subscriptions for all users
      const userIds = usersData?.map(user => user.user_id) || [];
      
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select(`
          user_id,
          status,
          end_date,
          subscription_plans(name)
        `)
        .in("user_id", userIds)
        .gt("end_date", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Create a map of user subscriptions
      const subscriptionMap = new Map();
      subscriptionsData?.forEach((sub: any) => {
        if (!subscriptionMap.has(sub.user_id)) {
          subscriptionMap.set(sub.user_id, {
            plan_name: sub.subscription_plans?.name,
            status: sub.status,
            end_date: sub.end_date
          });
        }
      });

      // Combine user data with subscription data
      const usersWithSubscriptions = usersData?.map((user: any) => {
        const subscription = subscriptionMap.get(user.user_id);
        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          total_earnings: user.total_earnings || 0,
          surveys_completed: user.surveys_completed || 0,
          credits: user.credits || 0,
          created_at: user.created_at,
          current_plan: subscription?.plan_name || "Free Plan",
          plan_status: subscription?.status || "free",
          plan_end_date: subscription?.end_date
        };
      }) || [];

      setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error("Error fetching users with subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "active":
        return "default";
      case "premium":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage registered users and their subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Plan Status</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Surveys</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.current_plan}</div>
                    {user.plan_end_date && (
                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(user.plan_end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.plan_status)}>
                    {user.plan_status || "free"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{user.credits}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">KES {user.total_earnings}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{user.surveys_completed}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};