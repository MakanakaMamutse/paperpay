
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export interface Transaction {
  id: string;
  vendor_id: string;
  customer_id: string;
  amount: number;
  description: string | null;
  timestamp: string;
  vendor_name?: string;
  customer_name?: string;
}

export const useTransactions = () => {
  const { profile } = useUserProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          vendor:users!vendor_id(name),
          customer:users!customer_id(name)
        `)
        .order('timestamp', { ascending: false })
        .limit(20);

      // Filter based on user role
      if (profile.role === 'customer') {
        query = query.eq('customer_id', profile.id);
      } else {
        query = query.eq('vendor_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedTransactions: Transaction[] = data?.map(t => ({
        id: t.id,
        vendor_id: t.vendor_id,
        customer_id: t.customer_id,
        amount: t.amount,
        description: t.description,
        timestamp: t.timestamp,
        vendor_name: t.vendor?.name,
        customer_name: t.customer?.name,
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
