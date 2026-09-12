#!/bin/bash
# Aplicar 0002: segredos do vault + agendamento do cron (executa uma vez).
# Precisa de SUPABASE_ACCESS_TOKEN e SUPABASE_SERVICE_KEY no ambiente
# (estão no .env, que nunca vai para o repositório).
set -e
if [ -f .env ]; then set -a; source .env; set +a; fi
: "${SUPABASE_ACCESS_TOKEN:?define SUPABASE_ACCESS_TOKEN no .env}"
: "${SUPABASE_SERVICE_KEY:?define SUPABASE_SERVICE_KEY no .env}"
API="https://api.supabase.com/v1/projects/voyjhuvpwxjuavscpafb/database/query"

curl -s -X POST "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"query\":\"select vault.create_secret('https://voyjhuvpwxjuavscpafb.supabase.co/functions/v1/push', 'casadacosta_push_url');\"}"
echo
curl -s -X POST "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"query\":\"select vault.create_secret('$SUPABASE_SERVICE_KEY', 'casadacosta_push_chave');\"}"
echo
curl -s -X POST "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"query\":\"select cron.schedule('casadacosta-lembretes', '* * * * *', \$\$ select net.http_post( url := (select decrypted_secret from vault.decrypted_secrets where name = 'casadacosta_push_url'), headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'casadacosta_push_chave')), body := '{}'::jsonb ); \$\$);\"}"
echo
curl -s -X POST "$API" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query":"select jobname, schedule from cron.job;"}'
echo
