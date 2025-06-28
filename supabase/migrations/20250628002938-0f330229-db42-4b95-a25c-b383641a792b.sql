
-- Enable RLS on the users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop the existing RLS policies to recreate them for Supabase auth
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create RLS policies for Supabase auth (using auth.uid() instead of clerk_id)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = clerk_id);

-- Update the users table to use auth.uid() instead of clerk_id
-- We'll rename clerk_id to user_id to be more generic
ALTER TABLE public.users RENAME COLUMN clerk_id TO user_id;

-- Update the policies to use the new column name
DROP POLICY "Users can view their own profile" ON public.users;
DROP POLICY "Users can update their own profile" ON public.users;
DROP POLICY "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
