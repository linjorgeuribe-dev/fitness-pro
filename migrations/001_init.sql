-- Fitness Pro: cuentas y sincronización (fase 3)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  pass_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists auth_sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists auth_sessions_user on auth_sessions(user_id);
create sequence if not exists records_rev;
-- Almacén de documentos por usuario: perfil, rutinas, sesiones y peso corporal tal como viven en el dispositivo.
create table if not exists records (
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('profile','routine','session','body')),
  id text not null check (length(id) between 1 and 80),
  data jsonb,
  deleted boolean not null default false,
  rev bigint not null default nextval('records_rev'),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);
create index if not exists records_user_rev on records(user_id, rev);
create table if not exists auth_attempts (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists auth_attempts_key on auth_attempts(key, at);
