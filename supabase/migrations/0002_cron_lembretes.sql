-- 0002_cron_lembretes.sql — chama a edge function `push` ao minuto (secção 1.7).
-- A extensão pg_cron ativa-se no dashboard (Database → Extensions) antes disto.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- O URL e a chave (service role) vêm de variáveis do projeto, criadas com:
--   select vault.create_secret('<url>', 'casadacosta_push_url');
--   select vault.create_secret('<chave>', 'casadacosta_push_chave');
-- (passo único, feito na consola)

select cron.schedule(
  'casadacosta-lembretes',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'casadacosta_push_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'casadacosta_push_chave')
    ),
    body := '{}'::jsonb
  );
  $$
);
