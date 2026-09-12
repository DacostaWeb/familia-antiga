# Verificações

Estado das verificações do plano (secção F7). Cada linha diz como foi verificada:
**verificado no browser** / **coberto por teste** / **por verificar**.

## Datas e prazos
- Ordem exata dos grupos, sem duplicações: **coberto por teste** (`tests/dates.test.ts`).
- Mudança de dia, de mês, de ano e da hora legal de Lisboa (verão/inverno): **coberto por teste**.
- Períodos vagos: dentro do período não é atraso; passado o fim, é: **coberto por teste**.
- Recorrência: diária, semanal, mensal (31/01 → 28/02), anual (29/02 → 28/02), períodos: **coberto por teste**.
- Dentro do dia: com hora por ordem cronológica, depois sem hora: **coberto por teste**.

## Interface
- 320 px sem scroll horizontal: **verificado no browser** (`scrollWidth` 305 = janela 305).
- Três cores, sem cinzentos/sombras/animações: **verificado no browser**.
- Barra "Há uma versão nova" só aplica com clique: **verificado no browser**.

## App offline
- Criar/editar/concluir/reabrir tarefa, fechar e reabrir, tudo lá: **verificado no browser**.
- Nota com editor Markdown (negrito, títulos), importar/exportar: **verificado no browser**.
- Pesquisa global a achar texto dentro de notas: **verificado no browser**.
- Pastas, post-it na Casa, Mostrar na pasta, caixote: **verificado no browser**.

## Contas e sincronização (F4)
- Entrar por email (link mágico) e sessão ativa: **verificado no browser** (conta atelierdacostafinanceiro).
- Estado "Sincronizado" e tarefas locais no servidor (5 itens de `tarefa`): **verificado no browser** + verificado por consulta SQL ao servidor.
- Botão "Entrar com o Google": **por verificar** — cliente OAuth criado, à espera da propagação do Google (pode levar horas); a entrada por email funciona entretanto.
- Tarefa no PC a aparecer no telemóvel: **por verificar em aparelho real**.
- Conta não aprovada não lê nada: política `membros.aprovado` no SQL; **por verificar em teste de política** (`pglite`).
- Admin não abre notas privadas: `pode_ver` só dá acesso por `partilha`/dono: **por verificar em teste de política**.
- `atualizacoes` sem UPDATE nem DELETE: trigger `bloqueia_escrita` no servidor: **por verificar em teste de política**.

## Notificações (F6)
- Edge function `push` instalada e a responder (`{"enviados":0}` sem lembretes): **verificado por chamada HTTP**.
- `pg_cron` + `pg_net` ativos, job `casadacosta-lembretes` ao minuto, segredos no vault: **verificado por consulta SQL ao servidor**.
- Subscrição Web Push no cliente (Definições → Ligar notificações): **por verificar em aparelho real**.
- Lembrete a chegar ao computador: **por verificar** (precisa de uma tarefa com hora marcada e subscrição ativa).
- iPhone (notificações só com app no ecrã principal): **por verificar em aparelho real**.

## Aparelhos reais
- Instalação iPhone (Adicionar ao ecrã principal): **por verificar em aparelho real**.
- Instalação Android: **por verificar em aparelho real**.
