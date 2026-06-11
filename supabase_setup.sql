-- ============================================================================
-- eSSL / ZKTeco Biometric Device Integration Migrations
-- Run this SQL in your Supabase SQL Editor (https://supabase.com)
-- ============================================================================

-- 1. Add expired access tracking column to your existing attendance_logs table
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS is_expired_access BOOLEAN DEFAULT FALSE;

-- 2. Create devices table to track connected biometric hardware heartbeats
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  device_name TEXT NOT NULL,
  last_ping TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for devices table
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all devices" ON public.devices;
CREATE POLICY "auth all devices" ON public.devices FOR ALL USING (auth.role() = 'authenticated');

-- 3. Trigger function to automatically queue device commands on Member changes (sync / delete)
CREATE OR REPLACE FUNCTION public.sync_member_to_device_commands_fn()
RETURNS TRIGGER AS $$
DECLARE
  cmd_str TEXT;
  user_pin TEXT;
BEGIN
  -- Determine which column to use as the device PIN (prefer device_user_id if set, otherwise admission_no)
  IF (TG_OP = 'DELETE') THEN
    user_pin := COALESCE(OLD.device_user_id, OLD.admission_no);
  ELSE
    user_pin := COALESCE(NEW.device_user_id, NEW.admission_no);
  END IF;

  -- Ensure PIN is cleaned and padded to a standard 4-digit string
  user_pin := LPAD(TRIM(user_pin), 4, '0');

  IF (TG_OP = 'DELETE') THEN
    -- If member is deleted, queue a delete command
    cmd_str := 'DATA DELETE user PIN=' || user_pin;
    
    INSERT INTO public.device_commands (command, executed)
    VALUES (cmd_str, false);
    
  ELSIF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- If member is active and paid, upload/renew their credentials on the device
    -- next_due_date acts as the membership expiration date
    IF (NEW.active = true AND NEW.next_due_date >= CURRENT_DATE) THEN
      cmd_str := 'DATA UPDATE USERINFO PIN=' || user_pin 
                 || E'\t' || 'Name=' || NEW.name 
                 || E'\t' || 'Pri=0'
                 || E'\t' || 'StartDatetime=' || to_char(NEW.join_date, 'YYYY-MM-DD') || ' 00:00:00'
                 || E'\t' || 'EndDatetime=' || to_char(NEW.next_due_date, 'YYYY-MM-DD') || ' 23:59:59';
                 
      INSERT INTO public.device_commands (command, executed)
      VALUES (cmd_str, false);
      
    ELSE
      -- If member is deactivated or expired, remove them from the device so the door does not open
      cmd_str := 'DATA DELETE user PIN=' || user_pin;
      
      INSERT INTO public.device_commands (command, executed)
      VALUES (cmd_str, false);
    END IF;
    
  END IF;
  
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to the existing members table
DROP TRIGGER IF EXISTS trg_sync_member_to_device_commands ON public.members;
CREATE TRIGGER trg_sync_member_to_device_commands
  AFTER INSERT OR UPDATE OR DELETE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_to_device_commands_fn();
