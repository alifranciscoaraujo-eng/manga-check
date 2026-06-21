-- ============================================================
-- Manga Check — schema do banco (Supabase / Postgres)
-- Todas as tabelas usam o prefixo mc_ para conviver com outros
-- apps no mesmo projeto Supabase.
-- Aplicado no projeto chrknucqaduwzxbpgrlr.
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
  user_id uuid,                                 -- referencia auth.users.id
  nome text not null,
  email text,
  funcao text,
  papel text not null default 'colaborador',    -- 'gestor' | 'colaborador'
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
-- garante 1 resposta por (execução, item)
create unique index if not exists uq_mc_respostas_exec_item on mc_respostas(execucao_id, item_id);

-- ============================================================
-- RLS por usuário: gestor vê tudo; colaborador só o que é dele.
-- ============================================================

-- Helpers (SECURITY DEFINER p/ evitar recursão de RLS)
create or replace function mc_is_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mc_colaboradores c where c.user_id = auth.uid() and c.papel = 'gestor');
$$;

create or replace function mc_my_colaborador_id() returns uuid
language sql stable security definer set search_path = public as $$
  select c.id from mc_colaboradores c where c.user_id = auth.uid() limit 1;
$$;

revoke execute on function mc_is_gestor() from anon;
revoke execute on function mc_my_colaborador_id() from anon;
grant execute on function mc_is_gestor() to authenticated;
grant execute on function mc_my_colaborador_id() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'mc_unidades','mc_setores','mc_colaboradores','mc_modelos',
    'mc_modelo_itens','mc_agendamentos','mc_execucoes','mc_respostas'
  ]
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Tabelas de referência: leitura p/ qualquer autenticado; escrita só gestor
do $$
declare t text;
begin
  foreach t in array array['mc_unidades','mc_setores','mc_modelos','mc_modelo_itens','mc_agendamentos']
  loop
    execute format('drop policy if exists %I on %I', t||'_sel', t);
    execute format('drop policy if exists %I on %I', t||'_ins', t);
    execute format('drop policy if exists %I on %I', t||'_upd', t);
    execute format('drop policy if exists %I on %I', t||'_del', t);
    execute format('create policy %I on %I for select to authenticated using (true)', t||'_sel', t);
    execute format('create policy %I on %I for insert to authenticated with check (mc_is_gestor())', t||'_ins', t);
    execute format('create policy %I on %I for update to authenticated using (mc_is_gestor()) with check (mc_is_gestor())', t||'_upd', t);
    execute format('create policy %I on %I for delete to authenticated using (mc_is_gestor())', t||'_del', t);
  end loop;
end $$;

-- mc_colaboradores: gestor tudo; colaborador só a própria linha
drop policy if exists mc_colab_sel on mc_colaboradores;
create policy mc_colab_sel on mc_colaboradores for select to authenticated
  using (mc_is_gestor() or user_id = auth.uid());
drop policy if exists mc_colab_ins on mc_colaboradores;
create policy mc_colab_ins on mc_colaboradores for insert to authenticated with check (mc_is_gestor());
drop policy if exists mc_colab_upd on mc_colaboradores;
create policy mc_colab_upd on mc_colaboradores for update to authenticated using (mc_is_gestor()) with check (mc_is_gestor());
drop policy if exists mc_colab_del on mc_colaboradores;
create policy mc_colab_del on mc_colaboradores for delete to authenticated using (mc_is_gestor());

-- mc_execucoes: gestor tudo; colaborador só as próprias (ver + atualizar)
drop policy if exists mc_exec_sel on mc_execucoes;
create policy mc_exec_sel on mc_execucoes for select to authenticated
  using (mc_is_gestor() or responsavel_id = mc_my_colaborador_id());
drop policy if exists mc_exec_ins on mc_execucoes;
create policy mc_exec_ins on mc_execucoes for insert to authenticated with check (mc_is_gestor());
drop policy if exists mc_exec_upd on mc_execucoes;
create policy mc_exec_upd on mc_execucoes for update to authenticated
  using (mc_is_gestor() or responsavel_id = mc_my_colaborador_id())
  with check (mc_is_gestor() or responsavel_id = mc_my_colaborador_id());
drop policy if exists mc_exec_del on mc_execucoes;
create policy mc_exec_del on mc_execucoes for delete to authenticated using (mc_is_gestor());

-- mc_respostas: acompanha a execução do colaborador
drop policy if exists mc_resp_sel on mc_respostas;
create policy mc_resp_sel on mc_respostas for select to authenticated
  using (mc_is_gestor() or execucao_id in (select id from mc_execucoes where responsavel_id = mc_my_colaborador_id()));
drop policy if exists mc_resp_ins on mc_respostas;
create policy mc_resp_ins on mc_respostas for insert to authenticated
  with check (mc_is_gestor() or execucao_id in (select id from mc_execucoes where responsavel_id = mc_my_colaborador_id()));
drop policy if exists mc_resp_upd on mc_respostas;
create policy mc_resp_upd on mc_respostas for update to authenticated
  using (mc_is_gestor() or execucao_id in (select id from mc_execucoes where responsavel_id = mc_my_colaborador_id()))
  with check (mc_is_gestor() or execucao_id in (select id from mc_execucoes where responsavel_id = mc_my_colaborador_id()));
drop policy if exists mc_resp_del on mc_respostas;
create policy mc_resp_del on mc_respostas for delete to authenticated using (mc_is_gestor());

-- ============================================================
-- Storage: bucket público de evidências fotográficas.
-- Sem policy de SELECT ampla (URLs públicas funcionam sem ela;
-- evita listagem). Upload restrito a autenticados.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('mc-evidencias', 'mc-evidencias', true)
on conflict (id) do nothing;

drop policy if exists "mc_evid_insert" on storage.objects;
create policy "mc_evid_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'mc-evidencias');

-- ============================================================
-- Geração das execuções de um dia a partir dos agendamentos.
-- Idempotente. Restrita ao service_role / cron.
-- ============================================================
create or replace function mc_gerar_execucoes_dia(d date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare inseridos int;
begin
  with ag as (
    select a.id as agendamento_id, a.horario, a.dias_semana,
           m.id as modelo_id, m.nome as modelo_nome,
           u.id as unidade_id, u.nome as unidade_nome,
           s.id as setor_id, s.nome as setor_nome,
           c.id as responsavel_id, c.nome as responsavel_nome,
           (select count(*) from mc_modelo_itens mi where mi.modelo_id = m.id) as total_itens
    from mc_agendamentos a
    join mc_modelos m on m.id = a.modelo_id
    left join mc_unidades u on u.id = a.unidade_id
    left join mc_setores s on s.id = a.setor_id
    left join mc_colaboradores c on c.id = a.responsavel_id
    where a.ativo
      and extract(dow from d)::int = any(a.dias_semana)
      and not exists (select 1 from mc_execucoes e where e.agendamento_id = a.id and e.data = d)
  )
  insert into mc_execucoes
    (agendamento_id, modelo_id, modelo_nome, unidade_id, unidade_nome, setor_id, setor_nome,
     responsavel_id, responsavel_nome, data, horario_previsto, status, percentual, total_itens, itens_conformes)
  select agendamento_id, modelo_id, modelo_nome, unidade_id, unidade_nome, setor_id, setor_nome,
         responsavel_id, responsavel_nome, d, horario, 'nao_iniciado', 0, total_itens, 0
  from ag;
  get diagnostics inseridos = row_count;
  return inseridos;
end $$;

revoke execute on function mc_gerar_execucoes_dia(date) from public, anon, authenticated;
