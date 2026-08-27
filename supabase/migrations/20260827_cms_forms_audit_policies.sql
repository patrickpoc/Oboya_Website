-- Policies for durable forms + audit logs (run in Supabase SQL editor if needed)

drop policy if exists "Authenticated insert audit logs" on public.cms_audit_logs;
create policy "Authenticated insert audit logs"
  on public.cms_audit_logs for insert
  to authenticated
  with check (true);

drop policy if exists "Public insert form submissions" on public.cms_form_submissions;
create policy "Public insert form submissions"
  on public.cms_form_submissions for insert
  to anon, authenticated
  with check (true);
