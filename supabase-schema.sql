-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Anyone can read approved profiles (for displaying names)
create policy "Public profiles are viewable" on profiles
  for select using (status = 'approved' or auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Insert is handled via service role in auth trigger below
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Admins can do anything
create policy "Admins have full access to profiles" on profiles
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- CHANNELS
-- ─────────────────────────────────────────────
create table channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table channels enable row level security;

create policy "Approved members can view channels" on channels
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Admins can create channels" on channels
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins or creators can update channels" on channels
  for update using (
    created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins or creators can delete channels" on channels
  for delete using (
    created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- CHANNEL MEMBERS
-- ─────────────────────────────────────────────
create table channel_members (
  channel_id uuid references channels(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (channel_id, user_id)
);

alter table channel_members enable row level security;

create policy "Members can view channel memberships" on channel_members
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Approved members can join/leave channels" on channel_members
  for insert with check (
    user_id = auth.uid() and
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Users can remove their own membership" on channel_members
  for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────────
create table posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  author_id uuid references profiles(id) on delete set null,
  channel_id uuid references channels(id) on delete set null,
  created_at timestamptz default now()
);

alter table posts enable row level security;

create policy "Approved members can view posts" on posts
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Approved members can create posts" on posts
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Authors or admins can update posts" on posts
  for update using (
    author_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authors or admins can delete posts" on posts
  for delete using (
    author_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────
create table comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  parent_id uuid references comments(id) on delete cascade,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "Approved members can view comments" on comments
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Approved members can create comments" on comments
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Authors or admins can delete comments" on comments
  for delete using (
    author_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────
create table events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  location text,
  event_date timestamptz not null,
  cover_image_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table events enable row level security;

create policy "Approved members can view events" on events
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Approved members can create events" on events
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Creators or admins can update events" on events
  for update using (
    created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Creators or admins can delete events" on events
  for delete using (
    created_by = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- RSVPS
-- ─────────────────────────────────────────────
create table rsvps (
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null check (status in ('going', 'notgoing', 'maybe')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

alter table rsvps enable row level security;

create policy "Approved members can view rsvps" on rsvps
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Users can manage their own rsvps" on rsvps
  for insert with check (
    user_id = auth.uid() and
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Users can update own rsvp" on rsvps
  for update using (user_id = auth.uid());

create policy "Users can delete own rsvp" on rsvps
  for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- EVENT COMMENTS
-- ─────────────────────────────────────────────
create table event_comments (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  parent_id uuid references event_comments(id) on delete cascade,
  created_at timestamptz default now()
);

alter table event_comments enable row level security;

create policy "Approved members can view event comments" on event_comments
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Approved members can create event comments" on event_comments
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Authors or admins can delete event comments" on event_comments
  for delete using (
    author_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- MAKE PROFILES READABLE FOR JOINS
-- (allows querying profiles.full_name in joins)
-- ─────────────────────────────────────────────
-- The existing select policy covers approved members.
-- For the admin panel to see pending users, add:
create policy "Admins can view all profiles" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ─────────────────────────────────────────────
-- PROFILE EXTRA FIELDS (city, occupation, hobbies, interests, age, gender)
-- ─────────────────────────────────────────────
alter table profiles
  add column if not exists city text,
  add column if not exists occupation text,
  add column if not exists hobbies text,
  add column if not exists interests text,
  add column if not exists age integer,
  add column if not exists gender text,
  add column if not exists marital_status text,
  add column if not exists children_count integer default 0;

-- ─────────────────────────────────────────────
-- EVENTS EXTRA FIELD (is_private)
-- ─────────────────────────────────────────────
alter table events
  add column if not exists is_private boolean default false;

-- ─────────────────────────────────────────────
-- FRIENDSHIPS
-- ─────────────────────────────────────────────
create table if not exists friendships (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique (sender_id, receiver_id)
);

alter table friendships enable row level security;

create policy "Users can view their own friendships" on friendships
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send friend requests" on friendships
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Receivers can accept friend requests" on friendships
  for update using (auth.uid() = receiver_id);

create policy "Either party can delete friendship" on friendships
  for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ─────────────────────────────────────────────
-- DIRECT MESSAGES
-- ─────────────────────────────────────────────
create table if not exists direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

alter table direct_messages enable row level security;

create policy "Users can view their own DMs" on direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Approved users can send DMs" on direct_messages
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

-- ─────────────────────────────────────────────
-- EVENT MESSAGES (live event chat rooms)
-- ─────────────────────────────────────────────
create table if not exists event_messages (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

alter table event_messages enable row level security;

create policy "Approved members can view event messages" on event_messages
  for select using (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

create policy "Approved members can send event messages" on event_messages
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
  );

-- ─────────────────────────────────────────────
-- FIRST ADMIN SETUP
-- After running schema, manually set your user as admin:
-- UPDATE profiles SET is_admin = true, status = 'approved' WHERE id = '<your-user-uuid>';
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- AUTOMATIC APPROVAL EMAIL TRIGGER (via Brevo API)
-- ─────────────────────────────────────────────
create or replace function public.handle_status_approved()
returns trigger as $$
begin
  if NEW.status = 'approved' and (OLD.status is null or OLD.status != 'approved') and NEW.email is not null then
    perform net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object(
        'api-key', 'YOUR_BREVO_API_KEY_HERE',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'Alamancı', 'email', 'info@eylaconsulting.com'),
        'to', jsonb_build_array(jsonb_build_object('email', NEW.email, 'name', NEW.full_name)),
        'subject', 'Alamancı Üyeliğiniz Onaylandı! 🎉',
        'htmlContent', concat(
          '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">',
          '<h2 style="color: #4f46e5;">Merhaba ', NEW.full_name, ',</h2>',
          '<p style="font-size: 16px; color: #374151; line-height: 1.6;">',
          'Alamancı topluluğuna yaptığınız üyelik başvurusu incelenmiş ve <strong>onaylanmıştır</strong>! 🎉',
          '</p>',
          '<p style="font-size: 16px; color: #374151; line-height: 1.6;">',
          'Artık sisteme giriş yaparak profilinizi güncelleyebilir, etkinliklere katılabilir ve diğer üyelerle iletişime geçebilirsiniz.',
          '</p>',
          '<div style="margin: 30px 0; text-align: center;">',
          '<a href="https://alamanci.netlify.app" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">',
          'Giriş Yap ve Keşfet',
          '</a>',
          '</div>',
          '<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />',
          '<p style="font-size: 12px; color: #9ca3af; text-align: center;">',
          'Bu e-posta Alamancı Topluluk Yönetimi tarafından otomatik olarak gönderilmiştir.',
          '</p>',
          '</div>'
        )
      )
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_approved on public.profiles;
create trigger on_profile_approved
  after update on public.profiles
  for each row
  execute function public.handle_status_approved();
-- ─────────────────────────────────────────────
