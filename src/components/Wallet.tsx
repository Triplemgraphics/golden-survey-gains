import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { 
  Wallet as WalletIcon, 
  ArrowDownToLine, 
  CreditCard, 
  Building, 
  Globe, 
  Bitcoin,
  Crown,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WalletProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentBalance: number;
  subscription: any;
}

interface PaymentMethod {
  type: string;
  details: any;
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  user_id: string;
  survey_id: string;
  paid_at?: string;
}

const MINIMUM_WITHDRAWAL_AMOUNTS = {
  'free': 5000,
  'Basic Premium': 3500,
  'Standard Premium': 3000,
  'Premium Plus': 2500,
};

const Wallet = ({ isOpen, onClose, userId, currentBalance, subscription }: WalletProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const { toast } = useToast();

  const planName = subscription?.plan_name || 'free';
  const minimumAmount = MINIMUM_WITHDRAWAL_AMOUNTS[planName as keyof typeof MINIMUM_WITHDRAWAL_AMOUNTS] || 5000;

  useEffect(() => {
    if (isOpen) {
      fetchWithdrawalHistory();
    }
  }, [isOpen]);

  const fetchWithdrawalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('earnings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawalHistory(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (amount < minimumAmount) {
      toast({
        title: "Minimum withdrawal amount not met",
        description: `Minimum withdrawal for ${planName} plan is Ksh ${minimumAmount.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (amount > currentBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create withdrawal request
      const { error } = await supabase
        .from('earnings')
        .insert({
          user_id: userId,
          amount: -amount, // Negative for withdrawal
          status: 'pending',
          survey_id: '00000000-0000-0000-0000-000000000000', // Special ID for withdrawals
        });

      if (error) throw error;

      // Update profile balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ total_earnings: currentBalance - amount })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been submitted and is pending approval",
      });

      setShowWithdrawalForm(false);
      setWithdrawalAmount("");
      setPaymentDetails({});
      setSelectedPaymentMethod("");
      fetchWithdrawalHistory();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Withdrawal failed",
        description: "There was an error processing your withdrawal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa': return <CreditCard className="w-4 h-4" />;
      case 'bank': return <Building className="w-4 h-4" />;
      case 'paypal': return <Globe className="w-4 h-4" />;
      case 'crypto': return <Bitcoin className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Premium Plus': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Standard Premium': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'Basic Premium': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  const renderPaymentMethodForm = () => {
    switch (selectedPaymentMethod) {
      case 'mpesa':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="mpesa_number">M-Pesa Number</Label>
              <Input
                id="mpesa_number"
                placeholder="254712345678"
                value={paymentDetails.mpesa_number || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, mpesa_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="mpesa_name">Account Name</Label>
              <Input
                id="mpesa_name"
                placeholder="Full name as registered"
                value={paymentDetails.mpesa_name || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, mpesa_name: e.target.value })}
              />
            </div>
          </div>
        );
      case 'bank':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                placeholder="e.g., Equity Bank"
                value={paymentDetails.bank_name || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, bank_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                placeholder="Account number"
                value={paymentDetails.account_number || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, account_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                placeholder="Full name on account"
                value={paymentDetails.account_name || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, account_name: e.target.value })}
              />
            </div>
          </div>
        );
      case 'paypal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="paypal_email">PayPal Email</Label>
              <Input
                id="paypal_email"
                type="email"
                placeholder="your@email.com"
                value={paymentDetails.paypal_email || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, paypal_email: e.target.value })}
              />
            </div>
          </div>
        );
      case 'crypto':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="crypto_type">Cryptocurrency</Label>
              <Select
                value={paymentDetails.crypto_type || ''}
                onValueChange={(value) => setPaymentDetails({ ...paymentDetails, crypto_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pi">Pi Network</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="crypto_address">Wallet Address</Label>
              <Input
                id="crypto_address"
                placeholder="Your wallet address"
                value={paymentDetails.crypto_address || ''}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, crypto_address: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="w-5 h-5" />
            My Wallet
          </DialogTitle>
          <DialogDescription>
            Manage your earnings, withdrawals, and subscription
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WalletIcon className="w-5 h-5" />
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    Ksh {currentBalance.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Available for withdrawal
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Subscription Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`${getPlanBadgeColor(planName)} text-white`}>
                    {planName}
                  </Badge>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Daily Surveys:</span> {subscription?.daily_survey_limit || 1}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Min. Withdrawal:</span> Ksh {minimumAmount.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            {!showWithdrawalForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>Request Withdrawal</CardTitle>
                  <CardDescription>
                    Withdraw your earnings to your preferred payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>Available Balance:</span>
                        <span className="font-bold">Ksh {currentBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span>Minimum Withdrawal ({planName}):</span>
                        <span className="font-medium">Ksh {minimumAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setShowWithdrawalForm(true)} 
                      className="w-full"
                      disabled={currentBalance < minimumAmount}
                    >
                      <ArrowDownToLine className="w-4 h-4 mr-2" />
                      {currentBalance >= minimumAmount ? 'Withdraw Funds' : 'Insufficient Balance'}
                    </Button>
                    
                    {currentBalance < minimumAmount && (
                      <p className="text-sm text-muted-foreground text-center">
                        You need at least Ksh {minimumAmount.toLocaleString()} to withdraw
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Withdrawal Request
                    <Button variant="ghost" size="sm" onClick={() => setShowWithdrawalForm(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="amount">Amount (Ksh)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder={`Min. ${minimumAmount.toLocaleString()}`}
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      min={minimumAmount}
                      max={currentBalance}
                    />
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            M-Pesa
                          </div>
                        </SelectItem>
                        <SelectItem value="bank">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                        <SelectItem value="paypal">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            PayPal
                          </div>
                        </SelectItem>
                        <SelectItem value="crypto">
                          <div className="flex items-center gap-2">
                            <Bitcoin className="w-4 h-4" />
                            Cryptocurrency
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPaymentMethod && renderPaymentMethodForm()}

                  <Button onClick={handleWithdrawal} disabled={loading} className="w-full">
                    {loading ? "Processing..." : "Submit Withdrawal Request"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No transactions yet
                    </p>
                  ) : (
                    withdrawalHistory.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <div className="font-medium">
                              {transaction.amount < 0 ? 'Withdrawal' : 'Earning'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {transaction.amount < 0 ? '-' : '+'}Ksh {Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <Badge variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Wallet;