-- At most one open "which Sumber Dana?" question per WhatsApp number at a
-- time. Previously a second ambiguous message arriving before the first was
-- answered inserted a second row, orphaning the first forever (only the
-- latest row's account_choices ever get looked up again). The app now
-- upserts on this constraint instead of inserting, so a new question
-- replaces the old one in place.
alter table public.whatsapp_pending_transactions
  add constraint whatsapp_pending_transactions_number_key unique (whatsapp_number);
