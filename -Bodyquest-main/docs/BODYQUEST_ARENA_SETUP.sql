-- BodyQuest Arena: zuerst in Supabase SQL Editor ausführen.
-- Administrator manuell eintragen, siehe Anleitung. Keine vorhandenen Tabellen werden gelöscht.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.arena_admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.arena_access (user_id uuid primary key references auth.users(id) on delete cascade, enabled boolean not null default false, updated_at timestamptz not null default now());
create table if not exists public.arena_codes (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, code_hash text not null unique, created_at timestamptz not null default now(), redeemed_at timestamptz, revoked_at timestamptz);
create table if not exists public.arena_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, idempotency uuid not null, completed_at timestamptz not null default now(), exercise_count integer not null, xp_awarded integer not null default 0, exercises jsonb not null, unique(user_id,idempotency));
create index if not exists arena_sessions_user_date on public.arena_sessions(user_id,completed_at desc);
alter table public.arena_admins enable row level security;
alter table public.arena_access enable row level security;
alter table public.arena_codes enable row level security;
alter table public.arena_sessions enable row level security;
create policy "arena own sessions" on public.arena_sessions for select to authenticated using (user_id=auth.uid());
create policy "arena own access" on public.arena_access for select to authenticated using (user_id=auth.uid());
create or replace function public.arena_is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.arena_admins where user_id=auth.uid())$$;
revoke all on function public.arena_is_admin() from public;
grant execute on function public.arena_is_admin() to authenticated;
create or replace function public.arena_has_access() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.arena_access where user_id=auth.uid() and enabled)$$;
revoke all on function public.arena_has_access() from public;
grant execute on function public.arena_has_access() to authenticated;
create or replace function public.arena_admin_members() returns table(id uuid,email text,level integer,unlocked boolean) language plpgsql security definer set search_path='' as $$begin if not public.arena_is_admin() then raise exception 'Nicht autorisiert';end if;return query select u.id,u.email::text,coalesce(p.level,1)::integer,coalesce(a.enabled,false) from auth.users u left join public.profiles p on p.id=u.id left join public.arena_access a on a.user_id=u.id order by u.created_at desc limit 500;end$$;
revoke all on function public.arena_admin_members() from public;
grant execute on function public.arena_admin_members() to authenticated;
create or replace function public.arena_admin_create_code(p_user uuid) returns text language plpgsql security definer set search_path='' as $$declare v_code text;begin if not public.arena_is_admin() then raise exception 'Nicht autorisiert';end if;if not exists(select 1 from auth.users where id=p_user) then raise exception 'Mitglied nicht gefunden';end if;v_code:=upper(encode(extensions.gen_random_bytes(18),'hex'));insert into public.arena_codes(user_id,code_hash) values(p_user,encode(extensions.digest(v_code,'sha256'),'hex'));return v_code;end$$;
-- pgcrypto may be installed in public rather than extensions: use public or unqualified functions if needed.
revoke all on function public.arena_admin_create_code(uuid) from public;
grant execute on function public.arena_admin_create_code(uuid) to authenticated;
create or replace function public.arena_admin_set_access(p_user uuid,p_enabled boolean) returns boolean language plpgsql security definer set search_path='' as $$begin if not public.arena_is_admin() then raise exception 'Nicht autorisiert';end if;insert into public.arena_access(user_id,enabled) values(p_user,p_enabled) on conflict(user_id) do update set enabled=excluded.enabled,updated_at=now();return true;end$$;
revoke all on function public.arena_admin_set_access(uuid,boolean) from public;
grant execute on function public.arena_admin_set_access(uuid,boolean) to authenticated;
create or replace function public.arena_redeem_code(p_code text) returns boolean language plpgsql security definer set search_path='' as $$declare v_id uuid;begin if auth.uid() is null then raise exception 'Nicht angemeldet';end if;select id into v_id from public.arena_codes where user_id=auth.uid() and code_hash=encode(extensions.digest(upper(trim(p_code)),'sha256'),'hex') and redeemed_at is null and revoked_at is null for update;if v_id is null then return false;end if;update public.arena_codes set redeemed_at=now() where id=v_id;insert into public.arena_access(user_id,enabled) values(auth.uid(),true) on conflict(user_id) do update set enabled=true,updated_at=now();return true;end$$;
revoke all on function public.arena_redeem_code(text) from public;
grant execute on function public.arena_redeem_code(text) to authenticated;
create or replace function public.arena_complete_session(p_exercises jsonb,p_idempotency uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare v_level integer;v_today integer;v_xp integer;v_count integer;v_id uuid;begin if auth.uid() is null then raise exception 'Nicht angemeldet';end if;select coalesce(level,1) into v_level from public.profiles where id=auth.uid();if coalesce(v_level,1)>=5 and not public.arena_has_access() then raise exception 'Freischaltung erforderlich';end if;if jsonb_typeof(p_exercises)<>'array' or jsonb_array_length(p_exercises)<1 or jsonb_array_length(p_exercises)>30 then raise exception 'Ungültiges Workout';end if;select count(*) into v_count from jsonb_array_elements(p_exercises) e where coalesce((e->>'sets')::integer,0)>0 and coalesce((e->>'sets')::integer,0)<=20 and e->>'slug' ~ '^(bodyweight|gym)-[0-9]{2}$' and (e->>'weight_kg' is null or ((e->>'weight_kg')::numeric between 0 and 1000));if v_count<>jsonb_array_length(p_exercises) then raise exception 'Ungültige Übungsdaten';end if;perform pg_advisory_xact_lock(hashtext(auth.uid()::text));select id,xp_awarded into v_id,v_xp from public.arena_sessions where user_id=auth.uid() and idempotency=p_idempotency;if v_id is not null then return jsonb_build_object('session_id',v_id,'xp_awarded',v_xp);end if;select coalesce(sum(xp_awarded),0)::integer into v_today from public.arena_sessions where user_id=auth.uid() and completed_at>=date_trunc('day',now());v_xp:=least(50-v_today,case when v_today=0 then 30 else 10 end);v_xp:=greatest(0,v_xp);insert into public.arena_sessions(user_id,idempotency,exercise_count,xp_awarded,exercises) values(auth.uid(),p_idempotency,v_count,v_xp,p_exercises) returning id into v_id;return jsonb_build_object('session_id',v_id,'xp_awarded',v_xp);end$$;
revoke all on function public.arena_complete_session(jsonb,uuid) from public;
grant execute on function public.arena_complete_session(jsonb,uuid) to authenticated;
-- XP werden separat protokolliert, NICHT automatisch auf profiles.total_xp addiert.
-- Vor einer Anbindung an die bestehende XP-RPC die dortige Level- und Transaktionslogik prüfen.
