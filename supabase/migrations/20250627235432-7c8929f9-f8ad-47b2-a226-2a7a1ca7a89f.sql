
-- Create users table to store user profiles and wallet info
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'vendor')),
  payment_pointer TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  daily_limit DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table for approved vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payment_pointer TEXT UNIQUE NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- RLS Policies for vendors table (readable by all authenticated users)
CREATE POLICY "Anyone can view approved vendors" ON public.vendors
  FOR SELECT USING (approved = true);

-- RLS Policies for transactions table
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub') OR
    vendor_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Vendors can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub' AND role = 'vendor')
  );

-- Insert some sample approved vendors
INSERT INTO public.vendors (name, payment_pointer, approved) VALUES
  ('Local Taxi Services', '$ilp.interledger-test.dev/taxi-co', true),
  ('Corner Spaza Shop', '$ilp.interledger-test.dev/spaza-shop', true),
  ('Street Food Vendor', '$ilp.interledger-test.dev/street-food', true),
  ('Mini Market', '$ilp.interledger-test.dev/mini-market', true);

-- Add function to update balance after transaction
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Subtract transaction amount from customer's balance
  UPDATE public.users 
  SET balance = balance - NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balance
CREATE TRIGGER transaction_balance_update
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance();
