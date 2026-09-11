-- 0001_esquema.sql — tabelas da secção 3 do plano, RLS ligado em todas.
-- A autorização mora aqui: pode_ver / pode_editar são as únicas políticas.

create table public.membros (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nome text not null default '',
  aprovado boolean not null default false,
  admin boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.membros enable row level security;

-- O primeiro aprovado é o dono da família; novos membros esperam aprovação.
create function public.ao_criar_membro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email = 'atelierdacostafinanceiro@gmail.com' then
    new.aprovado := true;
    new.admin := true;
  end if;
  return new;
end;
$$;
create trigger membro_inicial before insert on public.membros
for each row execute function public.ao_criar_membro();

create table public.itens (
  id uuid primary key,
  area text not null check (area in ('tarefa','nota','arquivo')),
  dono uuid not null references auth.users(id) on delete cascade,
  -- partilha de notas: 'eu' | 'familia' | 'pessoas'
  partilha text not null default 'eu' check (partilha in ('eu','familia','pessoas')),
  familia_nivel text not null default 'ver' check (familia_nivel in ('ver','editar')),
  criado_em timestamptz not null default now(),
  apagado_em timestamptz
);

alter table public.itens enable row level security;

create table public.atualizacoes (
  id uuid primary key,
  item_id uuid not null references public.itens(id) on delete cascade,
  autor uuid not null references auth.users(id) on delete cascade,
  dados bytea not null,
  absorvida boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.atualizacoes enable row level security;

-- Append-only: nem UPDATE nem DELETE, nem com política que os deixasse passar.
create function public.bloqueia_escrita() returns trigger
language plpgsql as $$
begin
  raise exception 'atualizacoes é append-only';
end;
$$;
create trigger atualizacoes_append_only
before update or delete on public.atualizacoes
for each row execute function public.bloqueia_escrita();

create table public.partilhas (
  item_id uuid not null references public.itens(id) on delete cascade,
  membro uuid not null references auth.users(id) on delete cascade,
  nivel text not null check (nivel in ('ver','editar')),
  primary key (item_id, membro)
);

alter table public.partilhas enable row level security;

create table public.postits (
  item_id uuid not null references public.itens(id) on delete cascade,
  destinatario uuid not null references auth.users(id) on delete cascade,
  resumo text not null default '',
  criado_em timestamptz not null default now(),
  retirado_em timestamptz,
  primary key (item_id, destinatario)
);

alter table public.postits enable row level security;

create table public.anexos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens(id) on delete cascade,
  caminho text not null,
  versao int not null default 1,
  criado_em timestamptz not null default now()
);

alter table public.anexos enable row level security;

create table public.lembretes (
  item_id uuid not null references public.itens(id) on delete cascade,
  quando timestamptz not null,
  destinatarios uuid[] not null default '{}',
  chave_unica text not null unique,
  enviado_em timestamptz
);

alter table public.lembretes enable row level security;

create table public.subscricoes_push (
  membro uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  chaves jsonb not null,
  criado_em timestamptz not null default now(),
  primary key (membro, endpoint)
);

alter table public.subscricoes_push enable row level security;

-- ============ acesso ============

create function public.e_membro_aprovado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros m
    where m.user_id = auth.uid() and m.aprovado
  );
$$;

-- Ninguém — nem o admin — lê notas privadas de outrem.
create function public.pode_ver(item_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.itens i
    where i.id = item_id
      and (
        i.dono = auth.uid()
        or (
          public.e_membro_aprovado()
          and (
            i.area = 'tarefa'
            or (i.partilha = 'familia')
            or exists (
              select 1 from public.partilhas p
              where p.item_id = i.id and p.membro = auth.uid()
            )
          )
        )
      )
  );
$$;

create function public.pode_editar(item_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.itens i
    where i.id = item_id
      and (
        i.dono = auth.uid()
        or (
          public.e_membro_aprovado()
          and (
            i.area = 'tarefa'
            or (i.partilha = 'familia' and i.familia_nivel = 'editar')
            or exists (
              select 1 from public.partilhas p
              where p.item_id = i.id and p.membro = auth.uid() and p.nivel = 'editar'
            )
          )
        )
      )
  );
$$;

-- membros: aprovados veem a lista (responsáveis e aprovações); admin gere.
create policy membros_ver_proprio on public.membros for select
  using (user_id = auth.uid() or public.e_membro_aprovado());
create policy membros_criar_proprio on public.membros for insert
  with check (user_id = auth.uid() and admin = false and aprovado = false);
create policy membros_admin_atualiza on public.membros for update
  using (exists (select 1 from public.membros x where x.user_id = auth.uid() and x.admin))
  with check (true);

-- itens
create policy itens_ver on public.itens for select using (public.pode_ver(id));
create policy itens_criar on public.itens for insert with check (dono = auth.uid());
create policy itens_atualizar on public.itens for update using (dono = auth.uid());
-- sem política de delete: apagar é marcar apagado_em (o caixote).

-- atualizacoes: enviar exige poder editar o item; ler exige poder ver.
create policy atualizacoes_enviar on public.atualizacoes for insert
  with check (autor = auth.uid() and public.pode_editar(item_id));
create policy atualizacoes_ler on public.atualizacoes for select
  using (public.pode_ver(item_id));

-- partilhas: só o dono do item gere; quem tem acesso lê.
create policy partilhas_ler on public.partilhas for select
  using (public.pode_ver(item_id));
create policy partilhas_gerir on public.partilhas for all
  using (exists (select 1 from public.itens i where i.id = item_id and i.dono = auth.uid()))
  with check (exists (select 1 from public.itens i where i.id = item_id and i.dono = auth.uid()));

-- postits: destinatário lê; dono do item cria e retira.
create policy postits_ler on public.postits for select
  using (destinatario = auth.uid() or public.pode_editar(item_id));
create policy postits_gerir on public.postits for all
  using (public.pode_editar(item_id))
  with check (public.pode_editar(item_id));

-- anexos: append-only como as atualizações.
create policy anexos_ler on public.anexos for select using (public.pode_ver(item_id));
create policy anexos_criar on public.anexos for insert
  with check (public.pode_editar(item_id));

-- lembretes: quem edita a tarefa gere os lembretes; quem vê pode ler.
-- Marcar como enviado é da função do servidor (service_role contorna o RLS);
-- o cliente não tem política de update.
create policy lembretes_ler on public.lembretes for select using (public.pode_ver(item_id));
create policy lembretes_criar on public.lembretes for insert
  with check (public.pode_editar(item_id));
create policy lembretes_cancelar on public.lembretes for delete
  using (public.pode_editar(item_id));

-- subscricoes_push: cada um gere as suas.
create policy push_proprio on public.subscricoes_push for all
  using (membro = auth.uid()) with check (membro = auth.uid());

-- ============ storage (anexos privados, sem URL pública) ============

insert into storage.buckets (id, name, public) values ('anexos', 'anexos', false)
on conflict (id) do nothing;

create policy anexos_storage_ler on storage.objects for select
  using (bucket_id = 'anexos' and public.pode_ver((split_part(name, '/', 1))::uuid));
create policy anexos_storage_escrever on storage.objects for insert
  with check (bucket_id = 'anexos' and public.pode_editar((split_part(name, '/', 1))::uuid));
create policy anexos_storage_substituir on storage.objects for update
  using (bucket_id = 'anexos' and public.pode_editar((split_part(name, '/', 1))::uuid));
