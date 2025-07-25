import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, CreditCard, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  daily_survey_limit: number;
  duration_days: number;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const SubscriptionModal = ({ isOpen, onClose, userId }: SubscriptionModalProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [step, setStep] = useState<'plans' | 'payment'>('plans');
  const [mpesaCode, setMpesaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const paybillNumber = "12345"; // Replace with actual paybill
  const accountNumber = "survey-africa"; // Replace with actual account

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
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !mpesaCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your M-Pesa confirmation code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: selectedPlan.id,
          mpesa_code: mpesaCode.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Payment Submitted!",
        description: "Your subscription request has been submitted for admin approval.",
      });

      onClose();
      setStep('plans');
      setSelectedPlan(null);
      setMpesaCode('');
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('plans');
    setSelectedPlan(null);
    setMpesaCode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            {step === 'plans' ? 'Choose Your Premium Plan' : 'Complete Payment'}
          </DialogTitle>
        </DialogHeader>

        {step === 'plans' && (
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
                  onClick={() => handlePlanSelect(plan)}
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
                    </div>
                    <Button className="w-full" onClick={() => handlePlanSelect(plan)}>
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>All plans are valid for 30 days from activation</p>
            </div>
          </div>
        )}

        {step === 'payment' && selectedPlan && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selected Plan: {selectedPlan.name}</CardTitle>
                <CardDescription>
                  Ksh {selectedPlan.price} for {selectedPlan.duration_days} days
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  M-Pesa Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">Follow these steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to M-Pesa on your phone</li>
                    <li>Select "Lipa na M-Pesa"</li>
                    <li>Select "Pay Bill"</li>
                    <li>Enter the business number below</li>
                    <li>Enter the account number below</li>
                    <li>Enter the amount: Ksh {selectedPlan.price}</li>
                    <li>Enter your M-Pesa PIN</li>
                    <li>Copy the confirmation code and paste it below</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Number (Paybill)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={paybillNumber} readOnly />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(paybillNumber)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={accountNumber} readOnly />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(accountNumber)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Amount</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={`Ksh ${selectedPlan.price}`} readOnly />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(selectedPlan.price.toString())}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mpesa-code">M-Pesa Confirmation Code *</Label>
                <Input
                  id="mpesa-code"
                  placeholder="e.g., QBR7G5K2M3"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the confirmation code you received via SMS after making the payment
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back to Plans
                </Button>
                <Button 
                  onClick={handleSubmitPayment} 
                  disabled={loading || !mpesaCode.trim()}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Submit Payment"}
                </Button>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>⚠️ Your subscription will be activated after admin approval (usually within 24 hours)</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;