# familia — plano de construção de raiz

**Para:** GLM 5.3 Flash
**Repositório:** `familia` (novo e vazio, em `github.com/DacostaWeb/familia`), noutro computador
**Língua de trabalho e de interface:** português de Portugal. Fuso `Europe/Lisbon`.

Não há código anterior para reaproveitar. Constróis tudo do zero, por esta ordem.

A **secção 1 é a visão do produto e está fechada** — foi decidida com o Eduardo e não se
negoceia. A **secção 2 é a stack, já simplificada** — segue-a, não a troques. A secção 5 é
a ordem de execução.

> O nome visível da app é **Casadacosta**. O repositório e a pasta na Drive chamam-se
> `familia`. Não é engano.

---

## 0. Como trabalhar

1. **Alterações pequenas.** Uma tarefa = um commit. Nenhum ficheiro passa das ~400 linhas; quando passar, parte-o.
2. **Antes de cada commit:** `pnpm test` e `pnpm build`. Se partires um teste, corriges — não o apagas nem lhe pões `skip`.
3. **Nunca commites segredos.** Chaves em `.env` (ignorado) e em GitHub Secrets. O `.env.example` só leva nomes.
4. **Não ativas serviços pagos.** Se um passo pedir cartão, paras e avisas.
5. **Distingue o que verificaste do que assumiste.** Ao reportar: "verificado no browser" / "coberto por teste" / "por verificar em aparelho real". Nunca dês por feito o que não correste.
6. **Bloqueado por uma credencial ou por um clique num site?** Não contornes. Acrescenta o pedido à lista da secção 6 e passa à tarefa seguinte que não dependa disso.

### Não faças
- Não acrescentes dependências além das listadas na secção 2. Se achares que falta alguma, pergunta primeiro.
- Não introduzas cinzentos, sombras, gradientes, transparências, animações ou scroll horizontal.
- Não faças sidebar. Coluna única centrada, em todos os tamanhos de ecrã.
- Não apagues dados do utilizador para "limpar estado". Apagar vai sempre para o caixote.
- Não inventes dados pessoais de exemplo (NIF, cartões de cidadão). Pastas vazias com bons nomes chegam.

---

## 1. A visão (fechada)

### 1.1 O que é
Uma PWA instalável pelo navegador — iPhone, Android e computador — para a família Costa.
Três entradas principais, sempre acessíveis, sem hierarquia escondida:

1. **Tarefas da Casa** — ecrã de abertura
2. **Privado** — notas markdown e listas pessoais, que podem passar a partilhadas
3. **Arquivos** — documentos e informação prática do dia-a-dia

Quem vai usar isto a sério são os pais do Eduardo. Tudo o que for ambíguo decide-se a favor
de **menos passos, letra maior e botões explícitos**.

### 1.2 Desenho
- **Só três cores:** branco `#FFFFFF`, preto `#000000`, amarelo `#FFEB3B` (exclusivo dos post-its). **Sem cinzentos.**
- Conceito e-ink: tem de ler-se num ecrã sem contraste nem cor.
- Caixas rectas ("super boxy"): é o traço que separa os blocos, não a sombra.
- **Coluna única centrada**, também no computador grande. **Sem sidebar.** **Nunca scroll horizontal**, em nenhum ecrã, com nenhum tamanho de letra.
- Tipografia incluída localmente em `public/fonts` (ficheiros `.woff2` + licença OFL ao lado): **IBM Plex Sans** (interface), **Literata** (notas), **Azeret Mono** (números e referências). Só pesos 400 e 700.
- Texto principal 18 px. Área de toque mínima 48 px. Opção de aumentar o texto nas Definições.
- Ícone: **uma casa, só em linha preta sobre fundo branco.** O maskable leva margem para não ser cortado no Android.
- Os documentos anexados mantêm o aspeto original — o monocromático é da interface.

### 1.3 Tarefas
- Criar só com um título. Descrição, checklist, responsáveis, prazo, hora e notificações são todos opcionais.
- Nenhum, um ou vários responsáveis. Estado comum: quem concluir, conclui para todos.
- Checkbox grande à esquerda. Concluir risca o título e manda o cartão para **Resolvidas**, abaixo das abertas. Dá para desfazer e reabrir.
- Agrupamento sem duplicações e por esta ordem exata:
  **Em atraso → Hoje → Amanhã → Esta semana → Este mês → Este ano → Mais tarde → Sem data → Resolvidas**
- Dentro do dia: primeiro as que têm hora, por ordem cronológica; depois as sem hora.
- O prazo tem **três formas distintas**: `sem data`, `data com hora opcional`, `período vago` ("esta semana"). Um período **nunca inventa uma hora**; quando o período acaba, a tarefa fica em atraso.
- Repetição diária, semanal, mensal ou anual. Concluir cria a ocorrência seguinte e guarda a anterior nas resolvidas.

### 1.4 Privado e partilha
- Notas e listas nascem privadas.
- Editor com formatação visível: títulos, negrito, itálico, links, listas, checkboxes. Atalhos Markdown e importar/exportar `.md`.
- Partilha: **Só eu** / **Toda a família** / **Pessoas escolhidas**, com **Pode ver** ou **Pode editar**.
- Partilhado dá leitura por defeito; as tarefas da casa é que são colaborativas por natureza.
- A nota do autor fica na área dele, marcada como partilhada. Quem recebe encontra-a numa secção vertical da Casa; documentos aparecem nos Arquivos.
- Só o proprietário muda a partilha. **Ser administrador da família não dá acesso às notas privadas de ninguém.**

### 1.5 Arquivos e post-its
- Pastas e subpastas, a começar por **Casa** e **Documentos pessoais**.
- Guarda notas, fotografias, PDFs e anexos. Pesquisa títulos, texto das notas e nomes de ficheiros. OCR fica para depois.
- Qualquer entrada pode virar **post-it amarelo** no topo da página principal de quem se escolher, com resumo, ligação ao original e **Mostrar na pasta**.
- Ao publicar o post-it, mostrar que acesso vai ser dado ao original. **Não** partilhar o resto da pasta.
- O post-it fica até o autor o retirar. Retirar o post-it não apaga o arquivo.
- Pesquisa global, histórico de alterações e caixote recuperável.

### 1.6 Offline — a regra de ouro
**Nunca se pode perder o que alguém escreveu.**
- Grava primeiro no dispositivo, com fila persistente de sincronização.
- Estado sempre visível: **Guardado neste dispositivo** / **A sincronizar** / **Sincronizado** / erro recuperável.
- Alterações concorrentes de duas pessoas offline unem-se — nunca "ganha a última versão" em silêncio.
- Anexos versionados: substituir um ficheiro cria uma versão nova.
- Apagar vai para o caixote. Uma edição atrasada não ressuscita um item apagado.
- Mudanças de acesso só valem depois de confirmadas pelo servidor. A quem for removido, as alterações locais recusadas ficam recuperáveis — nunca são publicadas.
- Pedir armazenamento persistente e descarregar os documentos autorizados, com progresso e retoma. **Falta de espaço nunca pode aparecer como descarga concluída.**
- Limite a assumir e a dizer: limpar o navegador ou perder o aparelho antes de sincronizar destrói alterações que só existiam ali.

### 1.7 Notificações
- Dois interruptores independentes, **desligados por defeito**: **Avisar na criação** e **Lembrar à hora marcada**.
- Sugerir os responsáveis como destinatários; sem destinatários, não envia.
- **Sem hora definida, não se inventa alarme.**
- Lembretes processados no servidor ao minuto, com chave única, retentativas e cancelamento ao concluir, reagendar ou retirar acesso.
- Notificação discreta no ecrã bloqueado, **sem conteúdo de documentos pessoais**; abre a tarefa.
- No iPhone só funcionam com a app adicionada ao ecrã principal — dizer isto na app.

---

## 2. A stack, já simplificada

A versão anterior usava quatro serviços e uma camada de API escrita à mão. Isto faz o mesmo
com três serviços e sem essa camada.

| Antes | Agora | Porquê |
|---|---|---|
| Cloudflare Workers + `wrangler` + token de API | **GitHub Pages** | O repositório já está no GitHub. Menos uma conta, menos uma credencial, menos um ficheiro de configuração. O deploy passa a ser um workflow de 15 linhas. |
| Edge function `api` a fazer de RPC para tudo | **PostgREST + RLS** | As regras de acesso no Postgres passam a ser a *única* camada de autorização, em vez de serem duplicadas em SQL e em TypeScript. Menos código e menos maneiras de divergirem. |
| Protocolo de sincronização próprio (gerações, confirmações) | **Tabela `atualizacoes` append-only** | Escrever uma linha nova é idempotente e não depende da ordem de chegada. A união das alterações é a do CRDT, que já a faz. Desaparece a lógica de conflitos. |
| 4 pacotes `workbox-*` + `sw.ts` à mão | **`vite-plugin-pwa` em modo `generateSW`** | O plugin já traz o workbox. |
| `jszip` para o backup | **nada** | O backup passa a ser uma pasta de ficheiros reais na Drive (secção 4). |
| `lucide-react` | **SVG inline** | São ~10 ícones de linha preta. Um ficheiro `icons.tsx` fica menor que a dependência. |
| `date-fns-tz` | **`Intl.DateTimeFormat` com `timeZone`** | Só é preciso um fuso, o de Lisboa. |

### Fica
- **React + TypeScript + Vite** e `vite-plugin-pwa`
- **Dexie** — IndexedDB local (guardar bem código de IndexedDB à mão custa mais do que a dependência)
- **Yjs** — a união das alterações concorrentes; é o que cumpre a regra de ouro
- **Tiptap** (`react`, `starter-kit`, `pm`, `extension-collaboration`, `extension-task-list`, `extension-task-item`, `markdown`) — só para o editor de notas
- **`@supabase/supabase-js`** — autenticação Google, Postgres, Storage
- **`date-fns`** — aritmética de datas
- Dev: `vitest`, `fake-indexeddb`, `@electric-sql/pglite`, `typescript`, `@vitejs/plugin-react`, `prettier`

> **`pglite` não se corta.** Com o RLS a ser a única autorização, os testes que correm o SQL
> real contra uma base em memória passam a ser a rede de segurança mais importante do
> projeto. Dá-lhes prioridade.

### Serviços
1. **GitHub** — código + Actions + Pages
2. **Supabase Free** (região europeia) — Auth, Postgres, Storage, `pg_cron`, **uma** edge function (só para o envio de push, que precisa da chave VAPID privada)
3. **Google Cloud** — cliente OAuth para a entrada e para a Drive

### Estrutura de ficheiros
```
familia/
  index.html
  vite.config.ts            base: '/familia/'
  package.json
  .env.example              VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
                            VITE_VAPID_PUBLIC_KEY, VITE_GOOGLE_CLIENT_ID
  .github/workflows/deploy.yml
  AGENTS.md                 versão curta destas regras
  public/
    icon.svg  icons/*.png  fonts/*.woff2 + licenças
  src/
    main.tsx  App.tsx  style.css  fonts.css  icons.tsx
    screens/    Casa.tsx  Privado.tsx  Arquivos.tsx  Definicoes.tsx
    components/ Cartao.tsx  PostIt.tsx  Editor.tsx  Estado.tsx
    lib/        db.ts  sync.ts  drive.ts  dates.ts  markdown.ts
                supabase.ts  types.ts
  supabase/
    migrations/0001_esquema.sql  0002_cron_lembretes.sql
    functions/push/index.ts
  tests/
  docs/  instalacao.md  publicacao.md  verificacoes.md
```

---

## 3. Dados e sincronização

### Tabelas (Postgres, tudo com RLS ligado)
- `membros` — `user_id`, `email`, `nome`, `aprovado`, `admin`
- `itens` — `id` uuid, `area` (`tarefa` | `nota` | `arquivo`), `dono`, `criado_em`, `apagado_em`
- `atualizacoes` — `id` uuid, `item_id`, `autor`, `dados` bytea (atualização Yjs), `criado_em` — **append-only, sem UPDATE nem DELETE**
- `partilhas` — `item_id`, `membro`, `nivel` (`ver` | `editar`)
- `postits` — `item_id`, `destinatario`, `resumo`, `retirado_em`
- `anexos` — `id`, `item_id`, `caminho`, `versao`, `criado_em`
- `lembretes` — `item_id`, `quando`, `destinatarios`, `chave_unica`, `enviado_em`
- `subscricoes_push` — `membro`, `endpoint`, `chaves`

### Regras de acesso (é aqui que mora a segurança)
Uma função `pode_ver(item_id)` e uma `pode_editar(item_id)` em SQL; todas as políticas as
usam. Ninguém lê `atualizacoes` de um item que não possa ver. **O `admin` não abre notas
privadas de ninguém** — isso é um teste, não um comentário.

### Sincronizar
- **Enviar:** cada alteração local vira uma linha nova em `atualizacoes`. Reenviar a mesma linha não duplica nada (a chave primária é o `id` gerado no cliente).
- **Receber:** puxar as linhas com `criado_em > cursor` dos itens visíveis, aplicar por cima do documento Yjs local, guardar o cursor. Chegar fora de ordem é indiferente.
- Não há resolução de conflitos para escrever: o CRDT é a resolução.
- **Crescimento das linhas:** um dia haverá muitas atualizações por item. Quando um item passar de ~200 linhas, compacta — grava uma linha-instantâneo e marca as anteriores como absorvidas. **Não faças isto na v1**, mas deixa a coluna e o teste preparados.

---

## 4. A pasta `familia` na Drive

O pedido, em português claro: **uma pasta chamada `familia` na Drive de cada pessoa, com os
ficheiros importantes da app lá dentro, atualizada sempre que algo é adicionado ou alterado
na app.** Ficheiros reais, legíveis, não um ZIP.

### O que fica lá dentro
```
familia/
  Tarefas da Casa.md          lista legível, regerada quando muda
  Notas/
    <Título da nota>.md
  Arquivos/
    <Pasta>/<Subpasta>/<ficheiro com o nome original>
  Caixote/                    o que foi apagado na app
  familia.json                estado completo, para recuperar
```

Cada pessoa recebe na sua Drive **só o que tem acesso a ver**. As pastas são diferentes de
pessoa para pessoa, e isso está certo.

### Âmbito e permissões
- **Só `https://www.googleapis.com/auth/drive.file`.** Este âmbito dá acesso exclusivamente aos ficheiros que a própria app cria — a app nunca vê o resto da Drive de ninguém. É uma decisão de privacidade: não a contornes com um âmbito mais largo por ser mais fácil.
- **Autorização à parte**, num botão **"Ligar a minha Drive"** nas Definições. Nunca no ecrã de entrada. Quem não ligar usa a app na mesma, sem perder nada.
- Token de acesso obtido no cliente (Google Identity Services, fluxo de token) e guardado **em memória**. Nada de refresh tokens da Drive guardados no servidor.

### Como espelhar (`src/lib/drive.ts`)
1. Tabela local `espelho`: `chave` (o caminho lógico, ex. `Notas/Compras.md`) → `fileId`, `hash`, `enviadoEm`.
2. **Carimba cada ficheiro** com `appProperties: { itemId, hash }` ao criar. Isto permite reconstruir o mapa num computador novo só por listagem, sem depender do estado local.
3. Fila de espelho: qualquer alteração confirmada localmente — e qualquer alteração recebida de outra pessoa — marca a chave como suja.
4. Um trabalhador esvazia a fila com um atraso de ~10 s (para não fazer um upload por tecla), em série, e **só envia se o hash do conteúdo mudou**.
5. Criar: `POST /upload/drive/v3/files?uploadType=multipart` com `parents: [idDaPastaCerta]`. Atualizar: `PATCH /upload/drive/v3/files/{fileId}?uploadType=media`. Mudar o título de uma nota: `PATCH` ao `name` — **renomeia, não cria um duplicado**.
6. **Apagar na app move o ficheiro para `familia/Caixote/`.** Nunca `files.delete`.
7. Se a pasta `familia` tiver sido apagada ou movida à mão (a chamada devolve 404), recria-a e volta a ligar os ficheiros pelo `appProperties.itemId`.

### O que este espelho não é — e tem de estar escrito na app
- **É de sentido único: da app para a Drive.** Editar um `.md` diretamente na Drive não traz a alteração de volta. Para não se perder trabalho por engano: guarda o `modifiedTime` de cada ficheiro e, se ele tiver mudado sem ter sido a app, **não escrevas por cima** — marca-o nas Definições como *"alterado na Drive, não sincronizado"* e deixa a decisão à pessoa.
- **Corre com a app aberta.** É exatamente quando as alterações acontecem, por isso cumpre o pedido. Mas o que o Eduardo escrever hoje só chega à Drive da mãe quando ela abrir a app. Diz isto por palavras simples nas Definições.
- Texto a mostrar: *"A cópia fica na tua Drive, em ficheiros normais que podes abrir. Para a teres offline, ativa o acesso offline nas definições do Google Drive. O modo offline da Casadacosta funciona independentemente disto."*
- **Falhar na Drive nunca trava a app.** Sem rede, sem token ou com a Drive cheia, o espelho fica para trás e a app continua igual. Uma mensagem, não uma repetida a cada tentativa.

### Testes
A decisão do que espelhar e quando (o que está sujo, o atraso, o hash, a deteção de alteração externa) tem de ser **uma função pura**, separada das chamadas de rede, e coberta em `tests/`. As chamadas à Drive levam um duplo nos testes.

---

## 5. Ordem de execução

Cada fase acaba com o repositório a compilar, com os testes a passar e com um commit em `main`.

### F0 — Repositório e publicação automática
Faz-se **primeiro**, com a app ainda vazia, para que a partir daqui todo o trabalho fique publicado sozinho.
1. `pnpm create vite` (React + TS), `vite-plugin-pwa`, `base: '/familia/'` no `vite.config.ts`.
2. `.github/workflows/deploy.yml`: em `push` para `main` → `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`, publicar `dist/` com `actions/deploy-pages@v4`. As `VITE_*` entram por `env:` a partir dos GitHub Secrets; **se faltarem, o build tem de continuar a funcionar em modo local** — nunca rebentes o CI por falta de segredo.
3. `AGENTS.md` com a versão curta das regras.
4. `docs/publicacao.md`: como publicar, onde estão os segredos, como reverter (`git revert` + push).

**Aceitação:** mudar uma linha no README e ver o site publicado a mudar, sem mais nenhum passo manual.

### F1 — Aviso de versão nova sem atropelar quem escreve
Publicação automática sem isto recarrega por cima de quem está a escrever, e isso contraria a regra de ouro.
1. Ao detetar um service worker em espera, mostrar uma barra: **"Há uma versão nova. Atualizar"**.
2. Só aplica depois de gravar o que está aberto, e **só com clique**. Nunca sozinha.

**Aceitação:** com uma nota a ser editada, publicar uma versão nova mostra a barra e não perde uma letra.

### F2 — O desenho e o esqueleto
1. `fonts.css` com as três fontes locais; `style.css` com as três cores e mais nenhuma.
2. Coluna única centrada, com largura máxima legível. Três entradas sempre visíveis. Zero scroll horizontal.
3. `icons.tsx` com os SVG de linha. `public/icon.svg` com a casa em linha preta sobre branco, e os PNG derivados.
4. Ecrãs vazios mas navegáveis: Casa, Privado, Arquivos, Definições.

**Aceitação:** capturas a 320 px, 768 px e 1920 px, e com o texto do browser a 200%. `grep` ao `style.css` sem cinzentos, `box-shadow`, `transition` nem `animation`.

### F3 — Tudo local, sem servidor nenhum
A app tem de ser inteiramente utilizável antes de existir uma conta.
1. `lib/db.ts` (Dexie), `lib/types.ts`, documentos Yjs por item.
2. `lib/dates.ts`: as três formas de prazo, a recorrência e o agrupamento da secção 1.3. **Testa as mudanças de dia, de mês, de ano e a mudança da hora legal de Lisboa** — é aqui que estas coisas partem.
3. Tarefas: criar, concluir, desfazer, reabrir, repetir, agrupar.
4. Notas: Tiptap com formatação visível, atalhos Markdown, importar/exportar `.md`.
5. Arquivos: pastas, anexos, post-its.
6. Estado visível de gravação e pesquisa global.

**Aceitação:** usar a app de ponta a ponta com a rede desligada, fechar, reabrir, e estar tudo lá.

### F4 — Servidor e contas
1. **(Eduardo)** Criar o projeto Supabase, plano Free, região europeia.
2. `0001_esquema.sql`: as tabelas da secção 3, RLS ligado em todas, funções `pode_ver` / `pode_editar`.
3. **Testes de política com `pglite` antes de ligar a interface:** conta não aprovada não lê nada; nota privada invisível ao `admin`; revogar acesso corta a leitura; `atualizacoes` não aceita UPDATE nem DELETE.
4. Autenticação Google (só identidade, email e perfil). Lista de aprovados no servidor, a começar **só** com `atelierdacostafinanceiro@gmail.com`, que aprova os seguintes.
5. `lib/sync.ts`: enviar e receber `atualizacoes` conforme a secção 3. Anexos no Storage, privados, sem URL pública permanente.

**Aceitação:** entrar com a conta Google no endereço publicado, criar uma tarefa num aparelho e vê-la noutro. Dois aparelhos offline a editar a mesma nota, a reconectar por ordens diferentes, sem perder texto de nenhum.

### F5 — A pasta `familia` na Drive
Toda a secção 4.

**Aceitação:** ligar a Drive, criar uma nota chamada "Compras", e aparecer `familia/Notas/Compras.md` legível na Drive. Mudar o texto → o ficheiro muda, sem duplicados. Mudar o título → o ficheiro é renomeado. Anexar um PDF nos Arquivos → aparece em `familia/Arquivos/...` com o nome original. Apagar na app → vai para `familia/Caixote/`. Editar o `.md` à mão na Drive → a app avisa e **não escreve por cima**.

### F6 — Notificações
1. `0002_cron_lembretes.sql`: `pg_cron` ao minuto a chamar a função `push`.
2. Chave única por lembrete, retentativas, cancelamento ao concluir, reagendar ou retirar acesso.
3. Conteúdo: o título da tarefa e mais nada.
4. Avisar na app que no iPhone é preciso adicionar ao ecrã principal.

**Aceitação:** lembrete a chegar ao computador. iPhone e Android ficam **por verificar em aparelho real** até alguém os testar num.

### F7 — A bateria de verificações
Corre e regista em `docs/verificacoes.md`:
- Prazos, períodos vagos, recorrência e agrupamento nas mudanças de dia, mês, ano e hora legal.
- Dois aparelhos offline na mesma nota e na mesma lista, a reconectar por ordens diferentes, com falhas e reenvios.
- Conta não aprovada, acesso por ligação direta, permissões ver/editar, partilha seletiva, revogação, ficheiros privados.
- Post-it a aguentar até o autor o retirar, e **Mostrar na pasta** sem expor os documentos vizinhos.
- Fechar e reabrir offline, downloads interrompidos, armazenamento cheio, sessão expirada.
- Espelho na Drive: sem rede, sem token, ficheiro alterado à mão, pasta apagada à mão, computador novo a reconstruir o mapa.
- Interface a partir de 320 px, texto a 200%, teclado, zero scroll horizontal.

### F8 — Documentação para os pais
`docs/instalacao.md` e `README.md` com o endereço e as instruções de instalação (iPhone,
Android, computador). Uma página, português simples, sem jargão.

---

## 6. O que só o Eduardo pode fazer

Junta estes pedidos **numa mensagem só**, quando chegares ao primeiro — não o interrompas cinco vezes.

1. Criar o repositório `familia` e ativar **Pages** (origem: GitHub Actions).
2. Criar o projeto **Supabase** (Free, região europeia) e definir a palavra-passe da base de dados.
3. Pôr nos **GitHub Secrets**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_GOOGLE_CLIENT_ID`.
4. No **Google Cloud**: cliente OAuth com o endereço das Pages nas origens autorizadas; âmbitos identidade + email + perfil **e** `drive.file`; app em modo **Testing** com os emails da família como utilizadores de teste (evita a verificação do Google, que aqui não faz sentido).
5. Registar o endereço das Pages nos *redirect URLs* do Supabase Auth.

## 7. Fora de âmbito

Apps nas lojas, alarmes nativos com a app fechada, cifragem de ponta a ponta, OCR nos
arquivos, e ler de volta as edições feitas diretamente na Drive.

Se sobrar tempo: compactação das `atualizacoes` (secção 3) e uma pesquisa melhor. Não abras
as cinco de cima.
