-- New outcome for a call from a number the company already knows (an earlier request, by a call
-- or by link): no SMS, the customer is not a stranger. The call still shows to be returned.
alter table public.missed_calls drop constraint missed_calls_sms_status_check;
alter table public.missed_calls add constraint missed_calls_sms_status_check check (sms_status in (
  'pending', 'sent', 'delivered', 'failed',
  'skipped_disabled', 'skipped_anonymous', 'skipped_not_mobile', 'skipped_own_number', 'skipped_recent',
  'skipped_excluded', 'skipped_known'
));
