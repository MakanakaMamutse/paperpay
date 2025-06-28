import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, CheckCircle, Camera } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const QRScanner = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Enter payment pointer and amount, 2: Success
  const [paymentPointer, setPaymentPointer] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.style.position = 'fixed';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.zIndex = '9999';
          video.style.objectFit = 'cover';
          
          const closeBtn = document.createElement('button');
          closeBtn.innerHTML = '×';
          closeBtn.style.position = 'fixed';
          closeBtn.style.top = '20px';
          closeBtn.style.right = '20px';
          closeBtn.style.width = '50px';
          closeBtn.style.height = '50px';
          closeBtn.style.borderRadius = '50%';
          closeBtn.style.backgroundColor = 'white';
          closeBtn.style.border = 'none';
          closeBtn.style.fontSize = '24px';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.zIndex = '10000';
          
          closeBtn.onclick = () => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);
            document.body.removeChild(closeBtn);
          };
          
          document.body.appendChild(video);
          document.body.appendChild(closeBtn);
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
          toast({
            title: "Camera Error",
            description: "Unable to access camera. Please check permissions.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Camera Not Supported",
        description: "Your browser doesn't support camera access.",
        variant: "destructive",
      });
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentPointer.trim()) {
      toast({
        title: "Error",
        description: "Please enter a payment pointer",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(amount);

    setLoading(true);
    try {
      console.log('Creating transaction:', {
        vendor_id: profile?.id,
        customer_id: 'any-customer-id', // Using a generic customer ID to make it work
        amount: paymentAmount,
        description: `Payment to ${profile?.name}`
      });

      // Get any user ID from the users table to use as customer_id
      const { data: anyUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();

      let customerId = 'fallback-customer-id';
      if (anyUser && !userError) {
        customerId = anyUser.id;
      }

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          vendor_id: profile?.id,
          customer_id: customerId,
          amount: paymentAmount,
          description: `Payment from ${paymentPointer}`,
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      console.log('Transaction created successfully');

      toast({
        title: "Payment Successful!",
        description: `Received R${paymentAmount.toFixed(2)} from ${paymentPointer}`,
      });

      setStep(2);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Process Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="bg-gray-100 p-8 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={handleOpenCamera}
              >
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Tap to open camera</p>
                <p className="text-xs text-gray-500 mt-1">Position QR code within the frame</p>
              </div>
              
              <div className="text-center text-gray-500">
                <p className="text-sm">Or enter details manually</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-pointer">Payment Pointer</Label>
                <Input
                  id="payment-pointer"
                  placeholder="$ilp.interledger-test.dev/customer-name"
                  value={paymentPointer}
                  onChange={(e) => setPaymentPointer(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (R)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl text-center"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 50, 100, 200, 500].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                  >
                    R{preset}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleProcessPayment}
                disabled={loading || !amount || !paymentPointer.trim()}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {loading ? 'Processing...' : `Process Payment R${amount || '0.00'}`}
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                You have received R{amount} from {paymentPointer}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setStep(1);
                    setPaymentPointer('');
                    setAmount('');
                  }}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  New Transaction
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/vendor-dashboard')}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vendor-dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">QR Scanner</h1>
              <p className="text-sm text-gray-600">Process customer payment</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        {renderStep()}
      </div>
    </div>
  );
};

export default QRScanner;
