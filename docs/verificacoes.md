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
- Login com Google na app publicada: **por verificar** (a propagar o cliente OAuth no Google).
- Tarefa no PC a aparecer no telemóvel: **por verificar em aparelho real**.
- Conta não aprovada não lê nada: política `membros.aprovado` no SQL; **por verificar em teste de política** (`pglite`, fase F4 do plano original — fica para a bateria de verificações).
- Admin não abre notas privadas: `pode_ver` só dá acesso por `partilha`/dono: **por verificar em teste de política**.
- `atualizacoes` sem UPDATE nem DELETE: trigger `bloqueia_escrita` no servidor: **por verificar em teste de política**.

## Aparelhos reais
- Instalação iPhone (Adicionar ao ecrã principal): **por verificar em aparelho real**.
- Instalação Android: **por verificar em aparelho real**.
