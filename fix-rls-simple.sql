-- Simple RLS fix for user registration
-- Run this in Supabase SQL Editor

-- Allow public registration on users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Allow user registration"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid()::text = id::text OR true);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid()::text = id::text);
