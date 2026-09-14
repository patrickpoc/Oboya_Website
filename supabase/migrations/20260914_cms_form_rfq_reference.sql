create unique index if not exists cms_form_submissions_quote_reference_idx
  on public.cms_form_submissions ((data->>'referenceId'))
  where type = 'quote' and coalesce(data->>'referenceId', '') <> '';
