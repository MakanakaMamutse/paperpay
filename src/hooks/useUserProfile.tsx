
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  role: 'customer' | 'vendor';
  created_at: string;
  updated_at: string;
}

export interface WalletInfo {
  id: string;
  user_id: string;
  payment_pointer: string;
  balance: number;
  daily_limit: number;
  daily_spent: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface VendorStats {
  id: string;
  vendor_id: string;
  total_earnings: number;
  transaction_count: number;
  today_earnings: number;
  month_earnings: number;
  last_transaction_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setNeedsOnboarding(true);
          } else {
            console.error('Error fetching profile:', profileError);
          }
          setLoading(false);
          return;
        }

        const typedProfile: UserProfile = {
          ...profileData,
          role: profileData.role as 'customer' | 'vendor'
        };
        setProfile(typedProfile);

        // Fetch wallet info
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', profileData.id)
          .single();

        if (!walletError && walletData) {
          setWallet(walletData);
        }

        // Fetch vendor stats if user is a vendor
        if (profileData.role === 'vendor') {
          const { data: statsData, error: statsError } = await supabase
            .from('vendor_stats')
            .select('*')
            .eq('vendor_id', profileData.id)
            .single();

          if (!statsError && statsData) {
            setVendorStats(statsData);
          }
        }

        setNeedsOnboarding(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, authLoading]);

  const refreshUserData = async () => {
    if (!user || !profile) return;
    
    // Refresh wallet info
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (!walletError && walletData) {
      setWallet(walletData);
    }

    // Refresh vendor stats if applicable
    if (profile.role === 'vendor') {
      const { data: statsData, error: statsError } = await supabase
        .from('vendor_stats')
        .select('*')
        .eq('vendor_id', profile.id)
        .single();

      if (!statsError && statsData) {
        setVendorStats(statsData);
      }
    }
  };

  return {
    profile,
    wallet,
    vendorStats,
    loading,
    needsOnboarding,
    refreshUserData,
  };
};
