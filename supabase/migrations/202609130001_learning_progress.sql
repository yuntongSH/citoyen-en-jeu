-- Private learner records. Emails stay in Supabase Auth, never in this public schema.
create table public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint payload_object check (jsonb_typeof(payload) = 'object'),
  constraint payload_size check (octet_length(payload::text) <= 65536)
);
alter table public.learning_progress enable row level security;
revoke all on public.learning_progress from anon, authenticated;
grant select on public.learning_progress to authenticated;
create policy "Read only your own progress" on public.learning_progress
  for select to authenticated using ((select auth.uid()) = user_id);

-- Compare-and-swap prevents two devices from silently overwriting each other.
-- Owner is derived from the verified JWT; clients cannot choose a user_id.
create or replace function public.save_learning_progress(expected_revision bigint, new_payload jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); current_revision bigint;
begin
  if owner_id is null then raise insufficient_privilege; end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception 'Invalid revision' using errcode = '22023';
  end if;
  if new_payload is null or jsonb_typeof(new_payload) <> 'object'
    or octet_length(new_payload::text) > 65536 then
    raise exception 'Invalid progress payload' using errcode = '22023';
  end if;
  insert into public.learning_progress(user_id, payload, revision)
    values(owner_id, '{}'::jsonb, 0) on conflict(user_id) do nothing;
  select revision into current_revision from public.learning_progress
    where user_id = owner_id for update;
  if current_revision <> expected_revision then
    raise exception 'Progress changed; reload and merge' using errcode = '40001';
  end if;
  update public.learning_progress set payload = new_payload,
    revision = current_revision + 1, updated_at = now() where user_id = owner_id;
  return current_revision + 1;
end $$;
revoke all on function public.save_learning_progress(bigint,jsonb) from public, anon;
grant execute on function public.save_learning_progress(bigint,jsonb) to authenticated;
