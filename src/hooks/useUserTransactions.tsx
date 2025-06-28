
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export interface UserTransaction {
  id: string;
  vendor_id: string;
  vendor_name: string;
  amount: number;
  description: string | null;
  timestamp: string;
  type: 'spent' | 'received';
}

export const useUserTransactions = () => {
  const { profile } = useUserProfile();
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Get transactions where user is either customer or vendor
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vendor:users!vendor_id(name),
          customer:users!customer_id(name)
        `)
        .or(`customer_id.eq.${profile.id},vendor_id.eq.${profile.id}`)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedTransactions: UserTransaction[] = data?.map(t => ({
        id: t.id,
        vendor_id: t.vendor_id,
        vendor_name: t.vendor?.name || 'Unknown',
        amount: t.amount,
        description: t.description,
        timestamp: t.timestamp,
        type: t.customer_id === profile.id ? 'spent' : 'received',
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (vendorId: string, amount: number, description?: string) => {
    if (!profile) return { error: 'No user profile found' };

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          vendor_id: vendorId,
          customer_id: profile.id,
          amount,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh transactions after creating new one
      await fetchTransactions();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchTransactions();
    }
  }, [profile]);

  return {
    transactions,
    loading,
    fetchTransactions,
    createTransaction,
  };
};
