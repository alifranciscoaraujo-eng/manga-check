-- ============================================================
-- Manga Check — schema do banco (Supabase / Postgres)
-- Todas as tabelas usam o prefixo mc_ para conviver com outros
-- apps no mesmo projeto Supabase.
-- Já aplicado no projeto chrknucqaduwzxbpgrlr.
-- ============================================================

create table if not exists mc_unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mc_setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mc_colaboradores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  nome text not null,
  email text,
  funcao text,
  papel text not null default 'colaborador',   -- 'gestor' | 'colaborador'
  unidade_id uuid references mc_unidades(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mc_modelos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  setor_id uuid references mc_setores(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mc_modelo_itens (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references mc_modelos(id) on delete cascade,
  ordem int not null default 0,
  descricao text not null,
  exige_foto boolean not null default false,
  obrigatorio boolean not null default true
);

create table if not exists mc_agendamentos (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references mc_modelos(id) on delete cascade,
  unidade_id uuid references mc_unidades(id) on delete set null,
  setor_id uuid references mc_setores(id) on delete set null,
  responsavel_id uuid references mc_colaboradores(id) on delete set null,
  turno text,                                   -- 'manha' | 'tarde' | 'noite'
  horario time not null default '08:00',
  recorrencia text not null default 'diaria',   -- 'diaria' | 'semanal' | 'mensal'
  dias_semana int[] not null default '{1,2,3,4,5}',  -- 0=Dom .. 6=Sáb
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mc_execucoes (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid references mc_agendamentos(id) on delete set null,
  modelo_id uuid references mc_modelos(id) on delete set null,
  modelo_nome text not null,
  unidade_id uuid references mc_unidades(id) on delete set null,
  unidade_nome text,
  setor_id uuid references mc_setores(id) on delete set null,
  setor_nome text,
  responsavel_id uuid references mc_colaboradores(id) on delete set null,
  responsavel_nome text,
  data date not null default current_date,
  horario_previsto time,
  status text not null default 'nao_iniciado',  -- nao_iniciado | em_andamento | finalizado | atrasado
  percentual int not null default 0,
  total_itens int not null default 0,
  itens_conformes int not null default 0,
  iniciado_em timestamptz,
  finalizado_em timestamptz,
  no_prazo boolean,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists mc_respostas (
  id uuid primary key default gen_random_uuid(),
  execucao_id uuid not null references mc_execucoes(id) on delete cascade,
  item_id uuid references mc_modelo_itens(id) on delete set null,
  item_descricao text not null,
  ordem int not null default 0,
  exige_foto boolean not null default false,
  status text,                                  -- conforme | nao_conforme | na
  observacao text,
  foto_url text,
  respondido_em timestamptz
);

create index if not exists idx_mc_execucoes_data on mc_execucoes(data);
create index if not exists idx_mc_execucoes_status on mc_execucoes(status);
create index if not exists idx_mc_respostas_execucao on mc_respostas(execucao_id);
create index if not exists idx_mc_modelo_itens_modelo on mc_modelo_itens(modelo_id);

-- RLS permissivo (MVP): anon + authenticated
do $$
declare t text;
begin
  foreach t in array array[
    'mc_unidades','mc_setores','mc_colaboradores','mc_modelos',
    'mc_modelo_itens','mc_agendamentos','mc_execucoes','mc_respostas'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t||'_all', t);
    execute format('create policy %I on %I for all to anon, authenticated using (true) with check (true)', t||'_all', t);
  end loop;
end $$;

-- Storage: bucket de evidências fotográficas
insert into storage.buckets (id, name, public)
values ('mc-evidencias', 'mc-evidencias', true)
on conflict (id) do nothing;

drop policy if exists "mc_evid_select" on storage.objects;
create policy "mc_evid_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'mc-evidencias');

drop policy if exists "mc_evid_insert" on storage.objects;
create policy "mc_evid_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'mc-evidencias');
