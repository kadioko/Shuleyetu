-- Phase 3: Payments & Trust layer
-- Adds refund workflows, invoice numbering, order audit log, and vendor KYC documents.

-- ---------------------------------------------------------------------------
-- Refund workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_tzs numeric(12,2) NOT NULL CHECK (amount_tzs > 0),
  reason text NOT NULL CHECK (length(reason) > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_requests_order_id_idx ON public.refund_requests(order_id);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON public.refund_requests(status);

CREATE TABLE IF NOT EXISTS public.refund_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_request_id uuid REFERENCES public.refund_requests(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_tzs numeric(12,2) NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('refund', 'fee_adjustment', 'reversal')),
  reference text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_ledger_order_id_idx ON public.refund_ledger(order_id);
CREATE INDEX IF NOT EXISTS refund_ledger_refund_request_id_idx ON public.refund_ledger(refund_request_id);

-- ---------------------------------------------------------------------------
-- Invoices and numbering
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount_tzs numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'cancelled')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  file_url text,
  invoice_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_order_id_idx ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON public.invoices(invoice_number);

CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (vendor_id, year)
);

-- ---------------------------------------------------------------------------
-- Vendor KYC / trust documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('tin', 'business_license', 'nida', 'other')),
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_documents_vendor_id_idx ON public.vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_documents_status_idx ON public.vendor_documents(status);

-- ---------------------------------------------------------------------------
-- Order audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  entity_type text CHECK (entity_type IN ('order', 'vendor', 'system')),
  entity_id uuid,
  actor_type text NOT NULL CHECK (actor_type IN ('system', 'customer', 'vendor', 'admin')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_audit_log_order_id_idx ON public.order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS order_audit_log_entity_idx ON public.order_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS order_audit_log_created_at_idx ON public.order_audit_log(created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

-- Refund requests: admins see all; customers see own order refunds; vendors see refunds for their orders
DROP POLICY IF EXISTS "Refund requests public read own" ON public.refund_requests;
CREATE POLICY "Refund requests public read own" ON public.refund_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = refund_requests.order_id
        AND (o.customer_phone = (auth.jwt() ->> 'email') OR o.customer_name = auth.uid()::text)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendor_users vu ON vu.vendor_id = o.vendor_id
      WHERE o.id = refund_requests.order_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Refund requests admin manage" ON public.refund_requests;
CREATE POLICY "Refund requests admin manage" ON public.refund_requests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

DROP POLICY IF EXISTS "Refund requests customer insert" ON public.refund_requests;
CREATE POLICY "Refund requests customer insert" ON public.refund_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = refund_requests.order_id
        AND (o.customer_phone = (auth.jwt() ->> 'email') OR o.customer_name = auth.uid()::text)
    )
  );

-- Refund ledger: admins see all; linked parties see own order ledger entries
DROP POLICY IF EXISTS "Refund ledger public read own" ON public.refund_ledger;
CREATE POLICY "Refund ledger public read own" ON public.refund_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = refund_ledger.order_id
        AND (o.customer_phone = (auth.jwt() ->> 'email') OR o.customer_name = auth.uid()::text)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendor_users vu ON vu.vendor_id = o.vendor_id
      WHERE o.id = refund_ledger.order_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Refund ledger admin manage" ON public.refund_ledger;
CREATE POLICY "Refund ledger admin manage" ON public.refund_ledger FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Invoices: same visibility as orders plus public read via order invoice number
DROP POLICY IF EXISTS "Invoices public read own" ON public.invoices;
CREATE POLICY "Invoices public read own" ON public.invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = invoices.order_id
        AND (o.customer_phone = (auth.jwt() ->> 'email') OR o.customer_name = auth.uid()::text)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendor_users vu ON vu.vendor_id = o.vendor_id
      WHERE o.id = invoices.order_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Invoices admin manage" ON public.invoices;
CREATE POLICY "Invoices admin manage" ON public.invoices FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Invoice sequences: vendor users for own vendor, admins all
DROP POLICY IF EXISTS "Invoice sequences vendor manage own" ON public.invoice_sequences;
CREATE POLICY "Invoice sequences vendor manage own" ON public.invoice_sequences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = invoice_sequences.vendor_id AND vu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = invoice_sequences.vendor_id AND vu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Vendor documents: public see approved for a vendor; vendor sees own; admin manages
DROP POLICY IF EXISTS "Vendor documents public read approved" ON public.vendor_documents;
CREATE POLICY "Vendor documents public read approved" ON public.vendor_documents FOR SELECT
  TO authenticated, anon
  USING (status = 'approved');

DROP POLICY IF EXISTS "Vendor documents vendor manage own" ON public.vendor_documents;
CREATE POLICY "Vendor documents vendor manage own" ON public.vendor_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = vendor_documents.vendor_id AND vu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_users vu
      WHERE vu.vendor_id = vendor_documents.vendor_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vendor documents admin manage" ON public.vendor_documents;
CREATE POLICY "Vendor documents admin manage" ON public.vendor_documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Order audit log: admins all; linked parties own order
DROP POLICY IF EXISTS "Order audit log public read own" ON public.order_audit_log;
CREATE POLICY "Order audit log public read own" ON public.order_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_audit_log.order_id
        AND (o.customer_phone = (auth.jwt() ->> 'email') OR o.customer_name = auth.uid()::text)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendor_users vu ON vu.vendor_id = o.vendor_id
      WHERE o.id = order_audit_log.order_id AND vu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order audit log admin manage" ON public.order_audit_log;
CREATE POLICY "Order audit log admin manage" ON public.order_audit_log FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- ---------------------------------------------------------------------------
-- Helper: bump invoice sequence per vendor/year and return next number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_vendor_id uuid, p_year integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO public.invoice_sequences (vendor_id, year, last_number)
  VALUES (p_vendor_id, p_year, 1)
  ON CONFLICT (vendor_id, year)
  DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper: log order audit events
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_audit(
  p_order_id uuid,
  p_actor_type text,
  p_actor_user_id uuid,
  p_action text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.order_audit_log (order_id, actor_type, actor_user_id, action, payload)
  VALUES (p_order_id, p_actor_type, p_actor_user_id, p_action, p_payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(
  p_entity_type text,
  p_entity_id uuid,
  p_actor_type text,
  p_actor_user_id uuid,
  p_action text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.order_audit_log (entity_type, entity_id, actor_type, actor_user_id, action, payload)
  VALUES (p_entity_type, p_entity_id, p_actor_type, p_actor_user_id, p_action, p_payload);
END;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: keep refund_requests.updated_at current
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_refund_request_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_refund_request_updated_at ON public.refund_requests;
CREATE TRIGGER set_refund_request_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_refund_request_updated_at();
