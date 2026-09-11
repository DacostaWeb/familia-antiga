# Regras da casa (versão curta de PLANO-FAMILIA.md)

- Língua: português de Portugal. Fuso `Europe/Lisbon`. Nome visível: **Casadacosta**.
- Uma tarefa = um commit. Antes de commit: `pnpm test` e `pnpm build` verdes.
- Nenhum ficheiro passa de ~400 linhas.
- Nunca commites segredos. Chaves só em `.env` (ignorado) e GitHub Secrets.
- Não atives serviços pagos. Se um passo pedir cartão, para e avisa.
- Três cores só: branco `#FFFFFF`, preto `#000000`, amarelo `#FFEB3B` (só post-its).
  Sem cinzentos, sombras, gradientes, transparências, animações nem scroll horizontal.
- Sem sidebar: coluna única centrada. Texto 18 px, toque mínimo 48 px.
- Apagar vai sempre para o caixote. Nunca apagues dados do utilizador para "limpar estado".
- Regra de ouro offline: grava primeiro no dispositivo; nunca se perde o que se escreveu.
- Segurança só no SQL (RLS): `pode_ver` / `pode_editar`. Admin não abre notas privadas.
- A Drive é espelho de sentido único (app → Drive), âmbito `drive.file` só.
- Distingue sempre: "verificado no browser" / "coberto por teste" / "por verificar".
