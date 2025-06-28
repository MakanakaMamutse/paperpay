
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Wallet, LogOut, Edit } from "lucide-react";

const ProfileDialog = () => {
  const { signOut } = useAuth();
  const { profile, wallet, refreshUserData } = useUserProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [balance, setBalance] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet && profile?.role === 'customer') {
      setBalance(wallet.balance?.toString() || '0');
      setDailyLimit(wallet.daily_limit?.toString() || '0');
    }
  }, [wallet, profile]);

  const handleSignOut = async () => {
    try {
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/auth';
    }
  };

  const handleUpdateBalance = async () => {
    if (!wallet || !profile || profile.role !== 'customer') return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          balance: parseFloat(balance) || 0,
          daily_limit: parseFloat(dailyLimit) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your balance and daily limit have been updated successfully.",
      });

      await refreshUserData();
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Details</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Name</Label>
            <p className="text-sm text-gray-600">{profile.name}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <p className="text-sm text-gray-600 capitalize">{profile.role}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Pointer</Label>
            <p className="text-sm text-gray-600 font-mono break-all">
              {wallet?.payment_pointer || 'Not set'}
            </p>
          </div>

          {profile.role === 'customer' && wallet && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Account Details</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-balance" className="text-sm">
                      Account Balance (R)
                    </Label>
                    <Input
                      id="edit-balance"
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-limit" className="text-sm">
                      Daily Spending Limit (R)
                    </Label>
                    <Input
                      id="edit-limit"
                      type="number"
                      step="0.01"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateBalance}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Updating...' : 'Update Balance'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="text-sm font-medium">R {wallet.balance?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Limit:</span>
                    <span className="text-sm font-medium">R {wallet.daily_limit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Spent:</span>
                    <span className="text-sm font-medium">R {wallet.daily_spent?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
