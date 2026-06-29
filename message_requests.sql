-- ─────────────────────────────────────────────
-- MESSAGE REQUESTS TABLE SETUP
-- ─────────────────────────────────────────────
create table if not exists message_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(sender_id, receiver_id)
);

alter table message_requests enable row level security;

-- Policies
drop policy if exists "Users can view their own message requests" on message_requests;
create policy "Users can view their own message requests" on message_requests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can insert their own message requests" on message_requests;
create policy "Users can insert their own message requests" on message_requests
  for insert with check (auth.uid() = sender_id);

drop policy if exists "Receivers can update message requests" on message_requests;
create policy "Receivers can update message requests" on message_requests
  for update using (auth.uid() = receiver_id);

drop policy if exists "Either party can delete message requests" on message_requests;
create policy "Either party can delete message requests" on message_requests
  for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);
