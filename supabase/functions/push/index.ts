// Edge function `push` — envia os lembretes devidos (secção 1.7 / F6).
// Chamada ao minuto pelo pg_cron. Lê os lembretes a vencer, tira o título da
// tarefa do documento Yjs (sem conteúdo de notas pessoais) e envia Web Push.
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as Y from 'npm:yjs@13';
import webpush from 'npm:web-push@3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

webpush.setVapidDetails(
  'mailto:atelierdacostafinanceiro@gmail.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

async function tituloDaTarefa(itemId: string): Promise<string> {
  const { data } = await supabase
    .from('atualizacoes')
    .select('dados')
    .eq('item_id', itemId)
    .order('criado_em', { ascending: true })
    .limit(500);
  if (!data || data.length === 0) return '';
  const doc = new Y.Doc();
  for (const linha of data) {
    const hex = String(linha.dados).replace(/^\\x/, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    Y.applyUpdate(doc, bytes);
  }
  return String(doc.getMap('estado').get('titulo') ?? '');
}

Deno.serve(async () => {
  const agora = new Date().toISOString();
  const { data: devidos } = await supabase
    .from('lembretes')
    .select('item_id, quando, chave_unica, destinatarios')
    .is('enviado_em', null)
    .lte('quando', agora)
    .limit(50);

  let enviados = 0;
  for (const lembrete of devidos ?? []) {
    // Cancelado? Tarefa apagada ou sem "lembrar à hora" já não envia: o cliente apaga a linha.
    const { data: item } = await supabase.from('itens').select('apagado_em').eq('id', lembrete.item_id).maybeSingle();
    if (!item || item.apagado_em) {
      await supabase.from('lembretes').delete().eq('chave_unica', lembrete.chave_unica);
      continue;
    }

    const titulo = await tituloDaTarefa(lembrete.item_id);
    const { data: subscricoes } = await supabase
      .from('subscricoes_push')
      .select('membro, endpoint, chaves')
      .in('membro', lembrete.destinatarios ?? []);

    for (const sub of subscricoes ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.chaves },
          JSON.stringify({ title: titulo || 'Lembrete', url: '/familia/' }),
        );
        enviados++;
      } catch (erro) {
        // Endpoint morto (410): limpar para não voltar a tentar.
        if ((erro as { statusCode?: number }).statusCode === 410) {
          await supabase.from('subscricoes_push').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    // Marcado como enviado — idempotente, com chave única por lembrete.
    await supabase.from('lembretes').update({ enviado_em: agora }).eq('chave_unica', lembrete.chave_unica);
  }

  return new Response(JSON.stringify({ enviados }), { headers: { 'Content-Type': 'application/json' } });
});
