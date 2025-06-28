
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  QrCode, 
  Shield, 
  Users, 
  Play, 
  CheckCircle, 
  ArrowRight,
  Smartphone,
  CreditCard,
  Globe
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <QrCode className="w-8 h-8 text-orange-600" />,
      title: "Simple QR Payments",
      description: "Printed QR cards work with any smartphone. Perfect for taxi drivers, street vendors, and spaza shops."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "Daily Limits & Security",
      description: "Set spending caps like R50/day for safety. Freeze your QR instantly if lost or stolen."
    },
    {
      icon: <Wallet className="w-8 h-8 text-blue-600" />,
      title: "Instant Transfers",
      description: "Powered by Interledger for instant micro-payments. No bank account required, just your wallet."
    },
    {
      icon: <Globe className="w-8 h-8 text-purple-600" />,
      title: "Multi-Vendor Support",
      description: "One QR code works at all your trusted vendors. Pre-approved partners ensure security."
    }
  ];

  const faqs = [
    {
      question: "How do QR codes work with PaperPay+?",
      answer: "Each user gets 8 unique QR codes linked to their Interledger wallet. Use one daily, keep others as backups. If lost, switch to a backup code instantly."
    },
    {
      question: "How do vendors get approved?",
      answer: "Vendors undergo a verification process and are added to your pre-approved list. This ensures you only transact with trusted partners in your community."
    },
    {
      question: "Why Interledger and daily limits?",
      answer: "Interledger enables instant, low-cost payments globally. Daily limits protect you from large losses if your QR code is compromised."
    },
    {
      question: "What if I lose my QR code?",
      answer: "Simply log into the app and switch to one of your 7 backup codes. You can also request a full reset to generate 8 new codes."
    }
  ];

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
              onClick={() => navigate('/app')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Launch App
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-orange-100 text-orange-800 border-orange-200">
            Powered by Interledger Protocol
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Safe, Cashless Payments for
            <span className="block text-orange-600">Everyone</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Empowering South Africa's informal economy with QR-based daily payments. 
            No banking app needed - just scan, pay, and go.
          </p>
          
          {/* Demo Video Placeholder */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 max-w-2xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                <Play className="w-6 h-6 mr-2" />
                Watch Demo Video
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              See how PaperPay+ works in real South African communities
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/app')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
            >
              Launch PaperPay+ App
              <ArrowRight className="w-5 h-5 ml-2" />
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

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              How PaperPay+ Works
            </h3>
            <p className="text-xl text-gray-600">
              A day in the life with PaperPay+
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Get Your QR Cards</h4>
              <p className="text-gray-600">Receive 8 unique QR codes linked to your wallet. Use one daily, keep others as backups.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Vendor Scans & Charges</h4>
              <p className="text-gray-600">Trusted vendors scan your QR, enter amount, and receive instant payment via Interledger.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Stay Within Limits</h4>
              <p className="text-gray-600">Daily spending caps protect you. If QR is lost, switch to backup or reset all codes.</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-8">
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

      {/* Benefits */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Built for Community Commerce
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    {benefit.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            onClick={() => navigate('/app')}
            className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold"
          >
            Launch PaperPay+ App
            <ArrowRight className="w-5 h-5 ml-2" />
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

export default Landing;
