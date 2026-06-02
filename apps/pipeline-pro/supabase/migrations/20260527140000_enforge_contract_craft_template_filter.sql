-- Contract Craft — exclude template rows from v_contracts.
--
-- Save-as-Template now inserts a `contracts` row with status='template' and
-- metadata.is_template=true so templates persist server-side and are visible
-- across devices (the previous implementation only used localStorage).
--
-- Without this filter, those template rows would show up alongside real
-- contracts in the Contracts list and the dashboard. Idempotent.

DROP VIEW IF EXISTS public.v_contracts;
CREATE VIEW public.v_contracts WITH (security_invoker = on) AS
SELECT
  c.id,
  c.title,
  c.type,
  c.status,
  c.value,
  c.currency,
  c.start_date,
  c.end_date,
  c.auto_renew,
  c.renewal_date,
  a.name AS account_name,
  c.account_id,
  c.deal_id,
  d.title AS deal_title,
  e.name AS owner_name,
  c.owner_id,
  c.scope_summary,
  c.deliverables,
  c.payment_terms,
  c.client_signer_name,
  c.client_signer_email,
  c.enfactum_signer_id,
  c.internal_notes,
  c.file_url,
  c.signed_file_url,
  c.signed_at,
  c.created_at,
  c.updated_at,
  c.metadata
FROM public.contracts c
LEFT JOIN public.accounts a ON a.id = c.account_id
LEFT JOIN public.deals d ON d.id = c.deal_id
LEFT JOIN public.employees e ON e.id = c.owner_id
WHERE c.status NOT IN ('deleted', 'template')
  AND COALESCE(c.metadata->>'is_template', 'false') <> 'true';

CREATE INDEX IF NOT EXISTS idx_contracts_is_template
  ON public.contracts ((metadata->>'is_template'));
