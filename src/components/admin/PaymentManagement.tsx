import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionRequest {
  id: string;
  user_id: string;
  plan_name: string;
  mpesa_code: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  plan_price: number;
}

interface EarningsRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  survey_title: string;
}

interface UserWallet {
  user_id: string;
  user_name: string;
  user_email: string;
  credits: number;
  total_earnings: number;
  total_paid: number;
  balance: number;
}

export const PaymentManagement = () => {
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [earningsRequests, setEarningsRequests] = useState<EarningsRequest[]>([]);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSubscriptionRequests(),
        fetchEarningsRequests(),
        fetchUserWallets()
      ]);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionRequests = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        mpesa_code,
        status,
        created_at,
        subscription_plans(name, price),
        profiles(first_name, last_name, email)
      `)
      .in("status", ["pending", "premium"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscription requests:", error);
      return;
    }

    const formattedData = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      plan_name: item.subscription_plans?.name || "Unknown Plan",
      plan_price: item.subscription_plans?.price || 0,
      mpesa_code: item.mpesa_code,
      status: item.status,
      created_at: item.created_at,
      user_name: `${item.profiles?.first_name || ""} ${item.profiles?.last_name || ""}`.trim(),
      user_email: item.profiles?.email || ""
    })) || [];

    setSubscriptionRequests(formattedData);
  };

  const fetchEarningsRequests = async () => {
    const { data, error } = await supabase
      .from("earnings")
      .select(`
        id,
        user_id,
        amount,
        status,
        created_at,
        profiles(first_name, last_name, email),
        surveys(title)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching earnings requests:", error);
      return;
    }

    const formattedData = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      amount: item.amount,
      status: item.status,
      created_at: item.created_at,
      user_name: `${item.profiles?.first_name || ""} ${item.profiles?.last_name || ""}`.trim(),
      user_email: item.profiles?.email || "",
      survey_title: item.surveys?.title || "Unknown Survey"
    })) || [];

    setEarningsRequests(formattedData);
  };

  const fetchUserWallets = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        user_id,
        first_name,
        last_name,
        email,
        credits,
        total_earnings
      `)
      .order("total_earnings", { ascending: false });

    if (error) {
      console.error("Error fetching user wallets:", error);
      return;
    }

    // Get paid earnings for each user
    const { data: paidEarnings } = await supabase
      .from("earnings")
      .select("user_id, amount")
      .eq("status", "approved");

    const paidByUser = paidEarnings?.reduce((acc: any, earning: any) => {
      acc[earning.user_id] = (acc[earning.user_id] || 0) + Number(earning.amount);
      return acc;
    }, {}) || {};

    const formattedData = data?.map((user: any) => {
      const totalPaid = paidByUser[user.user_id] || 0;
      const balance = Number(user.total_earnings) - totalPaid;
      
      return {
        user_id: user.user_id,
        user_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        user_email: user.email || "",
        credits: Number(user.credits) || 0,
        total_earnings: Number(user.total_earnings) || 0,
        total_paid: totalPaid,
        balance: balance
      };
    }) || [];

    setUserWallets(formattedData);
  };

  const handleSubscriptionApproval = async (subscriptionId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: approve ? "active" : "rejected",
          approved_by: approve ? (await supabase.auth.getUser()).data.user?.id : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast({
        title: approve ? "Subscription Approved" : "Subscription Rejected",
        description: `Subscription has been ${approve ? "approved" : "rejected"} successfully.`,
      });

      await fetchSubscriptionRequests();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription status.",
        variant: "destructive",
      });
    }
  };

  const handleEarningsApproval = async (earningsId: string, approve: boolean) => {
    try {
      const { error } = await supabase.rpc("update_earnings_status", {
        p_earnings_id: earningsId,
        p_new_status: approve ? "approved" : "rejected",
        p_admin_notes: approve ? "Approved by admin" : "Rejected by admin"
      });

      if (error) throw error;

      toast({
        title: approve ? "Payment Approved" : "Payment Rejected",
        description: `Payment has been ${approve ? "approved and processed" : "rejected"}.`,
      });

      await Promise.all([fetchEarningsRequests(), fetchUserWallets()]);
    } catch (error) {
      console.error("Error updating earnings:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading payment data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Subscriptions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionRequests.filter(s => s.status === "pending").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earningsRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              KES {earningsRequests.reduce((sum, earning) => sum + Number(earning.amount), 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {userWallets.reduce((sum, wallet) => sum + wallet.balance, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscription Requests</TabsTrigger>
          <TabsTrigger value="payments">Payment Requests</TabsTrigger>
          <TabsTrigger value="wallets">User Wallets</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Requests</CardTitle>
              <CardDescription>Approve or reject subscription requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>M-Pesa Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user_name}</div>
                          <div className="text-sm text-muted-foreground">{request.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.plan_name}</TableCell>
                      <TableCell className="font-mono">{request.mpesa_code}</TableCell>
                      <TableCell>KES {request.plan_price}</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === "pending" ? "secondary" :
                          request.status === "active" ? "default" :
                          request.status === "premium" ? "default" : "destructive"
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubscriptionApproval(request.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSubscriptionApproval(request.id, false)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Requests</CardTitle>
              <CardDescription>Approve earnings payments to users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Survey</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user_name}</div>
                          <div className="text-sm text-muted-foreground">{request.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.survey_title}</TableCell>
                      <TableCell>KES {request.amount}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEarningsApproval(request.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEarningsApproval(request.id, false)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>User Wallets</CardTitle>
              <CardDescription>Track user earnings, payments, and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userWallets.map((wallet) => (
                    <TableRow key={wallet.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wallet.user_name}</div>
                          <div className="text-sm text-muted-foreground">{wallet.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{wallet.credits}</TableCell>
                      <TableCell>KES {wallet.total_earnings}</TableCell>
                      <TableCell>KES {wallet.total_paid}</TableCell>
                      <TableCell>
                        <span className={wallet.balance > 0 ? "text-orange-600 font-medium" : ""}>
                          KES {wallet.balance}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};