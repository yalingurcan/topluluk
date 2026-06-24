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

create policy "Approved members can create channels" on channels
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and status = 'approved')
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
-- FIRST ADMIN SETUP
-- After running schema, manually set your user as admin:
-- UPDATE profiles SET is_admin = true, status = 'approved' WHERE id = '<your-user-uuid>';
-- ─────────────────────────────────────────────
