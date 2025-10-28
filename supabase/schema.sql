-- Habilita extensoes necessarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabela de usuarios do sistema
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  role text not null check (role in ('admin', 'organizer', 'participant')),
  status text not null check (status in ('ativo', 'inativo')) default 'ativo',
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Usuario administrador padrao (senha: 123456 -> SHA-256)
insert into users (name, email, phone, role, status, password_hash)
values ('Administrador', 'admin@eventosnpa.com', '+5527999999999', 'admin', 'ativo', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92')
on conflict (email) do nothing;

-- Tabela de eventos
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  additional_info text,
  event_date date not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  status text not null check (status in ('aguardando', 'ativo', 'encerrado')) default 'aguardando',
  created_by uuid references users(id),
  created_at timestamptz not null default timezone('utc', now())
);

-- Tabela de perguntas vinculadas ao evento
create table if not exists event_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  text text not null,
  type text not null check (type in ('short_text', 'long_text', 'time', 'multiple_choice', 'single_choice')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists event_questions_event_id_idx on event_questions(event_id, sort_order);

-- RLS basica permitindo acesso pelo cliente anon (ajustar conforme estrategia de seguranca)
alter table users disable row level security;
alter table events disable row level security;
alter table event_questions disable row level security;
