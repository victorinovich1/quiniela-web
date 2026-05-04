-- =====================================================
-- 001 - Esquema base de la quiniela
-- =====================================================

-- 1. profiles (extiende auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  alias text,
  favorite_team_id int,
  paid boolean not null default false,
  role text not null default 'participant' check (role in ('participant','admin')),
  created_at timestamptz not null default now()
);

-- 2. settings (1 sola fila)
create table public.settings (
  id smallint primary key default 1,
  lock_at timestamptz,
  pt_exact_group int not null default 5,
  pt_winner_group int not null default 2,
  pt_exact_ko int not null default 8,
  pt_winner_ko int not null default 4,
  pt_round_of_16 int not null default 3,
  pt_quarters int not null default 5,
  pt_semis int not null default 8,
  pt_champion int not null default 25,
  pt_runner_up int not null default 15,
  pt_third int not null default 10,
  pt_fourth int not null default 6,
  pt_top_scorer int not null default 15,
  pt_mvp int not null default 10,
  pt_goalkeeper int not null default 8,
  pt_revelation int not null default 8,
  pt_disappointment int not null default 5,
  champion_team_id int,
  runner_up_team_id int,
  third_team_id int,
  fourth_team_id int,
  top_scorer text,
  mvp text,
  best_goalkeeper text,
  revelation_team_id int,
  disappointment_team_id int,
  constraint single_row check (id = 1)
);

insert into public.settings (id) values (1);

-- 3. invitations
create table public.invitations (
  code text primary key,
  note text,
  email text,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- 4. teams
create table public.teams (
  id serial primary key,
  code text unique not null,
  name text not null,
  group_code text check (group_code in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  flag_emoji text,
  position_in_group smallint check (position_in_group between 1 and 4)
);

-- 5. matches
create table public.matches (
  id serial primary key,
  phase text not null check (phase in ('group','r32','r16','qf','sf','third','final')),
  group_code text,
  match_number int not null,
  kickoff_at timestamptz,
  home_team_id int references public.teams(id),
  away_team_id int references public.teams(id),
  home_team_label text,
  away_team_label text,
  home_score int,
  away_score int,
  shootout_winner_team_id int references public.teams(id),
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  updated_at timestamptz not null default now()
);

create unique index matches_phase_number_uq on public.matches(phase, match_number);

-- 6. predictions
create table public.predictions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id int not null references public.matches(id) on delete cascade,
  home_score int,
  away_score int,
  ko_winner_team_id int references public.teams(id),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- 7. special_predictions
create table public.special_predictions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  champion_team_id int references public.teams(id),
  runner_up_team_id int references public.teams(id),
  third_team_id int references public.teams(id),
  fourth_team_id int references public.teams(id),
  top_scorer text,
  mvp text,
  best_goalkeeper text,
  revelation_team_id int references public.teams(id),
  disappointment_team_id int references public.teams(id),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute function public.touch_updated_at();

create trigger special_predictions_updated_at
  before update on public.special_predictions
  for each row execute function public.touch_updated_at();

create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.touch_updated_at();
