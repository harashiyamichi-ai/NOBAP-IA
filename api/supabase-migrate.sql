-- Ajuste o user_id conforme seu modelo. Aqui vamos usar um user_id string (ex: session uuid)

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists conversations_user_id_updated_idx on public.conversations(user_id, updated_at);

