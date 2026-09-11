# Publicar

A publicação é automática: cada `git push` para `main` faz o GitHub Actions correr
`pnpm test` e `pnpm build` e publicar `dist/` nas GitHub Pages
(workflow: `.github/workflows/deploy.yml`).

## Onde estão os segredos

GitHub → repositório `familia` → **Settings → Secrets and variables → Actions**.
Nomes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`,
`VITE_GOOGLE_CLIENT_ID`. Faltam enquanto as fases F4–F6 não criarem os serviços —
o build funciona na mesma (a app deteta a ausência e fica em modo local).

## Como reverter

```bash
git revert <hash-do-commit>
git push
```

O Actions publica o estado revertido. Não há mais passos manuais.

## Ver o resultado

Actions → separador **Actions** do repositório mostra cada corrida.
O endereço público está no README.
