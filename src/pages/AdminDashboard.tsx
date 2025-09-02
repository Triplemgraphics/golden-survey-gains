
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, DollarSign, TrendingUp, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SurveyCreator } from "@/components/SurveyCreator";
import { Leaderboard } from "@/components/Leaderboard";
import type { User } from "@supabase/supabase-js";

interface AdminStats {
  totalUsers: number;
  totalSurveys: number;
  totalEarnings: number;
  activeSurveys: number;
}

interface UserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  total_earnings: number;
  surveys_completed: number;
  created_at: string;
}

interface SurveyData {
  id: string;
  title: string;
  category: string | null;
  reward: number;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSurveys: 0,
    totalEarnings: 0,
    activeSurveys: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (!roleData || roleData.role !== 'admin') {
        navigate("/dashboard");
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        return;
      }

      await fetchDashboardData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [usersCount, surveysCount, earningsSum, activeSurveysCount] = await Promise.all([
        supabase.from("profiles").select("id", { count: 'exact' }),
        supabase.from("surveys").select("id", { count: 'exact' }),
        supabase.from("earnings").select("amount"),
        supabase.from("surveys").select("id", { count: 'exact' }).eq("status", "active")
      ]);

      const totalEarnings = earningsSum.data?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;

      setStats({
        totalUsers: usersCount.count || 0,
        totalSurveys: surveysCount.count || 0,
        totalEarnings,
        activeSurveys: activeSurveysCount.count || 0
      });

      // Fetch users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setUsers(usersData || []);

      // Fetch surveys
      const { data: surveysData } = await supabase
        .from("surveys")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setSurveys(surveysData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Survey Africa Management</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Badge>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="surveys">Create Survey</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSurveys}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalSurveys} total surveys
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {stats.totalEarnings}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12%</div>
                  <p className="text-xs text-muted-foreground">
                    vs last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Surveys</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 5).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.surveys_completed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Surveys</CardTitle>
                  <CardDescription>Latest survey creations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.slice(0, 5).map((survey) => (
                        <TableRow key={survey.id}>
                          <TableCell>{survey.title}</TableCell>
                          <TableCell>KES {survey.reward}</TableCell>
                          <TableCell>
                            <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                              {survey.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="surveys">
            <SurveyCreator />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Surveys</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>KES {user.total_earnings}</TableCell>
                        <TableCell>{user.surveys_completed}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Detailed analytics and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
