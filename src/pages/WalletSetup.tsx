
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft, Check, AlertCircle } from "lucide-react";

const WalletSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'connect' | 'success'>('select');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState('');

  const walletOptions = [
    { id: 'rafiki', name: 'Rafiki Wallet', description: 'Recommended for South African users', popular: true },
    { id: 'interledger', name: 'Interledger Wallet', description: 'Universal Interledger support', popular: false },
    { id: 'other', name: 'Other Wallet', description: 'Connect any Interledger-compatible wallet', popular: false },
  ];

  const handleWalletSelect = (walletId: string) => {
    setSelectedWallet(walletId);
    setStep('connect');
  };

  const handleConnect = () => {
    if (walletAddress) {
      setStep('success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user-dashboard')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Wallet Setup</h1>
                <p className="text-sm text-gray-600">Connect your Interledger wallet</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {step === 'select' && (
          <div className="space-y-4">
            <Card className="border-orange-200">
              <CardHeader className="text-center">
                <CardTitle className="text-gray-900">Choose Your Wallet</CardTitle>
                <p className="text-sm text-gray-600">
                  Select an Interledger-compatible wallet to link with PaperPay+
                </p>
              </CardHeader>
            </Card>

            {walletOptions.map((wallet) => (
              <Card 
                key={wallet.id}
                className="cursor-pointer hover:shadow-lg transition-all border-orange-200 hover:border-orange-400"
                onClick={() => handleWalletSelect(wallet.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
                          {wallet.popular && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{wallet.description}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 'connect' && (
          <Card className="border-orange-200">
            <CardHeader className="text-center">
              <CardTitle className="text-gray-900">
                Connect {walletOptions.find(w => w.id === selectedWallet)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Secure Connection</p>
                  <p className="text-xs text-blue-700">
                    Your wallet information is encrypted and never stored on our servers.
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="wallet-address" className="text-gray-700">
                  Wallet Payment Pointer
                </Label>
                <Input 
                  id="wallet-address"
                  type="text"
                  placeholder="$wallet.example.com/alice"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1 border-orange-200 focus:border-orange-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Interledger payment pointer (starts with $)
                </p>
              </div>
              
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
                onClick={handleConnect}
                disabled={!walletAddress}
              >
                Connect Wallet
              </Button>
              
              <Button 
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => setStep('select')}
              >
                Choose Different Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card className="border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connected!</h2>
              <p className="text-gray-600 mb-6">
                Your {walletOptions.find(w => w.id === selectedWallet)?.name} is now linked to PaperPay+
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-green-800 font-medium">What's Next?</p>
                <p className="text-xs text-green-700">
                  Your QR code is now active and ready for payments. You can start using PaperPay+ immediately!
                </p>
              </div>
              
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
                onClick={() => navigate('/user-dashboard')}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WalletSetup;
