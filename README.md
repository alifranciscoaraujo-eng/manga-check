# Manga Check

SaaS de **checklists operacionais** para o food service — restaurantes, lanchonetes,
hamburguerias, cafés, pizzarias e afins — incluindo operações multiunidade.
A equipe executa as rotinas no celular (com evidência em foto), o gestor acompanha
tudo em tempo real num painel com indicadores de pontualidade, qualidade e score.

Inspirado no escopo do Koncluí, **sem** verificação por IA, geolocalização ou
alertas por WhatsApp (previstos para fases futuras).

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- Recharts · lucide-react · date-fns

## Rodar local

```bash
npm install
npm run dev      # http://localhost:5400
```

As credenciais do Supabase já vêm em `.env.local`. Conta de demonstração:

```
e-mail: yan@mangacheck.com
senha:  manga123
```

## Banco de dados

Projeto Supabase `chrknucqaduwzxbpgrlr`. Todas as tabelas usam o prefixo `mc_`
para não colidir com os outros apps do mesmo projeto. O schema completo está em
[`supabase/schema.sql`](supabase/schema.sql).

| Tabela | Função |
|--------|--------|
| `mc_unidades` | Lojas / filiais |
| `mc_setores` | Cozinha, Salão, Estoque… |
| `mc_colaboradores` | Equipe (gestor / colaborador) |
| `mc_modelos` + `mc_modelo_itens` | Templates de checklist e seus itens |
| `mc_agendamentos` | Recorrência: turno, horário, dias da semana, responsável |
| `mc_execucoes` | Instâncias diárias geradas dos agendamentos |
| `mc_respostas` | Resposta de cada item (conforme/não conforme/N-A + foto) |

Evidências fotográficas vão para o bucket público `mc-evidencias`.

## Telas

- **Dashboard** — KPIs (agendados, não iniciado, em andamento, atrasado, finalizado),
  taxa de conclusão, rankings por usuário/unidade/setor e evolução dos indicadores.
- **Meus Checklists** — board do dia, executável (mirror do app da equipe).
- **Execução** — preenchimento item a item, com foto de evidência.
- **Modelos** — CRUD de templates e seus itens.
- **Agendamentos** — quando cada rotina aparece para a equipe.
- **Cadastros** — unidades, setores e equipe.

## Roadmap (fora do MVP)

- Verificação de foto por IA
- Geolocalização (GPS) na execução
- Alertas por WhatsApp / push
- Geração automática das execuções por job agendado (hoje o seed cria o histórico)
