
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Wallet, QrCode, Shield, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                PaperPay+
              </h1>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Safe, Cashless Payments for
            <span className="block text-orange-600">Everyone</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Empowering South Africa's informal economy with QR-based daily payments. 
            No banking app needed - just scan, pay, and go.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
            >
              Start Using PaperPay+
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Built for Community Commerce
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-orange-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Simple QR Payments</h4>
                <p className="text-gray-600">
                  Printed QR cards work with any smartphone. Perfect for taxi drivers, 
                  street vendors, and spaza shops.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Daily Limits</h4>
                <p className="text-gray-600">
                  Set spending caps like R50/day for safety. Freeze your QR instantly 
                  if lost or stolen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Instant Transfers</h4>
                <p className="text-gray-600">
                  Powered by Interledger for instant micro-payments. No bank account 
                  required, just your wallet.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Case Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <p className="text-xl text-gray-600">
              A day in the life with PaperPay+
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold text-gray-900">Morning Taxi Ride</h4>
                <p className="text-gray-600">Show your QR card → Driver scans → Pay R24 instantly</p>
              </div>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold text-gray-900">Lunch at Spaza Shop</h4>
                <p className="text-gray-600">Same QR card → Shop owner scans → Pay R12 for bread</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-semibold text-gray-900">Daily Limit Protection</h4>
                <p className="text-gray-600">R14 left of your R50 daily limit. Safe and secure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="w-16 h-16 text-white mx-auto mb-6" />
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join the PaperPay+ Community
          </h3>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Empowering vendors, customers, and communities across South Africa. 
            Safe, fast, and inclusive payments for everyone.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/login')}
            className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold">PaperPay+</h4>
          </div>
          <p className="text-gray-400 mb-4">
            Bridging high-tech financial tools with real-world community needs.
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 PaperPay+. Empowering South Africa's informal economy.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
