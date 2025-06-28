
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Plus } from "lucide-react";

interface AddVendorDialogProps {
  onVendorAdded: () => void;
}

const AddVendorDialog = ({ onVendorAdded }: AddVendorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [paymentPointer, setPaymentPointer] = useState('');
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const handleAddVendor = async () => {
    if (!profile || !vendorName.trim() || !paymentPointer.trim()) return;

    setLoading(true);
    try {
      // First, create a vendor user profile
      const vendorId = crypto.randomUUID();
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: vendorId,
          user_id: `vendor_${Date.now()}`, // Temporary user_id for manual vendors
          name: vendorName,
          role: 'vendor',
        });

      if (userError) throw userError;

      // Create wallet for the vendor
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: vendorId,
          payment_pointer: paymentPointer,
          balance: 0,
          daily_limit: 0,
        });

      if (walletError) throw walletError;

      // Create vendor stats
      const { error: statsError } = await supabase
        .from('vendor_stats')
        .insert({
          vendor_id: vendorId,
          total_earnings: 0,
          transaction_count: 0,
          today_earnings: 0,
          month_earnings: 0,
        });

      if (statsError) throw statsError;

      // Add vendor to user's vendor list
      const { error: userVendorError } = await supabase
        .from('user_vendors')
        .insert({
          user_id: profile.id,
          vendor_id: vendorId,
        });

      if (userVendorError) throw userVendorError;

      toast({
        title: "Vendor Added!",
        description: `${vendorName} has been added to your vendor list.`,
      });

      setVendorName('');
      setPaymentPointer('');
      setOpen(false);
      onVendorAdded();
    } catch (error: any) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add vendor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="vendor-name">Vendor Name</Label>
            <Input
              id="vendor-name"
              placeholder="Enter vendor name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="payment-pointer">Payment Pointer</Label>
            <Input
              id="payment-pointer"
              placeholder="$ilp.example.com/vendor"
              value={paymentPointer}
              onChange={(e) => setPaymentPointer(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddVendor}
              disabled={!vendorName.trim() || !paymentPointer.trim() || loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendorDialog;
