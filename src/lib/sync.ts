// Sincronização: enviar atualizações locais, receber as dos outros.
// Regra de ouro: nunca se perde o que se escreveu — tudo já está no dispositivo
// antes de qualquer envio; o servidor é só o espelho.
import * as Y from 'yjs';
import { cliente } from './supabase';
import { db, carregarDoc, novoId } from './db';
import type { Area } from './types';

export type EstadoSync = 'sem-conta' | 'a-sincronizar' | 'sincronizado' | 'erro';
export type Sessao = { userId: string; email: string; nome: string; admin: boolean; aprovado: boolean } | null;

let ouvintesSync: Array<(s: EstadoSync) => void> = [];
let ouvintesSessao: Array<(s: Sessao) => void> = [];
let estadoAtual: EstadoSync = 'sem-conta';
let sessaoAtual: Sessao = null;
let cursor: string | null = null;
let ciclo: ReturnType<typeof setInterval> | null = null;
let aCorrer = false;

export function estadoSync(): EstadoSync {
  return estadoAtual;
}

export function sessao(): Sessao {
  return sessaoAtual;
}

export function aoMudarSync(fn: (s: EstadoSync) => void): () => void {
  ouvintesSync.push(fn);
  fn(estadoAtual);
  return () => {
    ouvintesSync = ouvintesSync.filter((o) => o !== fn);
  };
}

export function aoMudarSessao(fn: (s: Sessao) => void): () => void {
  ouvintesSessao.push(fn);
  fn(sessaoAtual);
  return () => {
    ouvintesSessao = ouvintesSessao.filter((o) => o !== fn);
  };
}

function porEstado(s: EstadoSync): void {
  estadoAtual = s;
  for (const o of ouvintesSync) o(s);
}

function porSessao(s: Sessao): void {
  sessaoAtual = s;
  for (const o of ouvintesSessao) o(s);
}

// Registar o membro na família (a trigger do servidor aprova os emails conhecidos).
async function registarMembro(userId: string, email: string, nome: string): Promise<{ admin: boolean; aprovado: boolean }> {
  const c = cliente!;
  const existente = await c.from('membros').select('admin, aprovado').eq('user_id', userId).maybeSingle();
  if (existente.data) return existente.data as { admin: boolean; aprovado: boolean };
  await c.from('membros').upsert({ user_id: userId, email, nome }, { onConflict: 'user_id' });
  const depois = await c.from('membros').select('admin, aprovado').eq('user_id', userId).maybeSingle();
  return (depois.data as { admin: boolean; aprovado: boolean }) ?? { admin: false, aprovado: false };
}

export async function iniciarSync(): Promise<void> {
  const c = cliente;
  if (!c) {
    porEstado('sem-conta');
    return;
  }
  const { data } = await c.auth.getSession();
  const user = data.session?.user;
  if (!user || !user.email) {
    porEstado('sem-conta');
    return;
  }
  const membro = await registarMembro(user.id, user.email, (user.user_metadata?.full_name as string) ?? user.email);
  porSessao({ userId: user.id, email: user.email, nome: (user.user_metadata?.name as string) ?? user.email, admin: membro.admin, aprovado: membro.aprovado });

  const guardado = localStorage.getItem('sync-cursor');
  cursor = guardado ?? new Date(0).toISOString();

  if (!ciclo) {
    ciclo = setInterval(() => void sincronizar(), 10_000);
    window.addEventListener('online', () => void sincronizar());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void sincronizar();
    });
  }
  await sincronizar();
}

export function entrarComGoogle(): void {
  if (!cliente) return;
  void cliente.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
}

// Entrada por link mágico: chega um email com um link que abre a app com sessão.
export async function entrarPorEmail(email: string): Promise<string | null> {
  if (!cliente) return 'A app não está ligada ao servidor.';
  const { error } = await cliente.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });
  return error ? error.message : null;
}

export async function sair(): Promise<void> {
  if (!cliente) return;
  await cliente.auth.signOut();
  porSessao(null);
  porEstado('sem-conta');
}

// Uma passagem: enviar o que falta e receber o que é novo.
export async function sincronizar(): Promise<void> {
  if (!cliente || !sessaoAtual || aCorrer) return;
  aCorrer = true;
  try {
    porEstado('a-sincronizar');
    await enviar();
    await receber();
    porEstado('sincronizado');
  } catch {
    porEstado('erro');
  } finally {
    aCorrer = false;
  }
}

async function enviar(): Promise<void> {
  const c = cliente!;
  const pendentes = await db.atualizacoes.where('enviada').equals(0).limit(200).toArray();

  for (const linha of pendentes) {
    const itemLocal = await db.itens.get(linha.itemId);
    if (!itemLocal) continue;

    // O item tem de existir no servidor antes das atualizações.
    const { data: remoto } = await c.from('itens').select('id').eq('id', linha.itemId).maybeSingle();
    if (!remoto) {
      const { error } = await c.from('itens').insert({
        id: itemLocal.id,
        area: itemLocal.area,
        criado_em: itemLocal.criadoEm,
        apagado_em: itemLocal.apagadoEm,
      });
      if (error) throw error;
    } else if (itemLocal.apagadoEm) {
      await c.from('itens').update({ apagado_em: itemLocal.apagadoEm }).eq('id', itemLocal.id);
    }

    const { error } = await c.from('atualizacoes').insert({
      id: novoId(),
      item_id: linha.itemId,
      autor: sessaoAtual!.userId,
      dados: linha.update,
      criado_em: linha.criadoEm,
    });
    if (error) {
      // Item sem acesso (nota privada de outrem, acesso retirado): recusar e
      // manter a alteração recuperável, nunca publicada.
      const msg = (error as { message?: string }).message ?? '';
      if (msg.includes('row-level security') || msg.includes('violates')) {
        await db.atualizacoes.update(linha.id!, { enviada: 2 });
        continue;
      }
      throw error;
    }
    await db.atualizacoes.update(linha.id!, { enviada: 1 });
  }
}

async function receber(): Promise<void> {
  const c = cliente!;
  const agora = new Date().toISOString();

  // Itens visíveis (o RLS filtra as notas privadas dos outros).
  const { data: itens, error: erroItens } = await c.from('itens').select('id, area, dono, criado_em, apagado_em');
  if (erroItens) throw erroItens;

  for (const i of itens ?? []) {
    const local = await db.itens.get(i.id);
    if (!local) {
      await db.itens.add({
        id: i.id,
        area: i.area as Area,
        criadoEm: i.criado_em,
        apagadoEm: i.apagado_em,
        remoto: true,
      });
    } else if (i.apagado_em && !local.apagadoEm) {
      await db.itens.update(i.id, { apagadoEm: i.apagado_em });
    } else if (local.apagadoEm && !i.apagado_em) {
      await db.itens.update(i.id, { apagadoEm: null });
    }
  }

  const { data: linhas, error } = await c
    .from('atualizacoes')
    .select('item_id, dados, criado_em, autor')
    .gt('criado_em', cursor ?? new Date(0).toISOString())
    .order('criado_em', { ascending: true })
    .limit(500);
  if (error) throw error;

  const porItem = new Map<string, Uint8Array[]>();
  for (const l of linhas ?? []) {
    const lista = porItem.get(l.item_id) ?? [];
    lista.push(new Uint8Array(l.dados as ArrayBuffer));
    porItem.set(l.item_id, lista);
  }

  for (const [itemId, updates] of porItem) {
    const local = await db.itens.get(itemId);
    if (!local) continue; // item já não visível
    // Guardar as linhas recebidas localmente (para o doc nascer completo em nova máquina)
    for (const u of updates) {
      const jaExiste = await db.atualizacoes
        .where('itemId').equals(itemId)
        .filter((r) => r.enviada !== 0 && bytesIguais(r.update, u))
        .count();
      if (jaExiste === 0) {
        await db.atualizacoes.add({ itemId, update: u, criadoEm: agora, enviada: 1 });
      }
    }
    // Aplicar por cima do documento vivo (origem 'sync' — não regrava no servidor).
    const doc = await carregarDoc(itemId);
    Y.applyUpdate(doc, Y.mergeUpdates(updates), 'sync');
  }

  cursor = agora;
  localStorage.setItem('sync-cursor', agora);
}

function bytesIguais(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
