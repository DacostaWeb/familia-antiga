# familia / Casadacosta

PWA da família Costa: **Tarefas da Casa**, **Privado** (notas) e **Arquivos**, em português,
com modo offline completo. O nome visível da app é **Casadacosta**; o repositório chama-se
`familia`.

**Endereço:** https://dacostaweb.github.io/familia/

## Instalar

### iPhone (Safari)
1. Abrir o endereço no Safari.
2. Tocar em **Partilhar** e escolher **Adicionar ao ecrã principal**.
3. As notificações (quando chegarem) só funcionam com a app adicionada ao ecrã principal.

### Android (Chrome)
1. Abrir o endereço no Chrome.
2. Menu **⋮** → **Instalar aplicação**.

### Computador (Chrome/Edge)
Tocar no ícone de instalação na barra de endereço.

## O que está feito (fases F0–F3 do plano)

- Publicação automática: cada `push` para `main` corre testes e publica (GitHub Actions + Pages).
- Barra "Há uma versão nova" — só atualiza com clique, nunca por cima de quem escreve.
- Desenho e-ink: três cores (branco, preto, amarelo dos post-its), coluna única, sem cinzentos.
- Tudo funciona offline (Dexie + Yjs): tarefas, notas com editor Markdown, arquivos com pastas,
  anexos versionados, post-its, pesquisa global, caixote recuperável.
- Testes de datas no fuso de Lisboa (mudanças de dia, mês, ano e hora legal) em `tests/`.

## O que falta (fases F4–F8 do plano)

Contas Google + servidor Supabase (sincronização entre aparelhos), cópia na Drive,
notificações, e a bateria final de verificações. Ver `PLANO-FAMILIA.md`.

## Desenvolvimento

```bash
pnpm install
pnpm dev      # servidor local
pnpm test     # testes
pnpm build    # build de produção em dist/
```

Regras do projeto em `AGENTS.md`. Plano completo em `PLANO-FAMILIA.md`.
