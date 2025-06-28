
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, User, User2, ArrowLeft } from "lucide-react";

interface UserOnboardingProps {
  onComplete: () => void;
}

const UserOnboarding = ({ onComplete }: UserOnboardingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [name, setName] = useState('');
  const [paymentPointer, setPaymentPointer] = useState('');
  const [balance, setBalance] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No authenticated user found.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Creating profile with data:', {
        user_id: user.id,
        name: name || user.email || 'User',
        role,
        paymentPointer,
        balance: role === 'customer' ? parseFloat(balance) || 0 : null,
        dailyLimit: role === 'customer' ? parseFloat(dailyLimit) || 0 : null,
      });

      // Create user profile first
      const userId = crypto.randomUUID();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          user_id: user.id,
          name: name || user.email || 'User',
          role,
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        throw userError;
      }

      console.log('User created successfully:', userData);

      // Create wallet for the user with role-specific values
      const walletData = {
        user_id: userId,
        payment_pointer: paymentPointer,
        balance: role === 'customer' ? parseFloat(balance) || 0 : null,
        daily_limit: role === 'customer' ? parseFloat(dailyLimit) || 0 : null,
        daily_spent: role === 'customer' ? 0 : null,
      };

      const { data: createdWallet, error: walletError } = await supabase
        .from('wallets')
        .insert(walletData)
        .select()
        .single();

      if (walletError) {
        console.error('Wallet creation error:', walletError);
        throw walletError;
      }

      console.log('Wallet created successfully:', createdWallet);

      // Create vendor stats if user is a vendor
      if (role === 'vendor') {
        const { data: statsData, error: statsError } = await supabase
          .from('vendor_stats')
          .insert({
            vendor_id: userId,
            total_earnings: 0,
            transaction_count: 0,
            today_earnings: 0,
            month_earnings: 0,
          })
          .select()
          .single();

        if (statsError) {
          console.error('Vendor stats creation error:', statsError);
          throw statsError;
        }

        console.log('Vendor stats created successfully:', statsData);
      }

      toast({
        title: "Profile Created!",
        description: `Your PaperPay+ ${role} profile has been set up successfully.`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Welcome to PaperPay+!</CardTitle>
            <p className="text-gray-600">Let's set up your account</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="user-name" className="text-gray-700">
                Your Name
              </Label>
              <Input
                id="user-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 border-orange-200 focus:border-orange-400"
              />
            </div>

            <div>
              <Label className="text-base font-medium text-gray-900 mb-4 block">
                What's your role?
              </Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'customer' | 'vendor')}>
                <div className="flex items-center space-x-3 p-4 border border-orange-200 rounded-lg hover:bg-orange-50">
                  <RadioGroupItem value="customer" />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <Label className="font-medium">Customer</Label>
                      <p className="text-sm text-gray-600">I want to pay with my QR card</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border border-orange-200 rounded-lg hover:bg-orange-50">
                  <RadioGroupItem value="vendor" />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendor</Label>
                      <p className="text-sm text-gray-600">I want to accept payments</p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setStep(2)}
              disabled={!name.trim()}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-200">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Setup Your {role === 'customer' ? 'Wallet' : 'Payment Details'}
          </CardTitle>
          <p className="text-gray-600">
            {role === 'customer' 
              ? 'Configure your Interledger payment details and account limits'
              : 'Enter your payment pointer to receive payments'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="payment-pointer" className="text-gray-700">
              Interledger Payment Pointer
            </Label>
            <Input
              id="payment-pointer"
              placeholder="$ilp.interledger-test.dev/your-name"
              value={paymentPointer}
              onChange={(e) => setPaymentPointer(e.target.value)}
              className="mt-1 border-orange-200 focus:border-orange-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your unique payment identifier (starts with $)
            </p>
          </div>

          {role === 'customer' && (
            <>
              <div>
                <Label htmlFor="balance" className="text-gray-700">
                  Current Account Balance (R)
                </Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="mt-1 border-orange-200 focus:border-orange-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your current account balance
                </p>
              </div>

              <div>
                <Label htmlFor="daily-limit" className="text-gray-700">
                  Daily Spending Limit (R)
                </Label>
                <Input
                  id="daily-limit"
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="mt-1 border-orange-200 focus:border-orange-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set your daily spending limit
                </p>
              </div>
            </>
          )}

          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={!paymentPointer || (role === 'customer' && (!balance || !dailyLimit)) || loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOnboarding;
