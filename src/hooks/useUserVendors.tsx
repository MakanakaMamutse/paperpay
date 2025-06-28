
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export interface UserVendor {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_payment_pointer: string;
  added_at: string;
}

export const useUserVendors = () => {
  const { profile } = useUserProfile();
  const [userVendors, setUserVendors] = useState<UserVendor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserVendors = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // First get the user vendors
      const { data: userVendorData, error: userVendorError } = await supabase
        .from('user_vendors')
        .select('*')
        .eq('user_id', profile.id)
        .order('added_at', { ascending: false });

      if (userVendorError) throw userVendorError;

      // Then get vendor details and wallet info separately
      const vendorIds = userVendorData?.map(uv => uv.vendor_id) || [];
      
      if (vendorIds.length === 0) {
        setUserVendors([]);
        setLoading(false);
        return;
      }

      const { data: vendorDetails, error: vendorError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', vendorIds);

      if (vendorError) throw vendorError;

      const { data: walletDetails, error: walletError } = await supabase
        .from('wallets')
        .select('user_id, payment_pointer')
        .in('user_id', vendorIds);

      if (walletError) throw walletError;

      // Combine the data
      const formattedVendors: UserVendor[] = userVendorData?.map(uv => {
        const vendor = vendorDetails?.find(v => v.id === uv.vendor_id);
        const wallet = walletDetails?.find(w => w.user_id === uv.vendor_id);
        
        return {
          id: uv.id,
          vendor_id: uv.vendor_id,
          vendor_name: vendor?.name || 'Unknown Vendor',
          vendor_payment_pointer: wallet?.payment_pointer || '',
          added_at: uv.added_at,
        };
      }) || [];

      setUserVendors(formattedVendors);
    } catch (error) {
      console.error('Error fetching user vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVendor = async (vendorId: string) => {
    if (!profile) return { error: 'No user profile found' };

    try {
      const { data, error } = await supabase
        .from('user_vendors')
        .insert({
          user_id: profile.id,
          vendor_id: vendorId,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh vendor list
      await fetchUserVendors();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error adding vendor:', error);
      return { data: null, error };
    }
  };

  const removeVendor = async (vendorId: string) => {
    if (!profile) return { error: 'No user profile found' };

    try {
      const { error } = await supabase
        .from('user_vendors')
        .delete()
        .eq('user_id', profile.id)
        .eq('vendor_id', vendorId);

      if (error) throw error;

      // Refresh vendor list
      await fetchUserVendors();
      
      return { error: null };
    } catch (error) {
      console.error('Error removing vendor:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (profile && profile.role === 'customer') {
      fetchUserVendors();
    }
  }, [profile]);

  return {
    userVendors,
    loading,
    fetchUserVendors,
    addVendor,
    removeVendor,
  };
};
