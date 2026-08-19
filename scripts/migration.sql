-- 1. Add blocked account planning columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS blocked_account_target NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_account_currency TEXT DEFAULT 'EUR';

-- 2. Create processing_trackers table for Visa & Credential tracking
CREATE TABLE IF NOT EXISTS processing_trackers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('evaluation', 'visa')) NOT NULL,
  agency TEXT NOT NULL, -- e.g. WES, uni-assist, APS, VFS, TLScontact
  status TEXT NOT NULL, -- e.g. "Documents Sent", "In Progress", "Slots Booked", "Approved"
  tracking_number TEXT,
  appointment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE processing_trackers ENABLE ROW LEVEL SECURITY;

-- Create policy: users can manage their own trackers
CREATE POLICY "Users can manage their own trackers" 
  ON processing_trackers 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
