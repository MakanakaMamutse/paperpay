
-- Update the user onboarding to properly handle vendor profiles
-- Remove balance and daily limit constraints for vendors in wallets table
ALTER TABLE public.wallets 
ALTER COLUMN balance DROP NOT NULL,
ALTER COLUMN daily_limit DROP NOT NULL;

-- Update wallets table to allow NULL values for vendor accounts
UPDATE public.wallets 
SET balance = NULL, daily_limit = NULL, daily_spent = NULL 
WHERE user_id IN (
  SELECT id FROM public.users WHERE role = 'vendor'
);

-- Create user_transactions table for better transaction tracking
CREATE TABLE IF NOT EXISTS public.user_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_type TEXT DEFAULT 'payment',
  status TEXT DEFAULT 'completed'
);

-- Enable RLS on user_transactions
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own transactions
CREATE POLICY "Users can view their own transactions" 
  ON public.user_transactions 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.users WHERE users.user_id = auth.uid()::text));

-- Create policy for vendors to see transactions where they are the vendor
CREATE POLICY "Vendors can view their transactions" 
  ON public.user_transactions 
  FOR SELECT 
  USING (vendor_id IN (SELECT id FROM public.users WHERE users.user_id = auth.uid()::text));

-- Create policy for inserting transactions (system level)
CREATE POLICY "System can insert transactions" 
  ON public.user_transactions 
  FOR INSERT 
  WITH CHECK (true);

-- Update the handle_transaction_update function to also log user transactions
CREATE OR REPLACE FUNCTION public.handle_transaction_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Reset daily spending if needed
    PERFORM reset_daily_spending();
    
    -- Update customer wallet
    UPDATE public.wallets 
    SET balance = balance - NEW.amount,
        daily_spent = daily_spent + NEW.amount,
        updated_at = NOW()
    WHERE user_id = NEW.customer_id;
    
    -- Update vendor stats
    UPDATE public.vendor_stats
    SET total_earnings = total_earnings + NEW.amount,
        transaction_count = transaction_count + 1,
        today_earnings = CASE 
            WHEN last_transaction_date = CURRENT_DATE 
            THEN today_earnings + NEW.amount 
            ELSE NEW.amount 
        END,
        month_earnings = CASE 
            WHEN EXTRACT(MONTH FROM last_transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM last_transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN month_earnings + NEW.amount 
            ELSE NEW.amount 
        END,
        last_transaction_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE vendor_id = NEW.vendor_id;
    
    -- Log transaction for user_transactions table
    INSERT INTO public.user_transactions (
        user_id, 
        vendor_id, 
        vendor_name, 
        amount, 
        timestamp
    )
    SELECT 
        NEW.customer_id,
        NEW.vendor_id,
        u.name,
        NEW.amount,
        NEW.timestamp
    FROM public.users u 
    WHERE u.id = NEW.vendor_id;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for transactions table if it doesn't exist
DROP TRIGGER IF EXISTS handle_transaction_update_trigger ON public.transactions;
CREATE TRIGGER handle_transaction_update_trigger
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_transaction_update();
