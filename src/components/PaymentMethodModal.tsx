import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Building, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentMethodModal = ({ isOpen, onClose, onSuccess }: PaymentMethodModalProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mpesa");
  const { toast } = useToast();

  // M-Pesa form data
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaName, setMpesaName] = useState("");

  // Bank Transfer form data
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // PayPal form data
  const [paypalEmail, setPaypalEmail] = useState("");

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let details = {};
      let methodType = activeTab;

      switch (activeTab) {
        case "mpesa":
          if (!mpesaPhone || !mpesaName) {
            toast({
              title: "Error",
              description: "Please fill in all M-Pesa details",
              variant: "destructive",
            });
            return;
          }
          details = { phone: mpesaPhone, name: mpesaName };
          break;
        
        case "bank_transfer":
          if (!bankName || !accountNumber || !accountName) {
            toast({
              title: "Error",
              description: "Please fill in all bank details",
              variant: "destructive",
            });
            return;
          }
          details = { bankName, accountNumber, accountName };
          break;
        
        case "paypal":
          if (!paypalEmail) {
            toast({
              title: "Error",
              description: "Please enter your PayPal email",
              variant: "destructive",
            });
            return;
          }
          details = { email: paypalEmail };
          break;
      }

      // First, set all existing methods as non-default
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Insert new payment method as default
      const { error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          method_type: methodType,
          details,
          is_default: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment method saved successfully!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mpesa" className="text-xs">
              <Smartphone className="w-4 h-4 mr-1" />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="bank_transfer" className="text-xs">
              <Building className="w-4 h-4 mr-1" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="paypal" className="text-xs">
              <CreditCard className="w-4 h-4 mr-1" />
              PayPal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mpesa" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">Phone Number</Label>
              <Input
                id="mpesa-phone"
                placeholder="+254 7XX XXX XXX"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpesa-name">Account Name</Label>
              <Input
                id="mpesa-name"
                placeholder="John Doe"
                value={mpesaName}
                onChange={(e) => setMpesaName(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="bank_transfer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                placeholder="Equity Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="John Doe"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paypal-email">PayPal Email</Label>
              <Input
                id="paypal-email"
                type="email"
                placeholder="john@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Method"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;