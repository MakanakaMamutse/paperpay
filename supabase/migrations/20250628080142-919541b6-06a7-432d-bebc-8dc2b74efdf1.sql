
-- Create users table to store user profiles
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'vendor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallets table to separate wallet info from user profiles
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    payment_pointer TEXT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    daily_limit DECIMAL(10,2) DEFAULT 0.00,
    daily_spent DECIMAL(10,2) DEFAULT 0.00,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create user_vendors table for users to manage their vendor list
CREATE TABLE public.user_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, vendor_id)
);

-- Create vendor_stats table to track vendor earnings
CREATE TABLE public.vendor_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    transaction_count INTEGER DEFAULT 0,
    today_earnings DECIMAL(10,2) DEFAULT 0.00,
    month_earnings DECIMAL(10,2) DEFAULT 0.00,
    last_transaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.users(id) NOT NULL,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table for approved vendors (legacy support)
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payment_pointer TEXT UNIQUE NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- RLS Policies for wallets table
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can update their own wallet" ON public.wallets
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can insert their own wallet" ON public.wallets
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

-- RLS Policies for user_vendors table
CREATE POLICY "Users can view their own vendor list" ON public.user_vendors
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can manage their own vendor list" ON public.user_vendors
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

-- RLS Policies for vendor_stats table
CREATE POLICY "Vendors can view their own stats" ON public.vendor_stats
    FOR SELECT USING (vendor_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

CREATE POLICY "Vendors can update their own stats" ON public.vendor_stats
    FOR UPDATE USING (vendor_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text));

-- RLS Policies for transactions table
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text) OR
    vendor_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM public.users WHERE user_id = auth.uid()::text)
  );

-- RLS Policies for vendors table (readable by all authenticated users)
CREATE POLICY "Anyone can view approved vendors" ON public.vendors
  FOR SELECT USING (approved = true);

-- Function to reset daily spending limits
CREATE OR REPLACE FUNCTION reset_daily_spending()
RETURNS void AS $$
BEGIN
    UPDATE public.wallets 
    SET daily_spent = 0.00, 
        last_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update balances and stats after transaction
CREATE OR REPLACE FUNCTION handle_transaction_update()
RETURNS TRIGGER AS $$
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for transaction updates
CREATE TRIGGER transaction_update_trigger
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_transaction_update();

-- Insert some sample approved vendors
INSERT INTO public.vendors (name, payment_pointer, approved) VALUES
  ('Local Taxi Services', '$ilp.interledger-test.dev/taxi-co', true),
  ('Corner Spaza Shop', '$ilp.interledger-test.dev/spaza-shop', true),
  ('Street Food Vendor', '$ilp.interledger-test.dev/street-food', true),
  ('Mini Market', '$ilp.interledger-test.dev/mini-market', true);
