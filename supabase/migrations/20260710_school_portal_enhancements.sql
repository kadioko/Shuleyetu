-- School portal enhancements migration
-- Adds draft/scheduling to announcements, school_id to fee_payments,
-- and payment_method/reference columns (if not already present from portal schema).

-- school_announcements: add status (draft/published) and scheduled_at
ALTER TABLE public.school_announcements
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published'));

ALTER TABLE public.school_announcements
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- school_fee_payments: add school_id for direct school-level queries / RLS
ALTER TABLE public.school_fee_payments
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- Backfill school_id from the parent school_fees row
UPDATE public.school_fee_payments sfp
SET school_id = sf.school_id
FROM public.school_fees sf
WHERE sfp.fee_id = sf.id
  AND sfp.school_id IS NULL;

-- Add index for school-level payment queries
CREATE INDEX IF NOT EXISTS school_fee_payments_school_id_idx
  ON public.school_fee_payments(school_id);

-- school_fee_payments: ensure payment_method and reference exist
-- (they were in the original schema but guard with IF NOT EXISTS)
ALTER TABLE public.school_fee_payments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'bank', 'mobile_money', 'cheque'));

ALTER TABLE public.school_fee_payments
  ADD COLUMN IF NOT EXISTS reference text;

-- Update the CHECK constraint on payment_method to include 'cheque'
-- (original only had cash/bank/mobile_money; we add cheque gracefully)
DO $$
BEGIN
  -- Drop old constraint if it doesn't include 'cheque'
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'school_fee_payments_payment_method_check'
      AND check_clause NOT LIKE '%cheque%'
  ) THEN
    ALTER TABLE public.school_fee_payments
      DROP CONSTRAINT school_fee_payments_payment_method_check;

    ALTER TABLE public.school_fee_payments
      ADD CONSTRAINT school_fee_payments_payment_method_check
        CHECK (payment_method IN ('cash', 'bank', 'mobile_money', 'cheque'));
  END IF;
END $$;

-- school_students: add updated_at for edit tracking
ALTER TABLE public.school_students
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- school_staff: add updated_at for edit tracking
ALTER TABLE public.school_staff
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- school_audit_logs: ensure table exists (was added in a later migration)
CREATE TABLE IF NOT EXISTS public.school_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_audit_logs_school_id_idx
  ON public.school_audit_logs(school_id);

ALTER TABLE public.school_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: school admins can read their audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'school_audit_logs'
      AND policyname = 'school_audit_logs_select_for_school_users'
  ) THEN
    CREATE POLICY "school_audit_logs_select_for_school_users"
      ON public.school_audit_logs
      FOR SELECT
      USING (public.is_school_user(school_id));
  END IF;
END $$;
