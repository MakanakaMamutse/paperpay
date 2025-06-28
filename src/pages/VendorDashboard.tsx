
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { QrCode, Wallet, Bell, Search, ArrowLeft } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTransactions } from "@/hooks/useTransactions";
import ProfileDialog from "@/components/ProfileDialog";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { profile, vendorStats, loading: profileLoading } = useUserProfile();
  const { transactions, loading: transactionsLoading } = useTransactions();

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Profile not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div 
                className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center cursor-pointer"
                onClick={() => navigate('/')}
              >
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 
                  className="text-xl font-bold text-gray-900 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  PaperPay+
                </h1>
                <p className="text-sm text-gray-600">Vendor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-gray-400" />
              <ProfileDialog />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Earnings Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 mb-1">Today's Earnings</p>
                  <h2 className="text-2xl font-bold">R {vendorStats?.today_earnings?.toFixed(2) || '0.00'}</h2>
                </div>
                <Wallet className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">This Month</p>
                  <h2 className="text-2xl font-bold text-gray-900">R {vendorStats?.month_earnings?.toFixed(2) || '0.00'}</h2>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">Transactions</p>
                  <h2 className="text-2xl font-bold text-gray-900">{vendorStats?.transaction_count || 0}</h2>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan QR Button */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Accept Payment</h3>
            <p className="text-gray-600 mb-6">Scan customer's QR code to receive payment</p>
            <Button 
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg"
              onClick={() => navigate('/qr-scanner')}
            >
              <QrCode className="w-6 h-6 mr-2" />
              Scan QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactionsLoading ? (
                <p className="text-gray-500 text-center py-4">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">R {transaction.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{transaction.customer_name || 'Customer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        completed
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">{new Date(transaction.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="border-green-300 text-green-600 hover:bg-green-50 py-6"
          >
            View All Transactions
          </Button>
          <Button 
            variant="outline" 
            className="border-green-300 text-green-600 hover:bg-green-50 py-6"
            onClick={() => navigate('/wallet-setup')}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Withdraw Funds
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
