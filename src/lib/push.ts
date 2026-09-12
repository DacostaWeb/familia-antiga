// Notificações: subscrição Web Push + lembretes (secção 1.7).
// Sem hora definida não se inventa alarme; a linha em `lembretes` só existe
// quando a tarefa tem "Lembrar à hora marcada" ligado E uma hora marcada.
import { cliente } from './supabase';
import { db, carregarDoc } from './db';
import { mapDe } from './tarefa';
import { lerCamposTarefa } from './types';

function urlBase64ParaUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64pad = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64pad);
  const saida = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) saida[i] = bin.charCodeAt(i);
  return saida;
}

export function pushSuportado(): boolean {
  return typeof Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function ativarPush(): Promise<string | null> {
  if (!cliente) return 'A app não está ligada ao servidor.';
  if (!pushSuportado()) return 'Este navegador não suporta notificações.';
  const chave = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!chave) return 'Falta a chave pública de notificações na app.';

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return 'Não deste permissão para notificações.';

  const registo = await navigator.serviceWorker.ready;
  const subscricao = await registo.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ParaUint8Array(chave),
  });

  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return 'Entra primeiro com a tua conta.';

  const json = subscricao.toJSON();
  await cliente.from('subscricoes_push').upsert(
    {
      membro: user.id,
      endpoint: json.endpoint,
      chaves: json.keys,
    },
    { onConflict: 'membro,endpoint' },
  );
  return null;
}

// Percorre as tarefas locais e põe as linhas de lembrete em dia
// (cria as que faltam, apaga as canceladas). Chamado em cada sincronização.
export async function sincronizarLembretes(): Promise<void> {
  if (!cliente) return;
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return;

  const tarefas = await db.itens.where('area').equals('tarefa').filter((i) => !i.apagadoEm).toArray();

  for (const item of tarefas) {
    const doc = await carregarDoc(item.id);
    const campos = lerCamposTarefa(mapDe(doc));
    const quer = campos.lembrarHora && campos.prazo.tipo === 'data' && campos.prazo.data && campos.prazo.hora && !campos.concluidaEm;

    if (quer) {
      const { data, hora } = campos.prazo;
      // data e hora são de Lisboa; o navegador da família está em Lisboa.
      const quando = new Date(`${data}T${hora}:00`).toISOString();
      const chaveUnica = `${item.id}-${data}-${hora}`;
      const { error } = await cliente.from('lembretes').upsert(
        { item_id: item.id, quando, destinatarios: [user.id], chave_unica: chaveUnica },
        { onConflict: 'chave_unica', ignoreDuplicates: true },
      );
      void error; // se falhar, a próxima passada tenta outra vez
    } else {
      // Cancelar ao concluir, ao reagendar ou ao desligar o interruptor.
      await cliente.from('lembretes').delete().eq('item_id', item.id).eq('destinatarios[1]', user.id);
    }
  }
}
